import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SkeletonRig } from './SkeletonRig';
import {
  SkeletonFigureData,
  LightingStudioState,
  CameraState,
  GizmoMode,
  TransformSpace,
  JointKey,
  AnimationPlayerState,
} from '../types/skeleton';
import { CHROME_MATERIAL_PRESETS, DEFAULT_NEUTRAL_POSE } from './jointDefinitions';
import { ModelInspectionStats, CustomModelOptions } from '../types/modelImport';
import { MOTION_CAPTURE_CLIPS, MotionClip } from '../services/motionCaptureData';

export interface StudioCallbacks {
  onJointSelected?: (figureId: string, jointKey: JointKey | null) => void;
  onFigureSelected?: (figureId: string) => void;
  onPoseChanged?: (figureId: string) => void;
  onTransformChanged?: () => void;
  onAnimationUpdate?: (state: AnimationPlayerState) => void;
}

export class ChromeStudio {
  private container: HTMLElement;
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  public perspectiveCamera: THREE.PerspectiveCamera;
  public orthographicCamera: THREE.OrthographicCamera;
  public activeCamera: THREE.Camera;
  public orbitControls: OrbitControls;
  public transformControls: TransformControls;

  private pmremGenerator: THREE.PMREMGenerator;
  private studioEnvTexture: THREE.Texture | null = null;

  public figures: Map<string, SkeletonRig> = new Map();
  public activeFigureId: string | null = null;
  public selectedJointKey: JointKey | null = null;

  // Studio Lighting & Environment
  private lightingGroup: THREE.Group;
  private floorMesh: THREE.Mesh;
  public lightingState: LightingStudioState;
  public cachedGLTFScene: THREE.Group | null = null;
  public cachedGLTFBuffer: ArrayBuffer | null = null;
  private bgTexture: THREE.Texture | null = null;
  private floorTexture: THREE.Texture | null = null;

  // Gizmo & Interaction
  public gizmoMode: GizmoMode = 'rotate';
  public transformSpace: TransformSpace = 'local';
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private callbacks: StudioCallbacks = {};
  private animationFrameId: number | null = null;

  constructor(container: HTMLElement, callbacks: StudioCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0b0c10');

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);

    // 3. Cameras
    const aspect = container.clientWidth / container.clientHeight;
    this.perspectiveCamera = new THREE.PerspectiveCamera(45, aspect, 0.05, 100);
    this.perspectiveCamera.position.set(0, 1.4, 3.8);

