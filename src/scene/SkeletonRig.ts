import * as THREE from 'three';
import { AnatomicalSkeletonBuilder, SkeletonRigNodes } from './AnatomicalSkeletonBuilder';
import { ANATOMICAL_JOINTS, DEFAULT_NEUTRAL_POSE } from './jointDefinitions';
import {
  JointKey,
  EulerDegrees,
  FigurePose,
  MaterialSettings,
  SkeletonFigureData,
} from '../types/skeleton';
import { setupAnatomicalModelRig } from './anatomicalModelRig';

export interface IKTargetHandles {
  hand_L: THREE.Group;
  hand_R: THREE.Group;
  foot_L: THREE.Group;
  foot_R: THREE.Group;
  head_look: THREE.Group;
}

export interface GLTFBoneItem {
  name: string;
  node: THREE.Object3D;
  matchedKey?: JointKey;
  label: string;
  category: string;
}

export function matchBoneNameToJointKey(name: string): JointKey | null {
  const n = name.toLowerCase().replace(/[-_.]/g, ' ');

  const isLeft =
    /\b(l|left|izq|izquierdo|leftarm|leftleg)\b/i.test(n) ||
    n.endsWith(' l') ||
    n.includes('.l') ||
    n.includes('_l');
  const isRight =
    /\b(r|right|der|derecho|rightarm|rightleg)\b/i.test(n) ||
    n.endsWith(' r') ||
    n.includes('.r') ||
    n.includes('_r');

  // Pelvis / Hips
  if (/pelvis|hips|root|sacrum|cintura|cadera/i.test(n)) return 'pelvis';
  // Head / Cranium
  if (/head|skull|cranium|cabeza/i.test(n)) return 'head';
  // Jaw
  if (/jaw|mandible|mandibula/i.test(n)) return 'jaw';
  // Spine
  if (/neck|cervical|cuello/i.test(n)) return 'spine_cervical';
  if (/chest|upper.*spine|spine.*2|spine.*3|thoracic|pecho|torso/i.test(n))
    return 'spine_thoracic';
  if (/spine|lumbar|columna/i.test(n)) return 'spine_lumbar';

  // Left Arm
  if (isLeft) {
    if (/clavicle|collar|scapula/i.test(n)) return 'clavicle_L';
    if (/shoulder|upper.*arm|humerus|arm/i.test(n) && !/forearm|lower/i.test(n))
      return 'shoulder_L';
    if (/forearm|lower.*arm|elbow|radius|ulna/i.test(n)) return 'lower_arm_L';
    if (/wrist|hand/i.test(n) && !/thumb|index|middle|ring|pinky/i.test(n))
      return 'wrist_L';
    if (/thumb/i.test(n)) return 'thumb_L';
    if (/index/i.test(n)) return 'index_L';
    if (/middle/i.test(n)) return 'middle_L';
    if (/ring/i.test(n)) return 'ring_L';
    if (/pinky|little/i.test(n)) return 'pinky_L';

    // Left Leg
    if (/thigh|upper.*leg|femur|hip/i.test(n)) return 'hip_L';
    if (/shin|calf|lower.*leg|knee|tibia|fibula/i.test(n)) return 'knee_L';
    if (/foot|ankle/i.test(n) && !/toe/i.test(n)) return 'ankle_L';
    if (/toe/i.test(n)) return 'toes_L';
  }

  // Right Arm
  if (isRight) {
    if (/clavicle|collar|scapula/i.test(n)) return 'clavicle_R';
    if (/shoulder|upper.*arm|humerus|arm/i.test(n) && !/forearm|lower/i.test(n))
      return 'shoulder_R';
    if (/forearm|lower.*arm|elbow|radius|ulna/i.test(n)) return 'lower_arm_R';
    if (/wrist|hand/i.test(n) && !/thumb|index|middle|ring|pinky/i.test(n))
      return 'wrist_R';
    if (/thumb/i.test(n)) return 'thumb_R';
    if (/index/i.test(n)) return 'index_R';
    if (/middle/i.test(n)) return 'middle_R';
    if (/ring/i.test(n)) return 'ring_R';
    if (/pinky|little/i.test(n)) return 'pinky_R';

    // Right Leg
    if (/thigh|upper.*leg|femur|hip/i.test(n)) return 'hip_R';
    if (/shin|calf|lower.*leg|knee|tibia|fibula/i.test(n)) return 'knee_R';
    if (/foot|ankle/i.test(n) && !/toe/i.test(n)) return 'ankle_R';
    if (/toe/i.test(n)) return 'toes_R';
  }

  return null;
}

