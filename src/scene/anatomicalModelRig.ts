import * as THREE from 'three';
import { JointKey } from '../types/skeleton';
import { GLTFBoneItem } from './SkeletonRig';

export interface AnatomicalJointDef {
  key: JointKey;
  label: string;
  category: 'spine' | 'head' | 'arm_L' | 'arm_R' | 'leg_L' | 'leg_R';
  worldPivot: [number, number, number];
  parentKey?: JointKey;
}

// Target human skeleton height = 1.80m
// In Diego Lujan Garcia's sculpture, Z (vertical before matrix) spans 6.91 units from feet (-3.41) to skull (+3.50).
// Scale factor = 1.80 / 6.91 = 0.260492
export const SKELETON_SCALE = 1.80 / 6.91;
export const SKELETON_MIN_Y = -3.41;

/**
 * Anatomical joint hierarchy with exact socket pivots in 1.80m scaled world space.
 * Parent-child Forward Kinematics ensures limbs NEVER detach from their sockets.
 */
export const ANATOMICAL_HIERARCHY_DEFS: AnatomicalJointDef[] = [
  // 1. Root & Vertebral Spine
  {
    key: 'pelvis',
    label: 'Pelvis / Leğen Kemiği (Ana Merkez)',
    category: 'spine',
    worldPivot: [0.0, 0.97, -0.03],
  },
  {
    key: 'spine_lumbar',
    label: 'Bel Omurgası (Lumbar Spine L1-L5)',
    category: 'spine',
    worldPivot: [0.0, 1.084, -0.039],
    parentKey: 'pelvis',
  },
  {
    key: 'spine_thoracic',
    label: 'Göğüs Kafesi & Sırt (Thorax & Ribs)',
    category: 'spine',
    worldPivot: [0.0, 1.25, -0.026],
    parentKey: 'spine_lumbar',
  },
  {
    key: 'spine_cervical',
    label: 'Boyun Omurları (Cervical Spine C1-C7)',
    category: 'spine',
    worldPivot: [0.0, 1.532, -0.023],
    parentKey: 'spine_thoracic',
  },
  {
    key: 'head',
    label: 'Kafatası (Cranium & Skull)',
    category: 'head',
    worldPivot: [0.0, 1.568, -0.036],
    parentKey: 'spine_cervical',
  },
  {
    key: 'jaw',
    label: 'Alt Çene (Mandible / Jaw)',
    category: 'head',
    worldPivot: [0.0, 1.62, -0.013],
    parentKey: 'head',
  },

  // 2. Left Arm
  {
    key: 'clavicle_L',
    label: 'Sol Köprücük & Kürek Kemiği (Clavicle L)',
    category: 'arm_L',
    worldPivot: [0.08, 1.48, 0.02],
    parentKey: 'spine_thoracic',
  },
  {
    key: 'shoulder_L',
    label: 'Sol Üst Kol (Humerus L)',
    category: 'arm_L',
    worldPivot: [0.181, 1.475, -0.02],
    parentKey: 'clavicle_L',
  },
  {
    key: 'lower_arm_L',
    label: 'Sol Ön Kol (Radius & Ulna L)',
    category: 'arm_L',
    worldPivot: [0.217, 0.84, -0.018],
    parentKey: 'shoulder_L',
  },
  {
    key: 'wrist_L',
    label: 'Sol El & Parmaklar (Hand L)',
    category: 'arm_L',
    worldPivot: [0.188, 0.718, -0.008],
    parentKey: 'lower_arm_L',
  },

  // 3. Right Arm
  {
    key: 'clavicle_R',
    label: 'Sağ Köprücük & Kürek Kemiği (Clavicle R)',
    category: 'arm_R',
    worldPivot: [-0.08, 1.48, 0.02],
    parentKey: 'spine_thoracic',
  },
  {
    key: 'shoulder_R',
    label: 'Sağ Üst Kol (Humerus R)',
    category: 'arm_R',
    worldPivot: [-0.181, 1.475, -0.02],
    parentKey: 'clavicle_R',
  },
  {
    key: 'lower_arm_R',
    label: 'Sağ Ön Kol (Radius & Ulna R)',
    category: 'arm_R',
    worldPivot: [-0.217, 0.84, -0.018],
    parentKey: 'shoulder_R',
  },
  {
    key: 'wrist_R',
    label: 'Sağ El & Parmaklar (Hand R)',
    category: 'arm_R',
    worldPivot: [-0.188, 0.718, -0.008],
    parentKey: 'lower_arm_R',
  },

  // 4. Left Leg
  {
    key: 'hip_L',
    label: 'Sol Uyluk (Femur L)',
    category: 'leg_L',
    worldPivot: [0.094, 0.959, -0.005],
    parentKey: 'pelvis',
  },
  {
    key: 'knee_L',
    label: 'Sol Kaval & Diz (Tibia & Patella L)',
    category: 'leg_L',
    worldPivot: [0.083, 0.464, -0.021],
    parentKey: 'hip_L',
  },
  {
    key: 'ankle_L',
    label: 'Sol Ayak & Parmaklar (Foot L)',
    category: 'leg_L',
    worldPivot: [0.063, 0.057, -0.013],
    parentKey: 'knee_L',
  },

  // 5. Right Leg
  {
    key: 'hip_R',
    label: 'Sağ Uyluk (Femur R)',
    category: 'leg_R',
    worldPivot: [-0.094, 0.959, -0.005],
    parentKey: 'pelvis',
  },
  {
    key: 'knee_R',
    label: 'Sağ Kaval & Diz (Tibia & Patella R)',
    category: 'leg_R',
    worldPivot: [-0.083, 0.464, -0.021],
    parentKey: 'hip_R',
  },
  {
    key: 'ankle_R',
    label: 'Sağ Ayak & Parmaklar (Foot R)',
    category: 'leg_R',
    worldPivot: [-0.063, 0.057, -0.013],
    parentKey: 'knee_R',
  },
];