    const frustumSize = 3;
    this.orthographicCamera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.05,
      100
    );
    this.orthographicCamera.position.set(0, 1.4, 3.8);

    this.activeCamera = this.perspectiveCamera;

    // 4. OrbitControls
    this.orbitControls = new OrbitControls(this.activeCamera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.target.set(0, 1.0, 0);
    this.orbitControls.maxDistance = 25;
    this.orbitControls.minDistance = 0.4;
    this.orbitControls.update();

    // 5. TransformControls
    this.transformControls = new TransformControls(this.activeCamera, this.renderer.domElement);
    this.transformControls.size = 0.8;
    this.transformControls.setMode('rotate');
    this.transformControls.setSpace('local');
    this.scene.add(this.transformControls.getHelper());

    // Disable orbit controls while dragging gizmo
    this.transformControls.addEventListener('dragging-changed', (event) => {
      this.orbitControls.enabled = !event.value;
      if (!event.value) {
        // Dragging finished: sync pose and save history
        if (this.activeFigureId) {
          const rig = this.figures.get(this.activeFigureId);
          if (rig && this.selectedJointKey) {
            const grp = rig.getJointGroup(this.selectedJointKey);
            if (grp) {
              const deg: [number, number, number] = [
                Math.round(THREE.MathUtils.radToDeg(grp.rotation.x)),
                Math.round(THREE.MathUtils.radToDeg(grp.rotation.y)),
                Math.round(THREE.MathUtils.radToDeg(grp.rotation.z)),
              ];
              rig.setJointRotation(this.selectedJointKey, { x: deg[0], y: deg[1], z: deg[2] });
              this.callbacks.onPoseChanged?.(this.activeFigureId);
            }
          } else if (rig && this.gizmoMode === 'translate') {
            const root = rig.getRootGroup();
            rig.setPosition([root.position.x, root.position.y, root.position.z]);
            this.callbacks.onPoseChanged?.(this.activeFigureId);
          }
        }
      }
    });

    this.transformControls.addEventListener('change', () => {
      // Real-time synchronization while dragging the rotation gizmo
      if (this.transformControls.dragging && this.activeFigureId && this.selectedJointKey) {
        const rig = this.figures.get(this.activeFigureId);
        if (rig) {
          const grp = rig.getJointGroup(this.selectedJointKey);
          if (grp) {
            const degX = Math.round(THREE.MathUtils.radToDeg(grp.rotation.x));
            const degY = Math.round(THREE.MathUtils.radToDeg(grp.rotation.y));
            const degZ = Math.round(THREE.MathUtils.radToDeg(grp.rotation.z));
            rig.currentPose.joints[this.selectedJointKey] = { x: degX, y: degY, z: degZ };
            this.callbacks.onTransformChanged?.();
          }
        }
      }
    });

    // 6. PMREM Studio Environment for Mirror Chrome
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    this.setupStudioEnvironment();

    // 7. Lighting System
    this.lightingGroup = new THREE.Group();
    this.scene.add(this.lightingGroup);
    this.lightingState = this.getDefaultLightingState();

    // Floor Mesh (shadow receiver & subtle reflections)
    const floorGeom = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f1117,
      roughness: 0.25,
      metalness: 0.6,
      envMap: this.studioEnvTexture,
    });
    this.floorMesh = new THREE.Mesh(floorGeom, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.y = 0;
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    this.buildStudioLights();

    // 8. Event Listeners
    window.addEventListener('resize', this.onWindowResize);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);

    // 9. Start Render Loop
    this.animate();
  }

  // ==========================================
  // ENVIRONMENT & CHROME REFLECTIONS
  // ==========================================

  private setupStudioEnvironment() {
    // Generate high-quality HDR studio room environment
    const room = new RoomEnvironment();
    this.studioEnvTexture = this.pmremGenerator.fromScene(room).texture;
    this.scene.environment = this.studioEnvTexture;
    room.dispose();
  }

  public getEnvironmentTexture(): THREE.Texture | null {
    return this.studioEnvTexture;
  }

  // ==========================================
  // STUDIO LIGHTING
  // ==========================================

  private getDefaultLightingState(): LightingStudioState {
    return {
      preset: 'black_gallery',
      backgroundStyle: 'black_gallery',
      ambientIntensity: 0.35,
      environmentIntensity: 1.8,
      floorVisible: true,
      floorReflective: true,
      floorColor: '#0f1117',
      lights: [
        {
          id: 'key_light',
          name: 'Key Softbox',
          type: 'key',
          enabled: true,
          color: '#ffffff',
          intensity: 2.8,
          position: [2.5, 3.2, 3.0],
          castShadow: true,
        },
        {
          id: 'fill_light',
          name: 'Fill Light',
          type: 'fill',
          enabled: true,
          color: '#cbd5e1',
          intensity: 1.2,
          position: [-3.0, 2.0, 2.5],
          castShadow: false,
        },
        {
          id: 'rim_light',
          name: 'Rim Strip Light',
          type: 'rim',
          enabled: true,
          color: '#38bdf8',
          intensity: 3.5,
          position: [0.0, 2.8, -3.2],
          castShadow: true,
        },
        {
          id: 'overhead_light',
          name: 'Overhead Softbox',
          type: 'overhead',
          enabled: true,
          color: '#f8fafc',
          intensity: 1.6,
          position: [0.0, 5.0, 0.0],
          castShadow: true,
        },
      ],
    };
  }

  public buildStudioLights() {
    // Clear existing lights
    while (this.lightingGroup.children.length > 0) {
      const child = this.lightingGroup.children[0];
      this.lightingGroup.remove(child);
      if ((child as any).dispose) (child as any).dispose();
    }

    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, this.lightingState.ambientIntensity);
    this.lightingGroup.add(ambient);

    // Configured studio lights
    this.lightingState.lights.forEach((cfg) => {
      if (!cfg.enabled) return;

      const light = new THREE.DirectionalLight(new THREE.Color(cfg.color), cfg.intensity);
      light.position.set(...cfg.position);
      light.castShadow = cfg.castShadow;

      if (cfg.castShadow) {
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 15;
        light.shadow.camera.left = -3;
        light.shadow.camera.right = 3;
        light.shadow.camera.top = 3;
        light.shadow.camera.bottom = -1;
        light.shadow.bias = -0.0005;
      }

      this.lightingGroup.add(light);
    });

    // Floor visibility and material
    this.floorMesh.visible = this.lightingState.floorVisible;
    (this.floorMesh.material as THREE.MeshStandardMaterial).color.set(this.lightingState.floorColor);
    (this.floorMesh.material as THREE.MeshStandardMaterial).roughness = this.lightingState.floorReflective ? 0.15 : 0.8;
  }

  public applyLightingPreset(presetId: string) {
    this.lightingState.preset = presetId;

    switch (presetId) {
      case 'black_gallery':
        this.scene.background = new THREE.Color('#0b0c10');
        this.lightingState.backgroundStyle = 'black_gallery';
        this.lightingState.floorColor = '#0b0c10';
        this.lightingState.ambientIntensity = 0.25;
        this.lightingState.lights[0].intensity = 2.8;
        this.lightingState.lights[0].color = '#ffffff';
        this.lightingState.lights[1].intensity = 0.9;
        this.lightingState.lights[2].intensity = 3.8;
        this.lightingState.lights[2].color = '#38bdf8';
        break;

      case 'high_key':
        this.scene.background = new THREE.Color('#f1f5f9');
        this.lightingState.backgroundStyle = 'high_key';
        this.lightingState.floorColor = '#e2e8f0';
        this.lightingState.ambientIntensity = 0.8;
        this.lightingState.lights[0].intensity = 3.2;
        this.lightingState.lights[0].color = '#ffffff';
        this.lightingState.lights[1].intensity = 2.4;
        this.lightingState.lights[2].intensity = 2.0;
        this.lightingState.lights[2].color = '#ffffff';
        break;

      case 'dramatic_rim':
        this.scene.background = new THREE.Color('#030712');
        this.lightingState.backgroundStyle = 'black_gallery';
        this.lightingState.floorColor = '#030712';
        this.lightingState.ambientIntensity = 0.15;
        this.lightingState.lights[0].intensity = 1.0;
        this.lightingState.lights[1].intensity = 0.3;
        this.lightingState.lights[2].intensity = 5.5;
        this.lightingState.lights[2].color = '#60a5fa';
        break;

      case 'cinematic_blue_magenta':
        this.scene.background = new THREE.Color('#050510');
        this.lightingState.backgroundStyle = 'deep_indigo';
        this.lightingState.floorColor = '#050510';
        this.lightingState.ambientIntensity = 0.3;
        this.lightingState.lights[0].intensity = 3.0;
        this.lightingState.lights[0].color = '#06b6d4'; // Cyan
        this.lightingState.lights[1].intensity = 2.2;
        this.lightingState.lights[1].color = '#d946ef'; // Magenta
        this.lightingState.lights[2].intensity = 4.2;
        this.lightingState.lights[2].color = '#ec4899';
        break;

      case 'warm_gold':
        this.scene.background = new THREE.Color('#0f0d0a');
        this.lightingState.backgroundStyle = 'dark_platinum';
        this.lightingState.floorColor = '#120f0c';
        this.lightingState.ambientIntensity = 0.4;
        this.lightingState.lights[0].intensity = 3.2;
        this.lightingState.lights[0].color = '#fbbf24'; // Gold
        this.lightingState.lights[1].intensity = 1.5;
        this.lightingState.lights[1].color = '#fed7aa';
        this.lightingState.lights[2].intensity = 3.0;
        this.lightingState.lights[2].color = '#fed7aa';
        break;

      case 'sky_clouds':
        this.scene.background = new THREE.Color('#38bdf8');
        this.lightingState.backgroundStyle = 'sky_clouds';
        this.lightingState.backgroundColor = '#38bdf8';
        this.lightingState.floorColor = '#64748b';
        this.lightingState.ambientIntensity = 0.65;
        this.lightingState.lights[0].intensity = 3.6;
        this.lightingState.lights[0].color = '#fef08a'; // Sunlight
        this.lightingState.lights[1].intensity = 2.0;
        this.lightingState.lights[1].color = '#7dd3fc'; // Sky fill
        this.lightingState.lights[2].intensity = 2.8;
        this.lightingState.lights[2].color = '#e0f2fe';
        break;

      case 'ocean_sea':
        this.scene.background = new THREE.Color('#0284c7');
        this.lightingState.backgroundStyle = 'ocean_sea';
        this.lightingState.backgroundColor = '#0284c7';
        this.lightingState.floorColor = '#0f766e';
        this.lightingState.ambientIntensity = 0.5;
        this.lightingState.lights[0].intensity = 3.2;
        this.lightingState.lights[0].color = '#38bdf8'; // Aqua
        this.lightingState.lights[1].intensity = 2.2;
        this.lightingState.lights[1].color = '#0d9488'; // Teal
        this.lightingState.lights[2].intensity = 4.0;
        this.lightingState.lights[2].color = '#22d3ee';
        break;

      case 'sunset':
        this.scene.background = new THREE.Color('#701a75');
        this.lightingState.backgroundStyle = 'sunset';
        this.lightingState.backgroundColor = '#701a75';
        this.lightingState.floorColor = '#4a044e';
        this.lightingState.ambientIntensity = 0.45;
        this.lightingState.lights[0].intensity = 3.8;
        this.lightingState.lights[0].color = '#f97316'; // Orange sunset
        this.lightingState.lights[1].intensity = 2.0;
        this.lightingState.lights[1].color = '#d946ef'; // Magenta
        this.lightingState.lights[2].intensity = 4.5;
        this.lightingState.lights[2].color = '#fbbf24'; // Warm gold rim
        break;

      case 'cyberpunk':
        this.scene.background = new THREE.Color('#09090b');
        this.lightingState.backgroundStyle = 'cyberpunk';
        this.lightingState.backgroundColor = '#09090b';
        this.lightingState.floorColor = '#18181b';
        this.lightingState.ambientIntensity = 0.25;
        this.lightingState.lights[0].intensity = 3.5;
        this.lightingState.lights[0].color = '#06b6d4'; // Cyan
        this.lightingState.lights[1].intensity = 3.0;
        this.lightingState.lights[1].color = '#ec4899'; // Hot pink
        this.lightingState.lights[2].intensity = 5.0;
        this.lightingState.lights[2].color = '#a855f7'; // Purple rim
        break;

      case 'space_deep':
        this.scene.background = new THREE.Color('#020617');
        this.lightingState.backgroundStyle = 'deep_indigo';
        this.lightingState.backgroundColor = '#020617';
        this.lightingState.floorColor = '#030712';
        this.lightingState.ambientIntensity = 0.15;
        this.lightingState.lights[0].intensity = 2.5;
        this.lightingState.lights[0].color = '#f8fafc';
        this.lightingState.lights[1].intensity = 1.0;
        this.lightingState.lights[1].color = '#38bdf8';
        this.lightingState.lights[2].intensity = 5.2;
        this.lightingState.lights[2].color = '#818cf8';
        break;
    }

    if (this.lightingState.backgroundImage) {
      // Keep background image if user uploaded one
      this.setBackgroundImage(this.lightingState.backgroundImage);
    }

    this.buildStudioLights();
  }

  public setBackgroundImage(dataUrl: string | null) {
    this.lightingState.backgroundImage = dataUrl;
    if (this.bgTexture) {
      this.bgTexture.dispose();
      this.bgTexture = null;
    }

    if (dataUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(dataUrl, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        this.bgTexture = texture;
        this.scene.background = texture;
        this.lightingState.backgroundStyle = 'custom_image';
      });
    } else {
      const col = this.lightingState.backgroundColor || '#0b0c10';
      this.scene.background = new THREE.Color(col);
      this.lightingState.backgroundStyle = 'studio_seamless';
    }
  }

  public setBackgroundColor(color: string) {
    this.lightingState.backgroundColor = color;
    if (!this.lightingState.backgroundImage) {
      this.scene.background = new THREE.Color(color);
    }
  }

  public setFloorTexture(dataUrl: string | null, repeat: number = 4) {
    this.lightingState.floorTexture = dataUrl;
    this.lightingState.floorRepeat = repeat;
    const floorMat = this.floorMesh.material as THREE.MeshStandardMaterial;

    if (this.floorTexture) {
      this.floorTexture.dispose();
      this.floorTexture = null;
    }

    if (dataUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(dataUrl, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeat, repeat);
        texture.colorSpace = THREE.SRGBColorSpace;
        this.floorTexture = texture;
        floorMat.map = texture;
        floorMat.color.set('#ffffff'); // Neutral white so custom image colors show accurately
        floorMat.roughness = this.lightingState.floorReflective ? 0.25 : 0.85;
        floorMat.needsUpdate = true;
      });
    } else {
      floorMat.map = null;
      floorMat.color.set(this.lightingState.floorColor);
      floorMat.roughness = this.lightingState.floorReflective ? 0.15 : 0.8;
      floorMat.needsUpdate = true;
    }
  }

  public setFloorRepeat(repeat: number) {
    this.lightingState.floorRepeat = repeat;
    if (this.floorTexture) {
      this.floorTexture.repeat.set(repeat, repeat);
      this.floorTexture.needsUpdate = true;
    }
  }

  public setFloorVisible(visible: boolean) {
    this.lightingState.floorVisible = visible;
    this.floorMesh.visible = visible;
  }

  public setFloorColor(color: string) {
    this.lightingState.floorColor = color;
    const floorMat = this.floorMesh.material as THREE.MeshStandardMaterial;
    if (!this.lightingState.floorTexture) {
      floorMat.color.set(color);
      floorMat.needsUpdate = true;
    }
  }

  public setFloorReflective(reflective: boolean) {
    this.lightingState.floorReflective = reflective;
    const floorMat = this.floorMesh.material as THREE.MeshStandardMaterial;
    floorMat.roughness = reflective ? 0.15 : 0.85;
    floorMat.metalness = reflective ? 0.6 : 0.1;
    floorMat.needsUpdate = true;
  }

  // ==========================================
  // FIGURE MANAGEMENT (MULTI-SKELETON)
  // ==========================================

  public addFigure(data: SkeletonFigureData): SkeletonRig {
    const rig = new SkeletonRig(data);
    if (this.studioEnvTexture) {
      rig.updateMaterial(data.material, this.studioEnvTexture);
    }
    this.scene.add(rig.getRootGroup());

    // Add IK target handles to scene
    Object.values(rig.ikTargets).forEach((t) => this.scene.add(t));

    this.figures.set(rig.id, rig);

    if (!this.activeFigureId) {
      this.setActiveFigure(rig.id);
    }

    return rig;
  }

  public removeFigure(id: string) {
    const rig = this.figures.get(id);
    if (!rig) return;

    this.scene.remove(rig.getRootGroup());
    Object.values(rig.ikTargets).forEach((t) => this.scene.remove(t));
    rig.dispose();
    this.figures.delete(id);

    if (this.activeFigureId === id) {
      const remaining = Array.from(this.figures.keys());
      this.setActiveFigure(remaining.length > 0 ? remaining[0] : null);
    }
  }

  public duplicateFigure(id: string): SkeletonRig | null {
    const source = this.figures.get(id);
    if (!source) return null;

    const newId = `figure_${Date.now()}`;
    const newPos: [number, number, number] = [
      source.currentPose.position[0] + 0.65,
      source.currentPose.position[1],
      source.currentPose.position[2],
    ];

    const copyData: SkeletonFigureData = {
      id: newId,
      name: `${source.name} (Kopya)`,
      visible: true,
      locked: false,
      ikEnabled: source.ikEnabled,
      enforceJointLimits: source.enforceJointLimits,
      material: JSON.parse(JSON.stringify(source.currentMaterialSettings)),
      pose: {
        ...JSON.parse(JSON.stringify(source.currentPose)),
        position: newPos,
      },
    };

    // If anatomical model GLB is cached, duplicate the authentic anatomical skeleton!
    let newRig: SkeletonRig;
    if (this.cachedGLTFScene) {
      newRig = this.addCustomModelFigure(this.cachedGLTFScene, {
        name: copyData.name,
        applyChromeMaterial: true,
      });
      newRig.setPosition(newPos);
      newRig.applyPose(copyData.pose);
      if (this.studioEnvTexture) {
        newRig.updateMaterial(copyData.material, this.studioEnvTexture);
      }
    } else {
      newRig = this.addFigure(copyData);
    }

    this.setActiveFigure(newRig.id);
    return newRig;
  }

  public setActiveFigure(id: string | null) {
    this.activeFigureId = id;
    this.selectedJointKey = null;
    this.transformControls.detach();

    this.figures.forEach((rig, fId) => {
      rig.selectJoint(null);
    });

    if (id) {
      this.callbacks.onFigureSelected?.(id);
    }
  }

  public getActiveFigure(): SkeletonRig | null {
    if (!this.activeFigureId) return null;
    return this.figures.get(this.activeFigureId) || null;
  }

  // ==========================================
  // JOINT SELECTION & GIZMO MANIPULATION
  // ==========================================

  public selectJoint(jointKey: JointKey | null) {
    this.selectedJointKey = jointKey;
    const rig = this.getActiveFigure();

    if (!rig) {
      this.transformControls.detach();
      return;
    }

    rig.selectJoint(jointKey);

    if (!jointKey) {
      if (this.gizmoMode === 'translate') {
        this.attachGizmoToRoot(rig);
      } else {
        this.transformControls.detach();
      }
      this.callbacks.onJointSelected?.(rig.id, null);
      return;
    }

    const jointGrp = rig.getJointGroup(jointKey);
    if (jointGrp) {
      this.transformControls.attach(jointGrp);
      // Strictly lock to rotate: joints never translate away from sockets!
      const isRoot = jointKey === 'pelvis';
      this.transformControls.setMode(isRoot && this.gizmoMode === 'translate' ? 'translate' : 'rotate');
      this.transformControls.setSpace(this.transformSpace);
    }

    this.callbacks.onJointSelected?.(rig.id, jointKey);
  }

  public selectBone(boneName: string | null) {
    const rig = this.getActiveFigure();
    if (!rig) {
      this.transformControls.detach();
      return;
    }

    rig.selectBoneByName(boneName);
    this.selectedJointKey = rig.selectedJointKey;

    if (!boneName || !rig.selectedBoneNode) {
      if (this.gizmoMode === 'translate') {
        this.attachGizmoToRoot(rig);
      } else {
        this.transformControls.detach();
      }
      this.callbacks.onJointSelected?.(rig.id, null);
      return;
    }

    this.transformControls.attach(rig.selectedBoneNode);
    // Strictly lock to rotate: bones rotate around anatomical socket!
    const isRoot = rig.selectedJointKey === 'pelvis';
    this.transformControls.setMode(isRoot && this.gizmoMode === 'translate' ? 'translate' : 'rotate');
    this.transformControls.setSpace(this.transformSpace);

    this.callbacks.onJointSelected?.(rig.id, rig.selectedJointKey);
  }

  public setGizmoMode(mode: GizmoMode) {
    this.gizmoMode = mode;
    const rig = this.getActiveFigure();
    if (!rig) return;

    if (mode === 'translate') {
      if (!this.selectedJointKey && !rig.selectedBoneNode) {
        this.attachGizmoToRoot(rig);
      } else if (this.selectedJointKey === 'pelvis') {
        this.transformControls.setMode('translate');
      } else {
        // Individual joints are locked to rotation so limbs never detach
        this.transformControls.setMode('rotate');
      }
    } else if (mode === 'rotate') {
      if (rig.selectedBoneNode) {
        this.transformControls.attach(rig.selectedBoneNode);
        this.transformControls.setMode('rotate');
      } else if (this.selectedJointKey) {
        const jGrp = rig.getJointGroup(this.selectedJointKey);
        if (jGrp) {
          this.transformControls.attach(jGrp);
          this.transformControls.setMode('rotate');
        }
      } else {
        this.transformControls.detach();
      }
    } else if (mode === 'ik_target') {
      // Attach to left hand IK target by default
      this.transformControls.attach(rig.ikTargets.hand_L);
      this.transformControls.setMode('translate');
    }
  }

  private attachGizmoToRoot(rig: SkeletonRig) {
    this.transformControls.attach(rig.getRootGroup());
    this.transformControls.setMode('translate');
    this.transformControls.setSpace(this.transformSpace);
  }

  public setTransformSpace(space: TransformSpace) {
    this.transformSpace = space;
    this.transformControls.setSpace(space);
  }

  // ==========================================
  // RAYCAST PICKING
  // ==========================================

  private pointerDownPos = { x: 0, y: 0 };

  private onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    this.pointerDownPos = { x: event.clientX, y: event.clientY };
  };

  private onPointerUp = (event: PointerEvent) => {
    if (event.button !== 0) return;
    if (this.transformControls.dragging) return;

    // Only handle true clicks (not camera orbit drag)
    const dist = Math.hypot(event.clientX - this.pointerDownPos.x, event.clientY - this.pointerDownPos.y);
    if (dist > 6) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.activeCamera);

    // Collect all bone meshes across all figures safely
    const candidateMeshes: THREE.Mesh[] = [];
    this.figures.forEach((rig) => {
      if (rig.visible && !rig.locked && rig.nodes?.boneMeshes) {
        candidateMeshes.push(...rig.nodes.boneMeshes);
      }
    });

    const intersects = this.raycaster.intersectObjects(candidateMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      let { figureId, jointKey, boneName } = hit.userData;

      const targetRig = figureId ? this.figures.get(figureId) : null;

      // Distance-based 3D elbow socket snapping (reliable in all camera angles & poses)
      if (targetRig) {
        const elL = targetRig.getJointGroup('lower_arm_L');
        const elR = targetRig.getJointGroup('lower_arm_R');
        if (elL) {
          const elPosL = new THREE.Vector3();
          elL.getWorldPosition(elPosL);
          if (intersects[0].point.distanceTo(elPosL) < 0.16) {
            jointKey = 'lower_arm_L';
          }
        }
        if (elR) {
          const elPosR = new THREE.Vector3();
          elR.getWorldPosition(elPosR);
          if (intersects[0].point.distanceTo(elPosR) < 0.16) {
            jointKey = 'lower_arm_R';
          }
        }
      }

      // Smart Vertebral & Cervical Spine picking based on hit height
      if (hit.userData?.isSkinnedSpine || hit.name === 'Vertebral_Spine_Column' || hit.name === 'Cervical_Vertebrae_Skinned') {
        const pointY = intersects[0].point.y;
        if (pointY < 1.15) {
          jointKey = 'spine_lumbar';
        } else if (pointY < 1.45) {
          jointKey = 'spine_thoracic';
        } else {
          jointKey = 'spine_cervical';
        }
      } else if (hit.userData?.isElbowPicker) {
        jointKey = hit.userData.jointKey;
      } else if (hit.name?.includes('Ulna_Forearm_L') || hit.name?.includes('Radius_Forearm_L')) {
        jointKey = 'lower_arm_L';
      } else if (hit.name?.includes('Ulna_Forearm_R') || hit.name?.includes('Radius_Forearm_R')) {
        jointKey = 'lower_arm_R';
      } else if (hit.name?.includes('Hand_Digits_L')) {
        jointKey = 'wrist_L';
      } else if (hit.name?.includes('Hand_Digits_R')) {
        jointKey = 'wrist_R';
      }

      const rig = this.figures.get(figureId);
      if (figureId && rig) {
        if (figureId !== this.activeFigureId) {
          this.setActiveFigure(figureId);
        }

        if (jointKey) {
          this.selectJoint(jointKey);
        } else if (boneName && rig.gltfBones.has(boneName)) {
          this.selectBone(boneName);
        }
      }
    } else {
      // Clicked on empty space / floor: deselect
      this.selectJoint(null);
    }
  };

  private onPointerMove = (event: PointerEvent) => {
    if (this.transformControls.dragging) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.activeCamera);

    const candidateMeshes: THREE.Mesh[] = [];
    this.figures.forEach((rig) => {
      if (rig.visible && !rig.locked) {
        candidateMeshes.push(...rig.nodes.boneMeshes);
      }
    });

    const intersects = this.raycaster.intersectObjects(candidateMeshes, false);
    if (intersects.length > 0) {
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      this.renderer.domElement.style.cursor = 'default';
    }
  };

  // ==========================================
  // CAMERA CONTROLS & VIEWS
  // ==========================================

  public setCameraView(view: 'front' | 'back' | 'left' | 'right' | 'top' | 'three_quarter' | 'reset') {
    const target = this.orbitControls.target.clone();
    const dist = 3.8;

    switch (view) {
      case 'front':
        this.activeCamera.position.set(target.x, target.y + 0.2, target.z + dist);
        break;
      case 'back':
        this.activeCamera.position.set(target.x, target.y + 0.2, target.z - dist);
        break;
      case 'left':
        this.activeCamera.position.set(target.x - dist, target.y + 0.2, target.z);
        break;
      case 'right':
        this.activeCamera.position.set(target.x + dist, target.y + 0.2, target.z);
        break;
      case 'top':
        this.activeCamera.position.set(target.x, target.y + dist, target.z + 0.01);
        break;
      case 'three_quarter':
        this.activeCamera.position.set(target.x + 2.5, target.y + 1.2, target.z + 2.8);
        break;
      case 'reset':
      default:
        this.activeCamera.position.set(0, 1.4, 3.8);
        this.orbitControls.target.set(0, 1.0, 0);
        break;
    }

    this.activeCamera.lookAt(target);
    this.orbitControls.update();
  }

  public focusOnSelection() {
    const rig = this.getActiveFigure();
    if (!rig) return;

    const focusPos = new THREE.Vector3();
    if (this.selectedJointKey) {
      const jGrp = rig.getJointGroup(this.selectedJointKey);
      if (jGrp) jGrp.getWorldPosition(focusPos);
    } else {
      rig.getRootGroup().getWorldPosition(focusPos);
      focusPos.y += 1.0;
    }

    this.orbitControls.target.copy(focusPos);
    this.orbitControls.update();
  }

  public toggleOrthographicCamera(useOrtho: boolean) {
    const oldCam = this.activeCamera;
    const newCam = useOrtho ? this.orthographicCamera : this.perspectiveCamera;

    newCam.position.copy(oldCam.position);
    newCam.rotation.copy(oldCam.rotation);

    this.activeCamera = newCam;
    this.orbitControls.object = newCam;
    this.transformControls.camera = newCam;
    this.orbitControls.update();
  }

  public setExposure(val: number) {
    this.renderer.toneMappingExposure = val;
  }

  public getCameraState(): CameraState {
    const isOrthographic = this.activeCamera === this.orthographicCamera;
    return {
      fov: this.perspectiveCamera.fov,
      isOrthographic,
      position: [this.activeCamera.position.x, this.activeCamera.position.y, this.activeCamera.position.z],
      target: [this.orbitControls.target.x, this.orbitControls.target.y, this.orbitControls.target.z],
    };
  }

  public setCameraState(state: CameraState) {
    if (state.isOrthographic !== (this.activeCamera === this.orthographicCamera)) {
      this.toggleOrthographicCamera(state.isOrthographic);
    }
    this.perspectiveCamera.fov = state.fov || 45;
    this.perspectiveCamera.updateProjectionMatrix();
    this.activeCamera.position.set(...state.position);
    this.orbitControls.target.set(...state.target);
    this.activeCamera.lookAt(this.orbitControls.target);
    this.orbitControls.update();
  }

  public captureThumbnail(width = 360, height = 360): string {
    const prevSize = new THREE.Vector2();
    this.renderer.getSize(prevSize);
    const prevGizmoVisible = this.transformControls.getHelper().visible;

    this.transformControls.getHelper().visible = false;
    this.renderer.setSize(width, height, false);
    this.renderer.render(this.scene, this.activeCamera);
    const dataUrl = this.renderer.domElement.toDataURL('image/jpeg', 0.85);

    this.renderer.setSize(prevSize.x, prevSize.y, false);
    this.transformControls.getHelper().visible = prevGizmoVisible;
    return dataUrl;
  }

  // ==========================================
  // HIGH-RESOLUTION EXPORT
  // ==========================================

  public exportImage(options: {
    resolutionMultiplier: number;
    transparentBackground: boolean;
  }): string {
    const { resolutionMultiplier = 1, transparentBackground = false } = options;

    const prevSize = new THREE.Vector2();
    this.renderer.getSize(prevSize);

    // Hide UI gizmos, helpers, and floor if transparent
    const prevGizmoVisible = this.transformControls.getHelper().visible;
    const prevFloorVisible = this.floorMesh.visible;
    const prevBg = this.scene.background;

    this.transformControls.getHelper().visible = false;
    this.figures.forEach((rig) => rig.selectJoint(null));

    if (transparentBackground) {
      this.floorMesh.visible = false;
      this.scene.background = null;
    }

    // Render at target high resolution
    const targetWidth = prevSize.x * resolutionMultiplier;
    const targetHeight = prevSize.y * resolutionMultiplier;
    this.renderer.setSize(targetWidth, targetHeight, false);
    this.renderer.render(this.scene, this.activeCamera);

    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    // Restore original size and visibility
    this.renderer.setSize(prevSize.x, prevSize.y, false);
    this.transformControls.getHelper().visible = prevGizmoVisible;
    this.floorMesh.visible = prevFloorVisible;
    this.scene.background = prevBg;

    if (this.selectedJointKey && this.activeFigureId) {
      this.selectJoint(this.selectedJointKey);
    }

    return dataUrl;
  }

  // ==========================================
  // COLLISION / OVERLAP DIAGNOSTICS
  // ==========================================

  public checkIntersections(): { overlapping: boolean; details: string } {
    const rigs = Array.from(this.figures.values());
    if (rigs.length < 2) {
      return { overlapping: false, details: 'Only one figure in scene' };
    }

    const boxA = new THREE.Box3().setFromObject(rigs[0].getRootGroup());
    const boxB = new THREE.Box3().setFromObject(rigs[1].getRootGroup());

    if (boxA.intersectsBox(boxB)) {
      return {
        overlapping: true,
        details: `${rigs[0].name} and ${rigs[1].name} bounding volumes overlap (intimate composition or contact).`,
      };
    }

    return { overlapping: false, details: 'No bounding volume collision detected.' };
  }

  // ==========================================
  // CUSTOM GLTF / GLB MODEL IMPORT & INSPECTION
  // ==========================================

  public inspectGLTFModel(gltf: any, filename = 'model.glb'): ModelInspectionStats {
    const root = gltf.scene || gltf.scenes?.[0] || new THREE.Group();
    let meshCount = 0;
    let vertexCount = 0;
    let triangleCount = 0;
    let boneCount = 0;
    const bonesDetected: string[] = [];
    let hasSkinnedMesh = false;
    const materialsSet = new Set<string>();

    root.traverse((node: any) => {
      if (node.isBone) {
        boneCount++;
        if (node.name && bonesDetected.length < 25) {
          bonesDetected.push(node.name);
        }
      }
      if (node.isSkinnedMesh) {
        hasSkinnedMesh = true;
      }
      if (node.isMesh) {
        meshCount++;
        const geom = node.geometry;
        if (geom) {
          if (geom.attributes?.position) {
            vertexCount += geom.attributes.position.count;
          }
          if (geom.index) {
            triangleCount += Math.round(geom.index.count / 3);
          } else if (geom.attributes?.position) {
            triangleCount += Math.round(geom.attributes.position.count / 3);
          }
        }
        if (node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach((m: any) => materialsSet.add(m.name || 'Unnamed Material'));
          } else {
            materialsSet.add(node.material.name || 'Unnamed Material');
          }
        }
      }
    });

    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);

    return {
      name: filename,
      meshCount,
      vertexCount,
      triangleCount,
      boneCount,
      bonesDetected,
      hasSkinnedMesh,
      materialCount: materialsSet.size,
      originalDimensions: {
        x: parseFloat(size.x.toFixed(3)),
        y: parseFloat(size.y.toFixed(3)),
        z: parseFloat(size.z.toFixed(3)),
      },
      normalizedHeight: 1.8,
    };
  }

  public async loadGLTFFromArrayBuffer(
    buffer: ArrayBuffer,
    filename = 'custom_model.glb'
  ): Promise<{ gltf: any; stats: ModelInspectionStats }> {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.parse(
        buffer,
        '',
        (gltf) => {
          const stats = this.inspectGLTFModel(gltf, filename);
          const scene = gltf.scene || gltf.scenes?.[0];
          if (scene) {
            this.cachedGLTFScene = scene;
            this.cachedGLTFBuffer = buffer;
          }
          resolve({ gltf, stats });
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  public async loadGLTFFromUrl(
    url: string,
    filename?: string
  ): Promise<{ gltf: any; stats: ModelInspectionStats }> {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          const name = filename || url.split('/').pop()?.split('?')[0] || 'remote_model.gltf';
          const stats = this.inspectGLTFModel(gltf, name);
          const scene = gltf.scene || gltf.scenes?.[0];
          if (scene) {
            this.cachedGLTFScene = scene;
          }
          resolve({ gltf, stats });
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  public addCustomModelFigure(gltfScene: THREE.Group, options: CustomModelOptions): SkeletonRig {
    const modelRoot = gltfScene.clone(true);

    // Compute bounding box
    const box = new THREE.Box3().setFromObject(modelRoot);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const isDiego = Boolean(modelRoot.getObjectByName('Object_11') && modelRoot.getObjectByName('Object_12'));

    if (!isDiego) {
      // Normalize height to anatomical human standard (~1.8m) if requested
      if (options.normalizeHeight && size.y > 0) {
        const targetHeight = 1.8;
        const scaleFactor = targetHeight / size.y;
        modelRoot.scale.setScalar(scaleFactor);
        box.setFromObject(modelRoot);
        box.getSize(size);
        box.getCenter(center);
      }

      // Center model so its feet/base rests on floor (y = 0)
      if (options.centerOrigin) {
        modelRoot.position.x -= center.x;
        modelRoot.position.z -= center.z;
        modelRoot.position.y -= box.min.y;
      }
    }

    const preset =
      options.materialPresetKey && (CHROME_MATERIAL_PRESETS as any)[options.materialPresetKey]
        ? (CHROME_MATERIAL_PRESETS as any)[options.materialPresetKey]
        : CHROME_MATERIAL_PRESETS.pure_mirror;

    const newId = `custom_figure_${Date.now()}`;
    const figureData: SkeletonFigureData = {
      id: newId,
      name: options.name || 'Custom 3D Skeleton',
      visible: true,
      locked: false,
      ikEnabled: false,
      enforceJointLimits: true,
      material: { ...preset },
      pose: {
        ...JSON.parse(JSON.stringify(DEFAULT_NEUTRAL_POSE)),
        position: [0, 0, 0],
      },
    };

    const rig = new SkeletonRig(figureData);
    if (this.studioEnvTexture) {
      rig.updateMaterial(figureData.material, this.studioEnvTexture);
    }

    rig.attachCustomModel(modelRoot, {
      applyChromeMaterial: options.applyChromeMaterial,
      customName: options.name,
    });

    this.scene.add(rig.getRootGroup());
    Object.values(rig.ikTargets).forEach((t) => this.scene.add(t));
    this.figures.set(rig.id, rig);
    this.setActiveFigure(rig.id);
    this.focusOnSelection();

    return rig;
  }

  public replaceFigureWithCustomModel(
    figureId: string,
    gltfScene: THREE.Group,
    options: CustomModelOptions
  ): SkeletonRig {
    const targetRig = this.figures.get(figureId);
    if (!targetRig) {
      return this.addCustomModelFigure(gltfScene, options);
    }

    const modelRoot = gltfScene.clone(true);
    const box = new THREE.Box3().setFromObject(modelRoot);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const isDiego = Boolean(modelRoot.getObjectByName('Object_11') && modelRoot.getObjectByName('Object_12'));

    if (!isDiego) {
      if (options.normalizeHeight && size.y > 0) {
        const targetHeight = 1.8;
        const scaleFactor = targetHeight / size.y;
        modelRoot.scale.setScalar(scaleFactor);
        box.setFromObject(modelRoot);
        box.getCenter(center);
      }

      if (options.centerOrigin) {
        modelRoot.position.x -= center.x;
        modelRoot.position.z -= center.z;
        modelRoot.position.y -= box.min.y;
      }
    }

    this.cachedGLTFScene = gltfScene;

    targetRig.attachCustomModel(modelRoot, {
      applyChromeMaterial: options.applyChromeMaterial,
      customName: options.name,
    });

    // Ensure all meshes have double-sided rendering and frustum culling disabled so skull is always visible from any angle
    targetRig.nodes?.boneMeshes?.forEach((mesh) => {
      mesh.frustumCulled = false;
      if (mesh.material) {
        (mesh.material as any).side = THREE.DoubleSide;
      }
    });

    if (this.studioEnvTexture) {
      targetRig.updateMaterial(targetRig.currentMaterialSettings, this.studioEnvTexture);
    }

    this.setActiveFigure(targetRig.id);
    this.focusOnSelection();
    return targetRig;
  }

  // ==========================================
  // MOTION-CAPTURE ANIMATION STUDIO
  // ==========================================

  public isAnimationPlaying: boolean = false;
  public activeClip: MotionClip | null = null;
  public animationTime: number = 0;
  public animationSpeed: number = 1.0;
  public animationLoop: boolean = true;
  public animationRootMotion: boolean = true;
  private animationClock: THREE.Clock = new THREE.Clock();
  private originalPosesBeforeAnimation: Map<string, any> = new Map();

  public playMotionClip(
    clipId: string,
    options: { speed?: number; loop?: boolean; rootMotion?: boolean } = {}
  ) {
    const clip = MOTION_CAPTURE_CLIPS[clipId];
    if (!clip) {
      console.warn(`Motion clip ${clipId} not found.`);
      return;
    }

    // Save initial pose snapshot if starting playback
    if (!this.activeClip) {
      this.figures.forEach((rig, id) => {
        this.originalPosesBeforeAnimation.set(id, JSON.parse(JSON.stringify(rig.currentPose)));
      });
    }

    // If multi-character hug and only 1 figure exists, spawn partner figure automatically
    if (clipId === 'two_character_hug' && this.figures.size < 2) {
      const partnerData: SkeletonFigureData = {
        id: `figure_${Date.now()}`,
        name: 'Partner İskelet',
        visible: true,
        locked: false,
        ikEnabled: false,
        enforceJointLimits: true,
        material: { ...CHROME_MATERIAL_PRESETS.rose_gold },
        pose: {
          ...JSON.parse(JSON.stringify(DEFAULT_NEUTRAL_POSE)),
          joints: { ...DEFAULT_NEUTRAL_POSE.joints },
        },
      };
      this.addFigure(partnerData);
    }

    this.activeClip = clip;
    this.animationTime = 0;
    this.animationSpeed = options.speed ?? clip.speed ?? 1.0;
    this.animationLoop = options.loop ?? clip.loop ?? true;
    this.animationRootMotion = options.rootMotion ?? clip.hasRootMotion ?? true;
    this.isAnimationPlaying = true;
    this.animationClock.start();

    this.notifyAnimationUpdate();
  }

  public pauseAnimation() {
    this.isAnimationPlaying = false;
    this.notifyAnimationUpdate();
  }

  public resumeAnimation() {
    if (this.activeClip) {
      this.isAnimationPlaying = true;
      this.animationClock.start();
      this.notifyAnimationUpdate();
    }
  }

  public stopAnimation() {
    this.isAnimationPlaying = false;
    this.activeClip = null;
    this.animationTime = 0;

    // Restore original pose before animation
    this.figures.forEach((rig, id) => {
      const saved = this.originalPosesBeforeAnimation.get(id);
      if (saved) {
        rig.applyPose(saved);
      }
    });
    this.originalPosesBeforeAnimation.clear();

    this.notifyAnimationUpdate();
  }

  public seekAnimation(timeInSeconds: number) {
    if (!this.activeClip) return;
    this.animationTime = Math.max(0, Math.min(this.activeClip.duration, timeInSeconds));
    this.evaluateAnimationFrame(this.animationTime);
    this.notifyAnimationUpdate();
  }

  public setAnimationSpeed(speed: number) {
    this.animationSpeed = Math.max(0.1, Math.min(3.0, speed));
    this.notifyAnimationUpdate();
  }

  public setAnimationRootMotion(enable: boolean) {
    this.animationRootMotion = enable;
    this.notifyAnimationUpdate();
  }

  public setAnimationLoop(loop: boolean) {
    this.animationLoop = loop;
    this.notifyAnimationUpdate();
  }

  private notifyAnimationUpdate() {
    if (this.callbacks.onAnimationUpdate) {
      this.callbacks.onAnimationUpdate({
        currentClipId: this.activeClip?.id || null,
        clipName: this.activeClip?.name || '',
        currentTime: this.animationTime,
        duration: this.activeClip?.duration || 0,
        isPlaying: this.isAnimationPlaying,
        playbackSpeed: this.animationSpeed,
        loop: this.animationLoop,
        rootMotion: this.animationRootMotion,
      });
    }
  }

  private evaluateAnimationFrame(time: number) {
    if (!this.activeClip) return;
    const clip = this.activeClip;
    const keyframes = clip.keyframes;
    if (!keyframes || keyframes.length === 0) return;

    // Find keyframe interval
    let k0 = keyframes[0];
    let k1 = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
        k0 = keyframes[i];
        k1 = keyframes[i + 1];
        break;
      }
    }

    const span = k1.time - k0.time || 0.0001;
    const alpha = Math.max(0, Math.min(1, (time - k0.time) / span));

    // Handle coordinated two-character hug
    if (clip.id === 'two_character_hug') {
      const figureArr = Array.from(this.figures.values());
      if (figureArr.length >= 2) {
        const fig0 = figureArr[0];
        const fig1 = figureArr[1];

        // Position figures facing each other at chest distance
        fig0.setPosition([-0.22, 0, 0]);
        fig0.setRotation([0, 85, 0]);
        fig1.setPosition([0.22, 0, 0]);
        fig1.setRotation([0, -95, 0]);

        // Interpolate joint rotations for Fig 0
        const allJoints = Object.keys({ ...k0.joints, ...k1.joints }) as JointKey[];
        allJoints.forEach((jk) => {
          const rot0 = k0.joints[jk] || { x: 0, y: 0, z: 0 };
          const rot1 = k1.joints[jk] || { x: 0, y: 0, z: 0 };
          const x = THREE.MathUtils.lerp(rot0.x, rot1.x, alpha);
          const y = THREE.MathUtils.lerp(rot0.y, rot1.y, alpha);
          const z = THREE.MathUtils.lerp(rot0.z, rot1.z, alpha);
          fig0.setJointRotation(jk, { x, y, z }, false);

          // Fig 1 reciprocates with symmetrical arm wrapping
          const mirroredZ = jk.includes('_L') ? jk.replace('_L', '_R') : jk.replace('_R', '_L');
          fig1.setJointRotation(mirroredZ as JointKey, { x, y: -y, z: -z }, false);
        });

        fig0.validateAndClampToGround();
        fig1.validateAndClampToGround();
        return;
      }
    }

    const activeRig = this.getActiveFigure();
    if (!activeRig) return;

    // Interpolate joint rotations for active figure
    const allJoints = Object.keys({ ...k0.joints, ...k1.joints }) as JointKey[];
    allJoints.forEach((jk) => {
      const rot0 = k0.joints[jk] || activeRig.getJointRotation(jk);
      const rot1 = k1.joints[jk] || rot0;

      // Shortest path angle interpolation
      let dx = (rot1.x - rot0.x) % 360;
      if (dx > 180) dx -= 360;
      if (dx < -180) dx += 360;
      const x = rot0.x + dx * alpha;

      let dy = (rot1.y - rot0.y) % 360;
      if (dy > 180) dy -= 360;
      if (dy < -180) dy += 360;
      const y = rot0.y + dy * alpha;

      let dz = (rot1.z - rot0.z) % 360;
      if (dz > 180) dz -= 360;
      if (dz < -180) dz += 360;
      const z = rot0.z + dz * alpha;

      activeRig.setJointRotation(jk, { x, y, z }, false);
    });

    // Root motion
    if (this.animationRootMotion && k0.rootPosition && k1.rootPosition) {
      const px = THREE.MathUtils.lerp(k0.rootPosition[0], k1.rootPosition[0], alpha);
      const py = THREE.MathUtils.lerp(k0.rootPosition[1], k1.rootPosition[1], alpha);
      const pz = THREE.MathUtils.lerp(k0.rootPosition[2], k1.rootPosition[2], alpha);
      activeRig.setPosition([px, py, pz]);
    }

    if (k0.rootRotation && k1.rootRotation) {
      const rx = THREE.MathUtils.lerp(k0.rootRotation[0], k1.rootRotation[0], alpha);
      const ry = THREE.MathUtils.lerp(k0.rootRotation[1], k1.rootRotation[1], alpha);
      const rz = THREE.MathUtils.lerp(k0.rootRotation[2], k1.rootRotation[2], alpha);
      activeRig.setRotation([rx, ry, rz]);
    }

    // Always keep feet clamped on ground
    activeRig.validateAndClampToGround();
  }

  // ==========================================
  // RENDER LOOP & RESIZE
  // ==========================================

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Update Motion Capture Animation Player
    if (this.isAnimationPlaying && this.activeClip) {
      const delta = this.animationClock.getDelta() * this.animationSpeed;
      this.animationTime += delta;

      if (this.animationTime >= this.activeClip.duration) {
        if (this.animationLoop) {
          this.animationTime = this.animationTime % this.activeClip.duration;
        } else {
          this.animationTime = this.activeClip.duration;
          this.isAnimationPlaying = false;
        }
      }

      this.evaluateAnimationFrame(this.animationTime);
      this.notifyAnimationUpdate();
    }

    this.orbitControls.update();
    this.renderer.render(this.scene, this.activeCamera);
  };

  private onWindowResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.perspectiveCamera.aspect = width / height;
    this.perspectiveCamera.updateProjectionMatrix();

    const frustumSize = 3;
    const aspect = width / height;
    this.orthographicCamera.left = (-frustumSize * aspect) / 2;
    this.orthographicCamera.right = (frustumSize * aspect) / 2;
    this.orthographicCamera.top = frustumSize / 2;
    this.orthographicCamera.bottom = -frustumSize / 2;
    this.orthographicCamera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };

  public dispose() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);

    this.figures.forEach((rig) => rig.dispose());
    this.figures.clear();

    this.transformControls.dispose();
    this.orbitControls.dispose();
    this.pmremGenerator.dispose();
    this.renderer.dispose();

    if (this.container && this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
