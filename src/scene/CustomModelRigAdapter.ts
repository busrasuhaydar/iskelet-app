import * as THREE from 'three';
import { JointKey, EulerDegrees } from '../types/skeleton';
import { ANATOMICAL_JOINTS } from './jointDefinitions';

export type CustomRigType = 'skinned' | 'hierarchical_meshes' | 'auto_rigged_mesh';

export interface CustomRigInfo {
  rigType: CustomRigType;
  mappedJointCount: number;
  totalBoneCount: number;
  totalMeshCount: number;
  skinnedMeshCount: number;
  mappedJoints: Partial<Record<JointKey, string>>;
}

/**
 * Dictionary mapping every JointKey to common 3D skeleton naming conventions:
 * - Mixamo (mixamorig:*)
 * - Blender Rigify / General (*.L, *.R, upper_arm, etc.)
 * - Medical & Anatomical (Latin, English, Turkish: Cranium, Femur, Humerus, Omurga, Boyun, etc.)
 * - Unreal Engine / Metahuman / Unity Humanoid
 */
const JOINT_NAME_PATTERNS: Record<JointKey, string[]> = {
  pelvis: [
    'pelvis', 'hips', 'hip', 'root', 'sacrum', 'waist', 'cog', 'b_pelvis',
    'mixamorig:hips', 'mixamorig_hips', 'def_hips', 'torso', 'leğen', 'legen', 'kalca', 'kalça'
  ],
  spine_lumbar: [
    'spinelumbar', 'spine_lumbar', 'spine', 'spine1', 'spine_01', 'spine.001', 'lumbar', 'l1', 'l2', 'l3', 'l4', 'l5',
    'b_spine', 'mixamorig:spine', 'def_spine', 'omurga', 'bel'
  ],
  spine_thoracic: [
    'spinethoracic', 'spine_thoracic', 'spine2', 'spine_02', 'spine.002', 'chest', 'upperchest', 'thorax', 'thoracic',
    'ribcage', 'rib', 'ribs', 'sternum', 'göğüs', 'gogus', 'mixamorig:spine1', 'mixamorig:spine2', 'def_spine1', 'def_spine2'
  ],
  spine_cervical: [
    'spinecervical', 'spine_cervical', 'neck', 'neck1', 'cervical', 'c1', 'c2', 'c3', 'c7', 'boyun',
    'b_neck', 'mixamorig:neck', 'def_neck'
  ],
  head: [
    'head', 'skull', 'cranium', 'calvaria', 'kafa', 'baş', 'bas', 'caput',
    'b_head', 'mixamorig:head', 'def_head'
  ],
  jaw: [
    'jaw', 'mandible', 'chin', 'çene', 'cene', 'maxilla', 'mixamorig:jaw'
  ],
  clavicle_L: [
    'clavicle_l', 'clavicle.l', 'leftclavicle', 'left_clavicle', 'collar_l', 'collar.l', 'leftcollar',
    'shoulder_l', 'leftshoulder', 'scapula_l', 'scapula.l', 'left_scapula', 'köprücük_sol', 'koprucuk_sol',
    'mixamorig:leftshoulder', 'def_shoulder.l'
  ],
  shoulder_L: [
    'upperarm_l', 'upper_arm_l', 'upper_arm.l', 'leftupperarm', 'left_upper_arm', 'arm_l', 'arm.l', 'leftarm', 'left_arm',
    'humerus_l', 'humerus.l', 'left_humerus', 'b_l_arm', 'kol_sol', 'kol_üst_sol',
    'mixamorig:leftarm', 'def_upper_arm.l'
  ],
  lower_arm_L: [
    'lowerarm_l', 'lower_arm_l', 'lower_arm.l', 'leftlowerarm', 'left_lower_arm', 'forearm_l', 'forearm.l', 'leftforearm',
    'radius_l', 'ulna_l', 'radius.l', 'ulna.l', 'left_radius', 'left_ulna', 'önkol_sol', 'onkol_sol',
    'mixamorig:leftforearm', 'def_forearm.l'
  ],
  wrist_L: [
    'wrist_l', 'wrist.l', 'leftwrist', 'left_wrist', 'hand_l', 'hand.l', 'lefthand', 'left_hand',
    'carpal_l', 'carpals_l', 'el_sol', 'bilek_sol', 'mixamorig:lefthand', 'def_hand.l'
  ],
  thumb_L: [
    'thumb_l', 'thumb.l', 'leftthumb', 'thumb_01_l', 'thumb1.l', 'mixamorig:lefthandthumb1', 'başparmak_sol'
  ],
  index_L: [
    'index_l', 'index.l', 'leftindex', 'index_01_l', 'index1.l', 'mixamorig:lefthandindex1', 'işaret_sol'
  ],
  middle_L: [
    'middle_l', 'middle.l', 'leftmiddle', 'middle_01_l', 'middle1.l', 'mixamorig:lefthandmiddle1', 'orta_sol'
  ],
  ring_L: [
    'ring_l', 'ring.l', 'leftring', 'ring_01_l', 'ring1.l', 'mixamorig:lefthandring1', 'yüzük_sol'
  ],
  pinky_L: [
    'pinky_l', 'pinky.l', 'little_l', 'little.l', 'leftpinky', 'mixamorig:lefthandpinky1', 'serçe_sol'
  ],
  clavicle_R: [
    'clavicle_r', 'clavicle.r', 'rightclavicle', 'right_clavicle', 'collar_r', 'collar.r', 'rightcollar',
    'shoulder_r', 'rightshoulder', 'scapula_r', 'scapula.r', 'right_scapula', 'köprücük_sağ', 'koprucuk_sag',
    'mixamorig:rightshoulder', 'def_shoulder.r'
  ],
  shoulder_R: [
    'upperarm_r', 'upper_arm_r', 'upper_arm.r', 'rightupperarm', 'right_upper_arm', 'arm_r', 'arm.r', 'rightarm', 'right_arm',
    'humerus_r', 'humerus.r', 'right_humerus', 'b_r_arm', 'kol_sağ', 'kol_sag', 'kol_üst_sağ',
    'mixamorig:rightarm', 'def_upper_arm.r'
  ],
  lower_arm_R: [
    'lowerarm_r', 'lower_arm_r', 'lower_arm.r', 'rightlowerarm', 'right_lower_arm', 'forearm_r', 'forearm.r', 'rightforearm',
    'radius_r', 'ulna_r', 'radius.r', 'ulna.r', 'right_radius', 'right_ulna', 'önkol_sağ', 'onkol_sag',
    'mixamorig:rightforearm', 'def_forearm.r'
  ],
  wrist_R: [
    'wrist_r', 'wrist.r', 'rightwrist', 'right_wrist', 'hand_r', 'hand.r', 'righthand', 'right_hand',
    'carpal_r', 'carpals_r', 'el_sağ', 'el_sag', 'bilek_sağ', 'bilek_sag', 'mixamorig:righthand', 'def_hand.r'
  ],
  thumb_R: [
    'thumb_r', 'thumb.r', 'rightthumb', 'thumb_01_r', 'thumb1.r', 'mixamorig:righthandthumb1', 'başparmak_sağ'
  ],
  index_R: [
    'index_r', 'index.r', 'rightindex', 'index_01_r', 'index1.r', 'mixamorig:righthandindex1', 'işaret_sağ'
  ],
  middle_R: [
    'middle_r', 'middle.r', 'rightmiddle', 'middle_01_r', 'middle1.r', 'mixamorig:righthandmiddle1', 'orta_sağ'
  ],
  ring_R: [
    'ring_r', 'ring.r', 'rightring', 'ring_01_r', 'ring1.r', 'mixamorig:righthandring1', 'yüzük_sağ'
  ],
  pinky_R: [
    'pinky_r', 'pinky.r', 'little_r', 'little.r', 'rightpinky', 'mixamorig:righthandpinky1', 'serçe_sağ'
  ],
  hip_L: [
    'thigh_l', 'thigh.l', 'leftthigh', 'left_thigh', 'upleg_l', 'up_leg_l', 'up_leg.l', 'leftupleg', 'left_up_leg',
    'femur_l', 'femur.l', 'left_femur', 'uyluk_sol', 'bacak_sol', 'mixamorig:leftupleg', 'def_thigh.l'
  ],
  knee_L: [
    'calf_l', 'calf.l', 'leftcalf', 'knee_l', 'knee.l', 'leftknee', 'shin_l', 'shin.l', 'leftshin', 'left_shin',
    'lowerleg_l', 'lower_leg_l', 'lower_leg.l', 'left_leg', 'tibia_l', 'tibia.l', 'fibula_l', 'patella_l',
    'diz_sol', 'kaval_sol', 'mixamorig:leftleg', 'def_shin.l'
  ],
  ankle_L: [
    'foot_l', 'foot.l', 'leftfoot', 'left_foot', 'ankle_l', 'ankle.l', 'leftankle', 'tarsus_l', 'talus_l', 'calcaneus_l',
    'ayak_sol', 'bilek_ayak_sol', 'topuk_sol', 'mixamorig:leftfoot', 'def_foot.l'
  ],
  toes_L: [
    'toe_l', 'toe.l', 'toes_l', 'toes.l', 'lefttoe', 'lefttoebase', 'left_toes', 'parmak_ayak_sol',
    'mixamorig:lefttoebase', 'def_toe.l'
  ],
  hip_R: [
    'thigh_r', 'thigh.r', 'rightthigh', 'right_thigh', 'upleg_r', 'up_leg_r', 'up_leg.r', 'rightupleg', 'right_up_leg',
    'femur_r', 'femur.r', 'right_femur', 'uyluk_sağ', 'uyluk_sag', 'bacak_sağ', 'bacak_sag', 'mixamorig:rightupleg', 'def_thigh.r'
  ],
  knee_R: [
    'calf_r', 'calf.r', 'rightcalf', 'knee_r', 'knee.r', 'rightknee', 'shin_r', 'shin.r', 'rightshin', 'right_shin',
    'lowerleg_r', 'lower_leg_r', 'lower_leg.r', 'right_leg', 'tibia_r', 'tibia.r', 'fibula_r', 'patella_r',
    'diz_sağ', 'diz_sag', 'kaval_sağ', 'kaval_sag', 'mixamorig:rightleg', 'def_shin.r'
  ],
  ankle_R: [
    'foot_r', 'foot.r', 'rightfoot', 'right_foot', 'ankle_r', 'ankle.r', 'rightankle', 'tarsus_r', 'talus_r', 'calcaneus_r',
    'ayak_sağ', 'ayak_sag', 'bilek_ayak_sağ', 'topuk_sağ', 'mixamorig:rightfoot', 'def_foot.r'
  ],
  toes_R: [
    'toe_r', 'toe.r', 'toes_r', 'toes.r', 'righttoe', 'righttoebase', 'right_toes', 'parmak_ayak_sağ',
    'mixamorig:righttoebase', 'def_toe.r'
  ],
};