export function formatBoneLabel(name: string): string {
  return name
    .replace(/^mixamorig[._:]?/i, '')
    .replace(/^bip01[._:]?/i, '')
    .replace(/[-_.]/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function determineBoneCategory(name: string, matchedKey?: JointKey | null): string {
  if (matchedKey) {
    const def = ANATOMICAL_JOINTS[matchedKey];
    if (def) return def.category;
  }
  const n = name.toLowerCase();
  if (/arm|hand|finger|wrist|shoulder|clavicle|elbow|radius|ulna/i.test(n)) {
    return n.includes('l') || n.includes('left') ? 'arm_L' : 'arm_R';
  }
  if (/leg|foot|toe|thigh|shin|knee|femur|tibia/i.test(n)) {
    return n.includes('l') || n.includes('left') ? 'leg_L' : 'leg_R';
  }
  if (/head|skull|jaw|mandible|teeth|face|eye/i.test(n)) return 'head';
  if (/spine|rib|vertebra|chest|pelvis|hip/i.test(n)) return 'spine';
  return 'other';
}

export class SkeletonRig {
  public readonly id: string;
  public name: string;
  public visible: boolean = true;
  public locked: boolean = false;
  public ikEnabled: boolean = false;
  public enforceJointLimits: boolean = true;

  public nodes: SkeletonRigNodes;
  public material: THREE.MeshPhysicalMaterial;
  public currentPose: FigurePose;
  public ikTargets: IKTargetHandles;

  public selectedJointKey: JointKey | null = null;
  private selectionHelper: THREE.Mesh | null = null;
  public customModelGroup: THREE.Group | null = null;
  public isCustomModel: boolean = false;
  public currentMaterialSettings: MaterialSettings;

  public gltfBones: Map<string, THREE.Object3D> = new Map();
  public gltfBoneList: GLTFBoneItem[] = [];
  public jointKeyToGLTFBone: Map<JointKey, THREE.Object3D> = new Map();
  public boneNameToJointKey: Map<string, JointKey> = new Map();
  public customBoneRotations: Map<string, EulerDegrees> = new Map();
  public selectedBoneName: string | null = null;
  public selectedBoneNode: THREE.Object3D | null = null;
  private zoneMaterials: Map<string, THREE.MeshPhysicalMaterial> = new Map();

  constructor(data: SkeletonFigureData) {
    this.id = data.id;
    this.name = data.name;
    this.visible = data.visible;
    this.locked = data.locked;
    this.ikEnabled = data.ikEnabled;
    this.enforceJointLimits = data.enforceJointLimits;
    this.currentMaterialSettings = { ...data.material };

    // Deep clone pose
    this.currentPose = JSON.parse(JSON.stringify(data.pose || DEFAULT_NEUTRAL_POSE));

    // Create Physical Material
    this.material = new THREE.MeshPhysicalMaterial({
      roughness: data.material.roughness,
      metalness: data.material.metalness,
      color: new THREE.Color(data.material.color),
      clearcoat: data.material.clearcoat,
      clearcoatRoughness: data.material.clearcoatRoughness,
      iridescence: data.material.iridescence,
      iridescenceIOR: data.material.iridescenceIOR,
      iridescenceThicknessRange: [
        data.material.iridescenceThicknessMin,
        data.material.iridescenceThicknessMax,
      ],
      envMapIntensity: data.material.envMapIntensity,
      side: THREE.DoubleSide,
    });

    // Build hierarchical 3D anatomical geometry
    this.nodes = AnatomicalSkeletonBuilder.buildSkeleton(this.id, this.material);

    // Create IK visual target dragger handles
    this.ikTargets = this.createIKTargets();

    // Set initial position, rotation, scale
    this.setPosition(this.currentPose.position);
    this.setRotation(this.currentPose.rotation);
    this.setScale(this.currentPose.scale);

    // Apply initial joint rotations
    this.applyPose(this.currentPose);

    // Create selection highlight ring
    this.createSelectionHelper();
  }

  // ==========================================
  // JOINT ROTATION (FK) & LIMITS
  // ==========================================

  public setJointRotation(key: JointKey, angles: EulerDegrees, clampLimits = this.enforceJointLimits) {
    const jointGroup = this.getJointGroup(key);
    if (!jointGroup) return;

    let { x, y, z } = angles;

    if (clampLimits) {
      const def = ANATOMICAL_JOINTS[key];
      if (def?.limits) {
        x = Math.max(def.limits.min.x, Math.min(def.limits.max.x, x));
        y = Math.max(def.limits.min.y, Math.min(def.limits.max.y, y));
        z = Math.max(def.limits.min.z, Math.min(def.limits.max.z, z));
      }
    }

    this.currentPose.joints[key] = { x, y, z };

    jointGroup.rotation.set(
      THREE.MathUtils.degToRad(x),
      THREE.MathUtils.degToRad(y),
      THREE.MathUtils.degToRad(z)
    );

    // Also update procedural node if custom model is active
    if (this.isCustomModel && this.nodes.jointGroups[key]) {
      this.nodes.jointGroups[key].rotation.set(
        THREE.MathUtils.degToRad(x),
        THREE.MathUtils.degToRad(y),
        THREE.MathUtils.degToRad(z)
      );
    }

    if (this.selectedJointKey === key && this.selectionHelper) {
      this.updateSelectionHelperPosition();
    }
  }

  public getJointRotation(key: JointKey): EulerDegrees {
    return this.currentPose.joints[key] || { x: 0, y: 0, z: 0 };
  }

  public getJointGroup(key: JointKey): THREE.Group | undefined {
    if (this.isCustomModel && this.jointKeyToGLTFBone.has(key)) {
      return this.jointKeyToGLTFBone.get(key) as THREE.Group;
    }
    return this.nodes.jointGroups[key];
  }

  public getRootGroup(): THREE.Group {
    return this.nodes.root;
  }

  // ==========================================
  // POSE MANAGEMENT & MIRRORING
  // ==========================================

  public validateAndClampToGround(): number {
    this.nodes.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.nodes.root);

    // If lowest point penetrates below ground (min.y < -0.005)
    // Automatically elevate skeleton so lowest bone rests firmly on ground
    if (box.min.y < -0.005) {
      const correction = -box.min.y + 0.002;
      this.nodes.root.position.y += correction;
      this.currentPose.position[1] = this.nodes.root.position.y;
      this.nodes.root.updateMatrixWorld(true);
      return correction;
    }
    return 0;
  }

  public applyPose(pose: Partial<FigurePose>, autoClampGround = true) {
    if (pose.position) this.setPosition(pose.position);
    if (pose.rotation) this.setRotation(pose.rotation);
    if (pose.scale) this.setScale(pose.scale);

    if (pose.joints) {
      (Object.keys(pose.joints) as JointKey[]).forEach((key) => {
        if (pose.joints![key]) {
          this.setJointRotation(key, pose.joints![key]!);
        }
      });
    }

    this.syncIKTargetsToLimbs();

    if (autoClampGround) {
      this.validateAndClampToGround();
    }
  }

  public resetJoint(key: JointKey) {
    const neutral = DEFAULT_NEUTRAL_POSE.joints[key] || { x: 0, y: 0, z: 0 };
    this.setJointRotation(key, { ...neutral });
  }

  public resetLimb(category: 'arm_L' | 'arm_R' | 'leg_L' | 'leg_R' | 'spine' | 'head') {
    (Object.keys(ANATOMICAL_JOINTS) as JointKey[]).forEach((key) => {
      if (ANATOMICAL_JOINTS[key].category === category) {
        this.resetJoint(key);
      }
    });
  }

  public resetAllPose() {
    this.applyPose(DEFAULT_NEUTRAL_POSE);
  }

  /**
   * Mirror pose from left side to right side or vice versa
   */
  public mirrorPose(fromSide: 'L' | 'R') {
    const toSide = fromSide === 'L' ? 'R' : 'L';
    const limbKeys = [
      'clavicle',
      'shoulder',
      'lower_arm',
      'wrist',
      'thumb',
      'index',
      'middle',
      'ring',
      'pinky',
      'hip',
      'knee',
      'ankle',
      'toes',
    ];

    limbKeys.forEach((limb) => {
      const sourceKey = `${limb}_${fromSide}` as JointKey;
      const targetKey = `${limb}_${toSide}` as JointKey;

      const sourceRot = this.getJointRotation(sourceKey);
      if (sourceRot) {
        // Invert Y and Z for anatomical symmetry across sagittal plane
        const mirrored: EulerDegrees = {
          x: sourceRot.x,
          y: -sourceRot.y,
          z: -sourceRot.z,
        };
        this.setJointRotation(targetKey, mirrored);
      }
    });
  }

  // ==========================================
  // TRANSFORM CONTROLS & ROOT
  // ==========================================

  public setPosition(pos: [number, number, number]) {
    this.currentPose.position = [...pos];
    this.nodes.root.position.set(...pos);
  }

  public setRotation(rot: [number, number, number]) {
    this.currentPose.rotation = [...rot];
    this.nodes.root.rotation.set(
      THREE.MathUtils.degToRad(rot[0]),
      THREE.MathUtils.degToRad(rot[1]),
      THREE.MathUtils.degToRad(rot[2])
    );
  }

  public setScale(scale: [number, number, number]) {
    this.currentPose.scale = [...scale];
    this.nodes.root.scale.set(...scale);
  }

  public setVisible(val: boolean) {
    this.visible = val;
    this.nodes.root.visible = val;
    (Object.values(this.ikTargets) as THREE.Group[]).forEach((t) => (t.visible = val && this.ikEnabled));
  }

  public setIKEnabled(val: boolean) {
    this.ikEnabled = val;
    (Object.values(this.ikTargets) as THREE.Group[]).forEach((t) => (t.visible = val && this.visible));
    if (val) {
      this.syncIKTargetsToLimbs();
    }
  }

  // ==========================================
  // ADVANCED CHROMATIC MATERIAL SETTINGS
  // ==========================================

  public updateMaterial(settings: MaterialSettings, envMap?: THREE.Texture | null) {
    this.currentMaterialSettings = { ...settings };
    this.material.roughness = settings.roughness;
    this.material.metalness = settings.metalness;
    this.material.color.set(settings.color);
    this.material.clearcoat = settings.clearcoat;
    this.material.clearcoatRoughness = settings.clearcoatRoughness;
    this.material.iridescence = settings.iridescence;
    this.material.iridescenceIOR = settings.iridescenceIOR;
    this.material.iridescenceThicknessRange = [
      settings.iridescenceThicknessMin,
      settings.iridescenceThicknessMax,
    ];
    this.material.envMapIntensity = settings.envMapIntensity;

    if (envMap !== undefined) {
      this.material.envMap = envMap;
    }
    this.material.side = THREE.DoubleSide;
    this.material.needsUpdate = true;

    const mode = settings.multiColorMode || 'rainbow_iridescent';
    const isMultiZone = mode === 'zone_custom' && !!settings.zoneColors;
    const isGradient = mode === 'gradient_ombre';
    const isTwoTone = mode === 'two_tone_flip' && !!settings.secondaryColor;
    const isRainbowRibs = mode === 'rainbow_ribs';
    const isIndividualBones = mode === 'individual_bones';

    // Multi-stop gradient sampler helper
    const sampleGradientStops = (t: number): string => {
      const stops = settings.ombreStops;
      if (!stops || stops.length === 0) {
        // Fallback default gradient
        const c0 = new THREE.Color(settings.color || '#ffd700');
        const c1 = new THREE.Color(settings.secondaryColor || '#ec4899');
        c0.lerp(c1, 1 - t);
        return `#${c0.getHexString()}`;
      }
      if (stops.length === 1) return stops[0].color;

      const sorted = [...stops].sort((a, b) => a.position - b.position);
      if (t <= sorted[0].position) return sorted[0].color;
      if (t >= sorted[sorted.length - 1].position) return sorted[sorted.length - 1].color;

      for (let i = 0; i < sorted.length - 1; i++) {
        const s0 = sorted[i];
        const s1 = sorted[i + 1];
        if (t >= s0.position && t <= s1.position) {
          const range = s1.position - s0.position || 0.001;
          const factor = (t - s0.position) / range;
          const c0 = new THREE.Color(s0.color);
          const c1 = new THREE.Color(s1.color);
          c0.lerp(c1, factor);
          return `#${c0.getHexString()}`;
        }
      }
      return sorted[0].color;
    };

    const getZoneColor = (zone: string): string => {
      if (isMultiZone && settings.zoneColors) {
        return (settings.zoneColors as any)[zone] || settings.color;
      }
      if (isTwoTone) {
        return zone === 'head' || zone === 'spine' ? settings.color : settings.secondaryColor!;
      }
      return settings.color;
    };

    const getOrCreateColorMat = (colorHex: string, cacheKey: string): THREE.MeshPhysicalMaterial => {
      let zMat = this.zoneMaterials.get(cacheKey);
      if (!zMat) {
        zMat = this.material.clone();
        this.zoneMaterials.set(cacheKey, zMat);
      }
      zMat.color.set(colorHex);
      zMat.roughness = settings.roughness;
      zMat.metalness = settings.metalness;
      zMat.clearcoat = settings.clearcoat;
      zMat.clearcoatRoughness = settings.clearcoatRoughness;
      zMat.iridescence = settings.iridescence;
      zMat.iridescenceIOR = settings.iridescenceIOR;
      zMat.iridescenceThicknessRange = [
        settings.iridescenceThicknessMin,
        settings.iridescenceThicknessMax,
      ];
      zMat.envMapIntensity = settings.envMapIntensity;
      if (envMap !== undefined) zMat.envMap = envMap;
      zMat.side = THREE.DoubleSide;
      zMat.vertexColors = false;
      zMat.needsUpdate = true;
      return zMat;
    };

    // 12-Tone Prismatic Rainbow Palette for individual ribs
    const RIB_RAINBOW_PALETTE = [
      '#ff0055', // Rib 1 (Top) - Radiant Ruby
      '#ff2a00', // Rib 2 - Crimson Flame
      '#ff6600', // Rib 3 - Sunset Tangerine
      '#ff9900', // Rib 4 - Amber Gold
      '#ffd700', // Rib 5 - Metallic Gold
      '#b8e900', // Rib 6 - Electric Lime
      '#00f088', // Rib 7 - Emerald Green
      '#00f0ff', // Rib 8 - Cyan Laser
      '#0088ff', // Rib 9 - Cobalt Electric
      '#7928ca', // Rib 10 - Deep Violet
      '#a855f7', // Rib 11 - Prismatic Purple
      '#ff00aa', // Rib 12 (Bottom) - Magenta Neon
    ];

    const assignMeshMaterial = (mesh: THREE.Mesh) => {
      mesh.frustumCulled = false;
      if ((mesh as any).isChromeMesh === false || (mesh.userData as any)?.isElbowPicker) return;

      const jk = (mesh.userData?.jointKey as string) || '';
      const name = mesh.name || '';

      // Mode: Individual Bones Override
      if (isIndividualBones && settings.boneColors) {
        const boneColor =
          settings.boneColors[name] ||
          settings.boneColors[jk] ||
          settings.boneColors[mesh.userData?.boneName];
        if (boneColor) {
          mesh.material = getOrCreateColorMat(boneColor, `bone_${name || jk}`);
          return;
        }
      }

      // Mode: Rainbow Ribs (Every rib in the rib cage gets a distinct rainbow chromatic hue!)
      if (isRainbowRibs && (name.includes('Rib') || name.includes('Sternum'))) {
        if (name.includes('Sternum')) {
          // Luminous platinum/cyan accent for the sternum
          mesh.material = getOrCreateColorMat('#00f0ff', 'rib_sternum_cyan');
          return;
        }

        // Apply vertex colors to Rib_Cage geometry if not already done
        const geom = mesh.geometry;
        if (geom && geom.attributes.position) {
          const pos = geom.attributes.position;
          const count = pos.count;
          let colors = geom.attributes.color ? (geom.attributes.color.array as Float32Array) : null;

          if (!colors || colors.length !== count * 3) {
            colors = new Float32Array(count * 3);
          }

          // Compute Y range of the ribs (typically y = 1.25 to 1.55)
          const minY = 1.25;
          const maxY = 1.55;
          const range = maxY - minY || 0.3;

          for (let i = 0; i < count; i++) {
            const y = pos.getY(i);
            const normY = Math.max(0, Math.min(1, (y - minY) / range));
            // Invert so Rib 1 (top) gets index 0 and Rib 12 (bottom) gets index 11
            const paletteIdx = Math.min(
              RIB_RAINBOW_PALETTE.length - 1,
              Math.floor((1 - normY) * RIB_RAINBOW_PALETTE.length)
            );
            const c = new THREE.Color(RIB_RAINBOW_PALETTE[paletteIdx]);
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
          }

          geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

          let ribMat = this.zoneMaterials.get('rainbow_ribs_mat');
          if (!ribMat) {
            ribMat = this.material.clone();
            this.zoneMaterials.set('rainbow_ribs_mat', ribMat);
          }
          ribMat.vertexColors = true;
          ribMat.color.set('#ffffff');
          ribMat.roughness = Math.min(settings.roughness, 0.15);
          ribMat.metalness = Math.max(settings.metalness, 0.95);
          ribMat.clearcoat = 1.0;
          ribMat.iridescence = 0.8;
          ribMat.envMapIntensity = settings.envMapIntensity;
          if (envMap !== undefined) ribMat.envMap = envMap;
          ribMat.needsUpdate = true;

          mesh.material = ribMat;
          return;
        }
      }

      // Mode: Gradient Ombre (Smooth multi-stop transition from head to toes)
      if (isGradient) {
        let heightNormalized = 0.5;

        if (jk === 'head' || jk === 'jaw' || name.includes('Skull') || name.includes('Teeth') || name.includes('Mandible')) {
          heightNormalized = 0.98;
        } else if (jk === 'spine_cervical' || name.includes('Cervical')) {
          heightNormalized = 0.86;
        } else if (jk === 'spine_thoracic' || name.includes('Rib') || name.includes('Sternum')) {
          heightNormalized = 0.74;
        } else if (name.includes('Clavicle') || name.includes('Scapula')) {
          heightNormalized = 0.80;
        } else if (jk.includes('shoulder') || name.includes('Humerus')) {
          heightNormalized = 0.70;
        } else if (jk === 'spine_lumbar') {
          heightNormalized = 0.62;
        } else if (jk.includes('lower_arm') || name.includes('Ulna') || name.includes('Radius')) {
          heightNormalized = 0.55;
        } else if (jk === 'pelvis' || name.includes('Pelvis') || name.includes('Sacrum')) {
          heightNormalized = 0.50;
        } else if (jk.includes('wrist') || name.includes('Hand')) {
          heightNormalized = 0.42;
        } else if (jk.includes('hip') || name.includes('Femur')) {
          heightNormalized = 0.38;
        } else if (name.includes('Patella') || jk.includes('knee')) {
          heightNormalized = 0.25;
        } else if (name.includes('Tibia') || name.includes('Fibula')) {
          heightNormalized = 0.16;
        } else if (jk.includes('ankle') || jk.includes('toes') || name.includes('Foot')) {
          heightNormalized = 0.04;
        }

        const ombreColor = sampleGradientStops(heightNormalized);
        mesh.material = getOrCreateColorMat(ombreColor, `ombre_${heightNormalized.toFixed(2)}`);
        return;
      }

      // Mode: Zone Custom or Two Tone
      if (isMultiZone || isTwoTone) {
        let zone = 'spine';
        if (jk === 'head' || jk === 'jaw' || name.includes('Skull') || name.includes('Teeth') || name.includes('Mandible') || name.includes('Cervical')) {
          zone = 'head';
        } else if (jk === 'pelvis' || name.includes('Pelvis') || name.includes('Sacrum')) {
          zone = 'pelvis';
        } else if (jk.includes('arm') || jk.includes('shoulder') || jk.includes('wrist') || jk.includes('clavicle') || name.includes('Forearm') || name.includes('Humerus') || name.includes('Hand')) {
          zone = 'arms';
        } else if (jk.includes('leg') || jk.includes('hip') || jk.includes('knee') || jk.includes('ankle') || name.includes('Femur') || name.includes('Tibia') || name.includes('Fibula') || name.includes('Foot')) {
          zone = 'legs';
        }

        mesh.material = getOrCreateColorMat(getZoneColor(zone), `zone_${zone}`);
        return;
      }

      // Solid or default base chrome
      mesh.material = this.material;
    };

    if (this.nodes.boneMeshes) {
      this.nodes.boneMeshes.forEach(assignMeshMaterial);
    }
  }

  // ==========================================
  // CUSTOM GLTF / GLB SKELETON MODEL ATTACHMENT
  // ==========================================

  public attachCustomModel(
    modelGroup: THREE.Group,
    options: { applyChromeMaterial?: boolean; customName?: string } = {}
  ) {
    this.isCustomModel = true;
    this.customModelGroup = modelGroup;
    if (options.customName) {
      this.name = options.customName;
    }

    // Remove all previous procedural children from root so no duplicate bodies or phantom hitboxes exist
    while (this.nodes.root.children.length > 0) {
      this.nodes.root.remove(this.nodes.root.children[0]);
    }
    if (this.selectionHelper) {
      this.nodes.root.add(this.selectionHelper);
    }

    // Reset articulation maps
    this.customBoneRotations.clear();

    // Build anatomical pivots, bone hierarchy and material assignment
    const rigResult = setupAnatomicalModelRig(
      modelGroup,
      this.id,
      this.material,
      options.applyChromeMaterial !== false
    );

    this.gltfBones = rigResult.bones;
    this.gltfBoneList = rigResult.boneList;
    this.nodes.boneMeshes = rigResult.boneMeshes;
    this.jointKeyToGLTFBone = rigResult.jointKeyToBone;
    this.boneNameToJointKey = rigResult.boneNameToJointKey;

    // Add custom model group to figure root
    this.nodes.root.add(modelGroup);

    // Apply current pose to the newly rigged bones
    this.applyPose(this.currentPose);
  }

  public selectBoneByName(name: string | null) {
    this.selectedBoneName = name;
    if (!name) {
      this.selectedBoneNode = null;
      this.selectJoint(null);
      return;
    }

    const node = this.gltfBones.get(name) || null;
    this.selectedBoneNode = node;

    const matchedKey = this.boneNameToJointKey.get(name);
    if (matchedKey) {
      this.selectedJointKey = matchedKey;
    } else {
      this.selectedJointKey = null;
    }

    if (this.selectionHelper && node) {
      this.selectionHelper.visible = true;
      const worldPos = new THREE.Vector3();
      node.getWorldPosition(worldPos);
      this.nodes.root.worldToLocal(worldPos);
      this.selectionHelper.position.copy(worldPos);
    }
  }

  public setBoneRotation(boneName: string, angles: EulerDegrees) {
    const node = this.gltfBones.get(boneName);
    if (!node) return;

    node.rotation.set(
      THREE.MathUtils.degToRad(angles.x),
      THREE.MathUtils.degToRad(angles.y),
      THREE.MathUtils.degToRad(angles.z)
    );

    this.customBoneRotations.set(boneName, { ...angles });

    const matchedKey = this.boneNameToJointKey.get(boneName);
    if (matchedKey) {
      this.currentPose.joints[matchedKey] = { ...angles };
    }
  }

  public getBoneRotation(boneName: string): EulerDegrees {
    const node = this.gltfBones.get(boneName);
    if (!node) return { x: 0, y: 0, z: 0 };
    return {
      x: Math.round(THREE.MathUtils.radToDeg(node.rotation.x)),
      y: Math.round(THREE.MathUtils.radToDeg(node.rotation.y)),
      z: Math.round(THREE.MathUtils.radToDeg(node.rotation.z)),
    };
  }

  public resetBoneRotation(boneName: string) {
    const node = this.gltfBones.get(boneName);
    if (!node) return;
    node.rotation.set(0, 0, 0);
    this.customBoneRotations.set(boneName, { x: 0, y: 0, z: 0 });
    const matchedKey = this.boneNameToJointKey.get(boneName);
    if (matchedKey) {
      this.currentPose.joints[matchedKey] = { x: 0, y: 0, z: 0 };
    }
  }

  // ==========================================
  // SELECTION & HIGHLIGHTING
  // ==========================================

  private createSelectionHelper() {
    const ringGeom = new THREE.TorusGeometry(0.065, 0.007, 16, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      depthTest: false,
      transparent: true,
      opacity: 0.95,
    });
    this.selectionHelper = new THREE.Mesh(ringGeom, ringMat);
    this.selectionHelper.renderOrder = 999;
    this.selectionHelper.visible = false;
    this.nodes.root.add(this.selectionHelper);
  }

  public selectJoint(key: JointKey | null) {
    this.selectedJointKey = key;
    if (!key || !this.selectionHelper) {
      if (this.selectionHelper) this.selectionHelper.visible = false;
      return;
    }

    this.selectionHelper.visible = true;
    this.updateSelectionHelperPosition();
  }

  public getSelectedJoint(): JointKey | null {
    return this.selectedJointKey;
  }

  private updateSelectionHelperPosition() {
    if (!this.selectedJointKey || !this.selectionHelper) return;
    const jointGroup = this.getJointGroup(this.selectedJointKey);
    if (!jointGroup) return;

    // Get world position relative to root
    const worldPos = new THREE.Vector3();
    jointGroup.getWorldPosition(worldPos);
    this.nodes.root.worldToLocal(worldPos);
    this.selectionHelper.position.copy(worldPos);
  }

  // ==========================================
  // INVERSE KINEMATICS (IK) ANALYTICAL SOLVER
  // ==========================================

  private createIKTargets(): IKTargetHandles {
    const makeHandle = (name: string, color: number) => {
      const grp = new THREE.Group();
      grp.name = `IKTarget_${name}_${this.id}`;
      grp.userData = { figureId: this.id, isIKTarget: true, targetKey: name };

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 16, 16),
        new THREE.MeshBasicMaterial({ color, wireframe: true })
      );
      grp.add(sphere);
      grp.visible = this.ikEnabled;
      return grp;
    };

    return {
      hand_L: makeHandle('hand_L', 0x38bdf8),
      hand_R: makeHandle('hand_R', 0xf43f5e),
      foot_L: makeHandle('foot_L', 0x34d399),
      foot_R: makeHandle('foot_R', 0xfbbf24),
      head_look: makeHandle('head_look', 0xa855f7),
    };
  }

  public syncIKTargetsToLimbs() {
    this.nodes.root.updateMatrixWorld(true);

    const syncToJoint = (target: THREE.Group, jointKey: JointKey) => {
      const jGrp = this.nodes.jointGroups[jointKey];
      if (!jGrp) return;
      const pos = new THREE.Vector3();
      jGrp.getWorldPosition(pos);
      target.position.copy(pos);
    };

    syncToJoint(this.ikTargets.hand_L, 'wrist_L');
    syncToJoint(this.ikTargets.hand_R, 'wrist_R');
    syncToJoint(this.ikTargets.foot_L, 'ankle_L');
    syncToJoint(this.ikTargets.foot_R, 'ankle_R');

    // Head look-at target rests 0.5m forward from skull
    const headGrp = this.nodes.jointGroups.head;
    if (headGrp) {
      const headPos = new THREE.Vector3();
      headGrp.getWorldPosition(headPos);
      this.ikTargets.head_look.position.set(headPos.x, headPos.y, headPos.z + 0.45);
    }
  }

  /**
   * 2-Bone Analytical IK solver for human limbs
   * @param rootJoint shoulder or hip
   * @param midJoint elbow or knee
   * @param endJoint wrist or ankle
   * @param targetWorldPos target position in world coordinates
   * @param isArm whether this is an arm (bends back) or leg (bends forward)
   */
  public solveTwoBoneIK(
    rootJoint: JointKey,
    midJoint: JointKey,
    endJoint: JointKey,
    targetWorldPos: THREE.Vector3,
    isArm: boolean
  ) {
    const rootGrp = this.nodes.jointGroups[rootJoint];
    const midGrp = this.nodes.jointGroups[midJoint];
    const endGrp = this.nodes.jointGroups[endJoint];
    if (!rootGrp || !midGrp || !endGrp) return;

    this.nodes.root.updateMatrixWorld(true);

    const rootPos = new THREE.Vector3();
    const midPos = new THREE.Vector3();
    const endPos = new THREE.Vector3();
    rootGrp.getWorldPosition(rootPos);
    midGrp.getWorldPosition(midPos);
    endGrp.getWorldPosition(endPos);

    const l1 = rootPos.distanceTo(midPos);
    const l2 = midPos.distanceTo(endPos);
    const targetDist = Math.min(l1 + l2 - 0.005, Math.max(Math.abs(l1 - l2) + 0.005, rootPos.distanceTo(targetWorldPos)));

    // Law of cosines for knee/elbow bend angle
    const cosAngle = (l1 * l1 + l2 * l2 - targetDist * targetDist) / (2 * l1 * l2);
    const bendRad = Math.PI - Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    const bendDeg = THREE.MathUtils.radToDeg(bendRad);

    // Apply bend to mid joint
    const currentMidRot = this.getJointRotation(midJoint);
    this.setJointRotation(midJoint, {
      x: isArm ? bendDeg : -bendDeg,
      y: currentMidRot.y,
      z: currentMidRot.z,
    });

    // Orient root joint toward target
    const dir = new THREE.Vector3().subVectors(targetWorldPos, rootPos).normalize();
    const pitch = Math.asin(-dir.y);
    const yaw = Math.atan2(dir.x, dir.z);

    this.setJointRotation(rootJoint, {
      x: THREE.MathUtils.radToDeg(pitch),
      y: THREE.MathUtils.radToDeg(yaw),
      z: this.getJointRotation(rootJoint).z,
    });
  }

  public dispose() {
    this.material.dispose();
    this.nodes?.boneMeshes?.forEach((mesh) => {
      mesh.geometry?.dispose();
    });
    if (this.customModelGroup) {
      this.nodes.root.remove(this.customModelGroup);
    }
    if (this.selectionHelper) {
      this.selectionHelper.geometry.dispose();
      (this.selectionHelper.material as THREE.Material).dispose();
    }
  }
}
