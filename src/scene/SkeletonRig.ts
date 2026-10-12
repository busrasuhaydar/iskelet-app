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
import { CustomModelRigAdapter } from './CustomModelRigAdapter';

export interface IKTargetHandles {
  hand_L: THREE.Group;
  hand_R: THREE.Group;
  foot_L: THREE.Group;
  foot_R: THREE.Group;
  head_look: THREE.Group;
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
  public rigAdapter: CustomModelRigAdapter | null = null;
  public currentMaterialSettings: MaterialSettings;

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
    const jointGroup = this.nodes.jointGroups[key];
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

    // Convert degrees to radians for Three.js
    // For elbows (lower_arm) and wrists, anatomical flexion (x > 0) bends the limb FORWARD towards chest (+Z)
    const radX =
      key === 'lower_arm_L' || key === 'lower_arm_R' || key === 'wrist_L' || key === 'wrist_R'
        ? -THREE.MathUtils.degToRad(x)
        : THREE.MathUtils.degToRad(x);

    jointGroup.rotation.set(
      radX,
      THREE.MathUtils.degToRad(y),
      THREE.MathUtils.degToRad(z)
    );

    // Propagate rotation to custom GLTF model adapter if present
    if (this.rigAdapter) {
      this.rigAdapter.applyJointRotation(key, { x, y, z });
    }

    if (this.selectedJointKey === key && this.selectionHelper) {
      this.updateSelectionHelperPosition();
    }
  }

  public getJointRotation(key: JointKey): EulerDegrees {
    return this.currentPose.joints[key] || { x: 0, y: 0, z: 0 };
  }

  public getJointGroup(key: JointKey): THREE.Group | undefined {
    if (this.rigAdapter) {
      const target = this.rigAdapter.getTargetObject(key);
      if (target) return target as THREE.Group;
    }
    return this.nodes.jointGroups[key];
  }

  public getRootGroup(): THREE.Group {
    return this.nodes.root;
  }

  // ==========================================
  // POSE MANAGEMENT & MIRRORING
  // ==========================================

  public applyPose(pose: Partial<FigurePose>) {
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
  // MATERIAL SETTINGS
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
    this.material.needsUpdate = true;

    // If custom model is attached with chrome material, ensure meshes share material
    if (this.customModelGroup) {
      this.nodes.boneMeshes.forEach((mesh) => {
        if ((mesh as any).isChromeMesh !== false) {
          mesh.material = this.material;
        }
      });
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

    // Hide procedural bones meshes so custom model takes center stage
    Object.values(this.nodes.jointGroups).forEach((jg) => {
      jg.children.forEach((child) => {
        if ((child as any).isMesh && (child.userData as any)?.isBone) {
          child.visible = false;
        }
      });
    });

    // Add custom model group to figure root
    this.nodes.root.add(modelGroup);

    // Initialize smart custom model rig adapter
    this.rigAdapter = new CustomModelRigAdapter(modelGroup, this.nodes.jointGroups, this.id);

    // Apply materials
    this.rigAdapter.candidateMeshes.forEach((mesh) => {
      if (options.applyChromeMaterial !== false) {
        (mesh as any).isChromeMesh = true;
        mesh.material = this.material;
      } else {
        (mesh as any).isChromeMesh = false;
      }
    });

    // Expose all meshes to picking
    this.nodes.boneMeshes = [...this.rigAdapter.candidateMeshes];

    // Re-apply any existing active pose so custom model immediately poses!
    if (this.currentPose.joints) {
      Object.entries(this.currentPose.joints).forEach(([key, rot]) => {
        if (rot) {
          this.rigAdapter?.applyJointRotation(key as JointKey, rot);
        }
      });
    }
  }

  // ==========================================
  // SELECTION & HIGHLIGHTING
  // ==========================================

  private createSelectionHelper() {
    const ringGeom = new THREE.TorusGeometry(0.045, 0.005, 12, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      depthTest: false,
      transparent: true,
      opacity: 0.9,
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
    const targetObj = this.getJointGroup(this.selectedJointKey);
    if (!targetObj) return;

    // Get world position relative to root
    const worldPos = new THREE.Vector3();
    targetObj.getWorldPosition(worldPos);
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
    this.nodes.boneMeshes.forEach((mesh) => {
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