export class CustomModelRigAdapter {
  public rigType: CustomRigType = 'skinned';
  public mappedBones: Map<JointKey, THREE.Object3D> = new Map();
  public restTransforms: Map<
    THREE.Object3D,
    { quaternion: THREE.Quaternion; position: THREE.Vector3; rotation: THREE.Euler }
  > = new Map();
  public skinnedMeshes: THREE.SkinnedMesh[] = [];
  public candidateMeshes: THREE.Mesh[] = [];

  constructor(
    public modelRoot: THREE.Group,
    public proceduralJointGroups: Record<JointKey, THREE.Group>,
    public figureId: string
  ) {
    this.analyzeAndBind();
  }

  /**
   * Main setup: Inspects the model, classifies rig architecture,
   * establishes bone/mesh mappings, and prepares the custom model for full posing!
   */
  private analyzeAndBind() {
    const allBones: THREE.Bone[] = [];
    const allMeshes: THREE.Mesh[] = [];
    const allObjects: THREE.Object3D[] = [];

    this.modelRoot.traverse((node) => {
      allObjects.push(node);
      if ((node as any).isBone) {
        allBones.push(node as THREE.Bone);
      }
      if ((node as any).isSkinnedMesh) {
        this.skinnedMeshes.push(node as THREE.SkinnedMesh);
      }
      if ((node as any).isMesh) {
        allMeshes.push(node as THREE.Mesh);
      }
    });

    this.candidateMeshes = allMeshes;

    // Determine architecture
    if (allBones.length > 0) {
      this.rigType = 'skinned';
      this.bindSkinnedBones(allBones, allMeshes);
    } else if (allMeshes.length > 3) {
      this.rigType = 'hierarchical_meshes';
      this.bindHierarchicalMeshes(allMeshes);
    } else {
      this.rigType = 'auto_rigged_mesh';
      this.bindAutoRiggedMesh(allMeshes);
    }

    // Ensure all meshes have Raycast picking userData
    this.setupPickingData();
  }