/**
 * Transforms a raw geometry into centered, scaled (1.8m) human world space.
 */
function processModelGeometry(mesh: THREE.Mesh): THREE.BufferGeometry {
  const geom = mesh.geometry.clone();
  geom.applyMatrix4(mesh.matrixWorld);

  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) * SKELETON_SCALE,
      (pos.getY(i) - SKELETON_MIN_Y) * SKELETON_SCALE,
      pos.getZ(i) * SKELETON_SCALE
    );
  }
  geom.computeVertexNormals();
  geom.computeBoundingBox();
  return geom;
}

/**
 * Extracts a clean, non-shared BufferGeometry matching a spatial filter predicate.
 * This guarantees 100% separation between left and right limb geometries without vertex bleeding.
 */
function extractSubGeometry(
  geom: THREE.BufferGeometry,
  predicate: (avgX: number, avgY: number, avgZ: number) => boolean
): THREE.BufferGeometry {
  const pos = geom.attributes.position;
  const norm = geom.attributes.normal;
  const idx = geom.index;
  const triCount = idx ? idx.count / 3 : pos.count / 3;

  const newPositions: number[] = [];
  const newNormals: number[] = [];

  for (let i = 0; i < triCount; i++) {
    const i0 = idx ? idx.getX(i * 3) : i * 3;
    const i1 = idx ? idx.getX(i * 3 + 1) : i * 3 + 1;
    const i2 = idx ? idx.getX(i * 3 + 2) : i * 3 + 2;

    const x0 = pos.getX(i0), y0 = pos.getY(i0), z0 = pos.getZ(i0);
    const x1 = pos.getX(i1), y1 = pos.getY(i1), z1 = pos.getZ(i1);
    const x2 = pos.getX(i2), y2 = pos.getY(i2), z2 = pos.getZ(i2);

    const avgX = (x0 + x1 + x2) / 3;
    const avgY = (y0 + y1 + y2) / 3;
    const avgZ = (z0 + z1 + z2) / 3;

    if (predicate(avgX, avgY, avgZ)) {
      newPositions.push(x0, y0, z0, x1, y1, z1, x2, y2, z2);
      if (norm) {
        newNormals.push(
          norm.getX(i0), norm.getY(i0), norm.getZ(i0),
          norm.getX(i1), norm.getY(i1), norm.getZ(i1),
          norm.getX(i2), norm.getY(i2), norm.getZ(i2)
        );
      }
    }
  }

  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
  if (newNormals.length > 0) {
    result.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
  } else {
    result.computeVertexNormals();
  }
  result.computeBoundingBox();
  return result;
}

