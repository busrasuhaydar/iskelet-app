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