  /**
   * Strategy A: Model with THREE.Bone objects (e.g. Mixamo, Blender Armature, etc.)
   */
  private bindSkinnedBones(allBones: THREE.Bone[], allMeshes: THREE.Mesh[]) {
    // Record rest transforms for all bones
    allBones.forEach((bone) => {
      this.restTransforms.set(bone, {
        quaternion: bone.quaternion.clone(),
        position: bone.position.clone(),
        rotation: bone.rotation.clone(),
      });
    });

    const usedBones = new Set<THREE.Bone>();

    // 1. Name-based matching
    (Object.keys(JOINT_NAME_PATTERNS) as JointKey[]).forEach((jKey) => {
      const patterns = JOINT_NAME_PATTERNS[jKey];
      const matchedBone = allBones.find((bone) => {
        if (usedBones.has(bone)) return false;
        const bName = bone.name.toLowerCase().replace(/[^a-z0-9_.]/g, '');
        return patterns.some((p) => {
          const normP = p.toLowerCase().replace(/[^a-z0-9_.]/g, '');
          return bName === normP || bName.includes(normP);
        });
      });

      if (matchedBone) {
        this.mappedBones.set(jKey, matchedBone);
        usedBones.add(matchedBone);
      }
    });

    // 2. Spatial anatomical fallback for remaining key joints if name didn't match
    const remainingKeys: JointKey[] = [
      'head', 'pelvis', 'spine_thoracic', 'spine_lumbar', 'shoulder_L', 'lower_arm_L',
      'wrist_L', 'shoulder_R', 'lower_arm_R', 'wrist_R', 'hip_L', 'knee_L', 'ankle_L',
      'hip_R', 'knee_R', 'ankle_R'
    ];

    const modelBox = new THREE.Box3().setFromObject(this.modelRoot);
    const boxSize = new THREE.Vector3();
    modelBox.getSize(boxSize);

    remainingKeys.forEach((key) => {
      if (this.mappedBones.has(key)) return;

      const unmapped = allBones.filter((b) => !usedBones.has(b));
      if (unmapped.length === 0) return;

      const worldPos = new THREE.Vector3();
      const bestBone = this.findBestSpatialBone(key, unmapped, modelBox, boxSize);
      if (bestBone) {
        this.mappedBones.set(key, bestBone);
        usedBones.add(bestBone);
      }
    });

    // For any mapped bone, tag it with jointKey
    this.mappedBones.forEach((bone, jKey) => {
      bone.userData = {
        figureId: this.figureId,
        jointKey: jKey,
        isCustomBone: true,
      };
    });
  }