/**
 * Builds an anatomical Forward Kinematics rig for Diego Luján García's Skeleton model.
 * - Every joint is connected to its parent socket.
 * - Non-root joints are rotated only: bones NEVER detach or separate from sockets.
 * - Left and Right limbs are 100% separate physical meshes and joints.
 * - Every single bone is raycast-clickable in the 3D viewport.
 */
export function setupAnatomicalModelRig(
  modelGroup: THREE.Group,
  figureId: string,
  material: THREE.Material,
  applyChromeMaterial = true
): {
  bones: Map<string, THREE.Object3D>;
  boneList: GLTFBoneItem[];
  boneMeshes: THREE.Mesh[];
  jointKeyToBone: Map<JointKey, THREE.Object3D>;
  boneNameToJointKey: Map<string, JointKey>;
} {
  const bones = new Map<string, THREE.Object3D>();
  const boneList: GLTFBoneItem[] = [];
  const boneMeshes: THREE.Mesh[] = [];
  const jointKeyToBone = new Map<JointKey, THREE.Object3D>();
  const boneNameToJointKey = new Map<string, JointKey>();

  // Ensure world matrices are fully computed
  modelGroup.updateMatrixWorld(true);

  // Collect named meshes
  const rawMeshMap = new Map<string, THREE.Mesh>();
  modelGroup.traverse((child) => {
    if ((child as any).isMesh) {
      rawMeshMap.set(child.name, child as THREE.Mesh);
    }
  });

  const isDiegoModel = rawMeshMap.has('Object_11') && rawMeshMap.has('Object_12');

  if (!isDiegoModel) {
    // Fallback for standard models
    modelGroup.traverse((child) => {
      if ((child as any).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (applyChromeMaterial) {
          (mesh as any).isChromeMesh = true;
          mesh.material = material;
        }
        mesh.userData = { figureId, jointKey: 'pelvis', boneName: mesh.name };
        boneMeshes.push(mesh);
      }
    });
    return { bones, boneList, boneMeshes, jointKeyToBone, boneNameToJointKey };
  }

  // Pre-process all geometries into scaled human coordinates (Feet at Y=0, Head top at Y=1.80m)
  const processedGeomMap = new Map<string, THREE.BufferGeometry>();
  rawMeshMap.forEach((mesh, name) => {
    processedGeomMap.set(name, processModelGeometry(mesh));
  });

  // 1. Create Joint Pivot Groups
  const jointGroupMap = new Map<JointKey, THREE.Group>();
  const jointSpecMap = new Map<JointKey, AnatomicalJointDef>();

  ANATOMICAL_HIERARCHY_DEFS.forEach((def) => {
    const group = new THREE.Group();
    group.name = `Joint_${def.key}`;
    jointGroupMap.set(def.key, group);
    jointSpecMap.set(def.key, def);

    bones.set(def.key, group);
    bones.set(def.label, group);
    jointKeyToBone.set(def.key, group);
    boneNameToJointKey.set(def.key, def.key);

    boneList.push({
      name: def.key,
      node: group,
      matchedKey: def.key,
      label: def.label,
      category: def.category,
    });
  });

  // 2. Assemble Parent-Child Forward Kinematics Hierarchy
  ANATOMICAL_HIERARCHY_DEFS.forEach((def) => {
    const jointGroup = jointGroupMap.get(def.key)!;
    const [jx, jy, jz] = def.worldPivot;

    if (def.parentKey) {
      const parentGroup = jointGroupMap.get(def.parentKey)!;
      const parentDef = jointSpecMap.get(def.parentKey)!;
      const [px, py, pz] = parentDef.worldPivot;

      // Distance from parent socket to child socket
      jointGroup.position.set(jx - px, jy - py, jz - pz);
      parentGroup.add(jointGroup);
    } else {
      // Pelvis root located at world pivot
      jointGroup.position.set(jx, jy, jz);
    }
  });

  // Helper to attach geometry to a joint group
  const attachMeshToJoint = (
    geom: THREE.BufferGeometry,
    jointKey: JointKey,
    meshName: string
  ) => {
    if (!geom.attributes.position || geom.attributes.position.count === 0) return;

    const spec = jointSpecMap.get(jointKey)!;
    const jointGroup = jointGroupMap.get(jointKey)!;
    const [jx, jy, jz] = spec.worldPivot;

    const mesh = new THREE.Mesh(geom, material);
    mesh.name = meshName;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    (mesh as any).isChromeMesh = true;

    // Center mesh origin on this joint's socket pivot
    mesh.position.set(-jx, -jy, -jz);

    // Raycast picking metadata: clicking this bone selects the joint!
    mesh.userData = {
      figureId,
      jointKey,
      boneName: spec.label,
      isSkinned: false,
    };

    jointGroup.add(mesh);
    boneMeshes.push(mesh);
  };

  // Helper for bilateral splitting
  const attachBilateral = (
    geomName: string,
    leftJointKey: JointKey,
    rightJointKey: JointKey,
    labelBase: string,
    yFilter?: (y: number) => boolean
  ) => {
    const rawGeom = processedGeomMap.get(geomName);
    if (!rawGeom) return;

    const leftGeom = extractSubGeometry(rawGeom, (x, y) => x >= 0 && (!yFilter || yFilter(y)));
    const rightGeom = extractSubGeometry(rawGeom, (x, y) => x < 0 && (!yFilter || yFilter(y)));

    attachMeshToJoint(leftGeom, leftJointKey, `${labelBase}_L`);
    attachMeshToJoint(rightGeom, rightJointKey, `${labelBase}_R`);
  };

  // ==========================================
  // 3. ATTACH CENTRAL AXIAL SKELETON
  // ==========================================

  // Pelvis / Sacrum (Object_12)
  if (processedGeomMap.has('Object_12')) {
    attachMeshToJoint(processedGeomMap.get('Object_12')!, 'pelvis', 'Pelvis_Sacrum');
  }

  // Lumbar Spine (lower part of Object_5, Y < 1.18)
  if (processedGeomMap.has('Object_5')) {
    const lumbarSpineGeom = extractSubGeometry(processedGeomMap.get('Object_5')!, (_x, y) => y < 1.18);
    attachMeshToJoint(lumbarSpineGeom, 'spine_lumbar', 'Lumbar_Spine');
  }

  // Thoracic Spine, Ribs & Sternum (Object_4 is Rib Cage!, Object_16 is Sternum!, mid of Object_5 is Thoracic Spine)
  if (processedGeomMap.has('Object_4')) {
    attachMeshToJoint(processedGeomMap.get('Object_4')!, 'spine_thoracic', 'Rib_Cage');
  }
  if (processedGeomMap.has('Object_16')) {
    attachMeshToJoint(processedGeomMap.get('Object_16')!, 'spine_thoracic', 'Sternum');
  }
  if (processedGeomMap.has('Object_5')) {
    const thoracicSpineGeom = extractSubGeometry(
      processedGeomMap.get('Object_5')!,
      (_x, y) => y >= 1.18 && y < 1.45
    );
    attachMeshToJoint(thoracicSpineGeom, 'spine_thoracic', 'Thoracic_Spine_Column');
  }

  // Cervical Spine (Object_14 & top of Object_5)
  if (processedGeomMap.has('Object_14')) {
    attachMeshToJoint(processedGeomMap.get('Object_14')!, 'spine_cervical', 'Cervical_Vertebrae');
  }
  if (processedGeomMap.has('Object_5')) {
    const cervicalSpineGeom = extractSubGeometry(processedGeomMap.get('Object_5')!, (_x, y) => y >= 1.45);
    attachMeshToJoint(cervicalSpineGeom, 'spine_cervical', 'Cervical_Spine_Column');
  }

  // Head / Skull (Object_11 & Object_15)
  if (processedGeomMap.has('Object_11')) {
    attachMeshToJoint(processedGeomMap.get('Object_11')!, 'head', 'Cranium_Skull');
  }
  if (processedGeomMap.has('Object_15')) {
    attachMeshToJoint(processedGeomMap.get('Object_15')!, 'head', 'Maxilla_Upper_Teeth');
  }

  // Mandible / Jaw (Object_3)
  if (processedGeomMap.has('Object_3')) {
    attachMeshToJoint(processedGeomMap.get('Object_3')!, 'jaw', 'Mandible_Jaw');
  }

  // ==========================================
  // 4. ATTACH UPPER LIMBS (ARMS)
  // ==========================================

  // Clavicles (Object_19) & Scapulae (Object_6)
  attachBilateral('Object_19', 'clavicle_L', 'clavicle_R', 'Clavicle');
  attachBilateral('Object_6', 'clavicle_L', 'clavicle_R', 'Scapula');

  // Humerus (Object_9 is Humerus Head/Upper!, Object_10 is Humerus Lower!, Object_18 is Humerus Shaft!)
  attachBilateral('Object_9', 'shoulder_L', 'shoulder_R', 'Humerus_Upper');
  attachBilateral('Object_10', 'shoulder_L', 'shoulder_R', 'Humerus_Lower');
  attachBilateral('Object_18', 'shoulder_L', 'shoulder_R', 'Humerus_Shaft');

  // Forearm & Hand (Object_17): Split at wrist line (Y = 0.718m)
  attachBilateral('Object_17', 'lower_arm_L', 'lower_arm_R', 'Forearm_Radius_Ulna', (y) => y >= 0.718);
  attachBilateral('Object_17', 'wrist_L', 'wrist_R', 'Hand_Digits', (y) => y < 0.718);

  // ==========================================
  // 5. ATTACH LOWER LIMBS (LEGS)
  // ==========================================

  // Femur (Object_13)
  attachBilateral('Object_13', 'hip_L', 'hip_R', 'Femur');

  // Patella & Tibia & Fibula (Object_20, Object_7, Object_21)
  attachBilateral('Object_20', 'knee_L', 'knee_R', 'Patella');
  attachBilateral('Object_7', 'knee_L', 'knee_R', 'Tibia');
  attachBilateral('Object_21', 'knee_L', 'knee_R', 'Fibula');

  // Feet (Object_8)
  attachBilateral('Object_8', 'ankle_L', 'ankle_R', 'Foot_Digits');

  // ==========================================
  // 6. ASSEMBLE MODEL ROOT
  // ==========================================
  const pelvisRoot = jointGroupMap.get('pelvis')!;

  // Clear existing raw children and mount kinematic pelvis root
  while (modelGroup.children.length > 0) {
    modelGroup.remove(modelGroup.children[0]);
  }
  modelGroup.add(pelvisRoot);

  return { bones, boneList, boneMeshes, jointKeyToBone, boneNameToJointKey };
}