  /**
   * Strategy B: Multiple discrete anatomical meshes (e.g. medical skeleton exports)
   * Reparents/attaches each matching bone mesh into the corresponding procedural joint group!
   */
  private bindHierarchicalMeshes(meshes: THREE.Mesh[]) {
    const usedMeshes = new Set<THREE.Mesh>();
    const modelBox = new THREE.Box3().setFromObject(this.modelRoot);
    const boxSize = new THREE.Vector3();
    modelBox.getSize(boxSize);

    // 1. Name-based match
    (Object.keys(JOINT_NAME_PATTERNS) as JointKey[]).forEach((jKey) => {
      const patterns = JOINT_NAME_PATTERNS[jKey];
      const matched = meshes.filter((mesh) => {
        if (usedMeshes.has(mesh)) return false;
        const mName = mesh.name.toLowerCase().replace(/[^a-z0-9_.]/g, '');
        return patterns.some((p) => {
          const normP = p.toLowerCase().replace(/[^a-z0-9_.]/g, '');
          return mName === normP || mName.includes(normP);
        });
      });

      if (matched.length > 0) {
        matched.forEach((m) => {
          usedMeshes.add(m);
          const targetGroup = this.proceduralJointGroups[jKey];
          if (targetGroup) {
            targetGroup.attach(m);
          }
          m.userData = {
            figureId: this.figureId,
            jointKey: jKey,
            boneName: m.name,
            isCustomAnatomicalMesh: true,
          };
        });
        this.mappedBones.set(jKey, this.proceduralJointGroups[jKey]);
      }
    });

    // 2. Spatial match for unattached meshes
    meshes.forEach((mesh) => {
      if (usedMeshes.has(mesh)) return;
      const jKey = this.classifyMeshAnatomicalRegion(mesh, modelBox, boxSize);
      if (jKey && this.proceduralJointGroups[jKey]) {
        this.proceduralJointGroups[jKey].attach(mesh);
        mesh.userData = {
          figureId: this.figureId,
          jointKey: jKey,
          boneName: mesh.name,
          isCustomAnatomicalMesh: true,
        };
        usedMeshes.add(mesh);
        if (!this.mappedBones.has(jKey)) {
          this.mappedBones.set(jKey, this.proceduralJointGroups[jKey]);
        }
      }
    });
  }

  /**
   * Strategy C: Single mesh or low-mesh unrigged skeleton model
   * Keeps procedural joint groups as posable handles and binds raycasting
   */
  private bindAutoRiggedMesh(meshes: THREE.Mesh[]) {
    // Add procedural joints as handles
    (Object.keys(this.proceduralJointGroups) as JointKey[]).forEach((key) => {
      this.mappedBones.set(key, this.proceduralJointGroups[key]);
    });

    meshes.forEach((mesh) => {
      mesh.userData = {
        figureId: this.figureId,
        jointKey: 'pelvis',
        isCustomModelMesh: true,
      };
    });
  }

  /**
   * Spatial anatomical locator for bone/mesh
   */
  private classifyMeshAnatomicalRegion(
    mesh: THREE.Mesh,
    modelBox: THREE.Box3,
    boxSize: THREE.Vector3
  ): JointKey | null {
    const meshBox = new THREE.Box3().setFromObject(mesh);
    const center = new THREE.Vector3();
    meshBox.getCenter(center);

    const relY = (center.y - modelBox.min.y) / (boxSize.y || 1);
    const relX = (center.x - modelBox.min.x) / (boxSize.x || 1) - 0.5;

    // Head / Skull (top 15%)
    if (relY > 0.82) return 'head';
    // Neck
    if (relY > 0.76) return 'spine_cervical';

    // Left Arm (relX < -0.15)
    if (relX < -0.15) {
      if (relY > 0.65) return 'shoulder_L';
      if (relY > 0.45) return 'lower_arm_L';
      return 'wrist_L';
    }

    // Right Arm (relX > +0.15)
    if (relX > 0.15) {
      if (relY > 0.65) return 'shoulder_R';
      if (relY > 0.45) return 'lower_arm_R';
      return 'wrist_R';
    }

    // Spine & Chest
    if (relY > 0.62) return 'spine_thoracic';
    if (relY > 0.52) return 'spine_lumbar';
    if (relY > 0.42) return 'pelvis';

    // Legs
    if (relX <= 0) {
      // Left leg
      if (relY > 0.22) return 'hip_L';
      if (relY > 0.05) return 'knee_L';
      return 'ankle_L';
    } else {
      // Right leg
      if (relY > 0.22) return 'hip_R';
      if (relY > 0.05) return 'knee_R';
      return 'ankle_R';
    }
  }

  private findBestSpatialBone(
    key: JointKey,
    bones: THREE.Bone[],
    modelBox: THREE.Box3,
    boxSize: THREE.Vector3
  ): THREE.Bone | null {
    const def = ANATOMICAL_JOINTS[key];
    if (!def) return null;

    let bestBone: THREE.Bone | null = null;
    let minDistance = Infinity;

    const bonePos = new THREE.Vector3();
    bones.forEach((bone) => {
      bone.getWorldPosition(bonePos);
      const relY = (bonePos.y - modelBox.min.y) / (boxSize.y || 1);
      const relX = (bonePos.x - modelBox.min.x) / (boxSize.x || 1) - 0.5;

      let score = 0;
      if (key === 'head' && relY > 0.8) score = 10;
      else if (key === 'pelvis' && relY >= 0.4 && relY <= 0.6) score = 10;
      else if (key.includes('_L') && relX < 0) score = 5;
      else if (key.includes('_R') && relX > 0) score = 5;

      const dist = -score + Math.abs(relY - 0.5);
      if (dist < minDistance) {
        minDistance = dist;
        bestBone = bone;
      }
    });

    return bestBone;
  }

  /**
   * Configures raycasting pick data on candidate meshes
   */
  private setupPickingData() {
    this.candidateMeshes.forEach((mesh) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (!mesh.userData.jointKey) {
        const box = new THREE.Box3().setFromObject(mesh);
        const center = new THREE.Vector3();
        box.getCenter(center);

        // Find nearest mapped joint
        let nearestKey: JointKey = 'pelvis';
        let shortestDist = Infinity;
        const jPos = new THREE.Vector3();

        this.mappedBones.forEach((obj, jKey) => {
          obj.getWorldPosition(jPos);
          const d = center.distanceTo(jPos);
          if (d < shortestDist) {
            shortestDist = d;
            nearestKey = jKey;
          }
        });

        mesh.userData.jointKey = nearestKey;
      }

      mesh.userData.figureId = this.figureId;
    });
  }

  /**
   * Applies target Euler angles (in degrees) to mapped custom bone / group
   */
  public applyJointRotation(key: JointKey, angles: EulerDegrees) {
    const targetObj = this.mappedBones.get(key) || this.proceduralJointGroups[key];
    if (!targetObj) return;

    const rest = this.restTransforms.get(targetObj);

    // Anatomical flexion conversion
    const isNegatedX =
      key === 'lower_arm_L' || key === 'lower_arm_R' || key === 'wrist_L' || key === 'wrist_R';
    const radX = isNegatedX ? -THREE.MathUtils.degToRad(angles.x) : THREE.MathUtils.degToRad(angles.x);
    const radY = THREE.MathUtils.degToRad(angles.y);
    const radZ = THREE.MathUtils.degToRad(angles.z);

    if (rest) {
      // Skinned bone: combine rest rotation with delta
      const deltaEuler = new THREE.Euler(radX, radY, radZ, 'XYZ');
      const deltaQuat = new THREE.Quaternion().setFromEuler(deltaEuler);
      targetObj.quaternion.copy(rest.quaternion).multiply(deltaQuat);
    } else {
      // Group or mesh
      targetObj.rotation.set(radX, radY, radZ);
    }

    targetObj.updateMatrix();

    // If skinned meshes are present, refresh skeleton
    this.skinnedMeshes.forEach((sm) => {
      sm.skeleton?.update();
    });
  }

  /**
   * Returns information summary about the rig binding
   */
  public getRigInfo(): CustomRigInfo {
    const mappedJointsRecord: Partial<Record<JointKey, string>> = {};
    this.mappedBones.forEach((obj, key) => {
      mappedJointsRecord[key] = obj.name || key;
    });

    return {
      rigType: this.rigType,
      mappedJointCount: this.mappedBones.size,
      totalBoneCount: this.restTransforms.size,
      totalMeshCount: this.candidateMeshes.length,
      skinnedMeshCount: this.skinnedMeshes.length,
      mappedJoints: mappedJointsRecord,
    };
  }

  public getTargetObject(key: JointKey): THREE.Object3D | undefined {
    return this.mappedBones.get(key) || this.proceduralJointGroups[key];
  }
}
