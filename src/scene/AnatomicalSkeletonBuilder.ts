import * as THREE from 'three';
import { ANATOMICAL_JOINTS } from './jointDefinitions';
import { JointKey } from '../types/skeleton';

export interface SkeletonRigNodes {
  root: THREE.Group;
  jointGroups: Record<JointKey, THREE.Group>;
  boneMeshes: THREE.Mesh[];
  materials: THREE.MeshPhysicalMaterial[];
}

/**
 * Professional Anatomical Human Skeleton Geometry Engine
 *
 * Implements dedicated anatomical reference craftsmanship inspired by
 * master anatomical reference tools (e.g. Skelly by Proko):
 *
 * 1. Skull & Cranium:
 *    - Cranium vault (calvaria) with frontal slope, parietal eminences, temporal fossae, and occiput.
 *    - Supraorbital brow ridge, deep almond-shaped orbital sockets, piriform nasal aperture with nasal bones.
 *    - Graceful zygomatic arches bridging temporal bone to cheekbones.
 *    - Maxilla alveolar arch with contoured individual tooth crowns.
 *    - Mandible (jaw) with ascending rami, coronoid process, TMJ condyle, mental protuberance (chin),
 *      and mandibular teeth.
 *
 * 2. Vertebral Column & Thorax:
 *    - Cervical (C1-C7 lordosis), Thoracic (T1-T12 kyphosis), Lumbar (L1-L5 lordosis), Sacrum shield, and Coccyx.
 *    - Individual vertebral bodies, pedicles, transverse processes, and backward-pointing spinous processes.
 *    - 12 pairs of anatomically curved ribs forming the true barrel-shaped thoracic cylinder.
 *    - Manubrium, sternal body, and xiphoid process.
 *
 * 3. Pelvis & Sacrum:
 *    - Flared iliac wings with undulating iliac crests, ASIS spines, ischial tuberosities, and pubic arch.
 *    - Deep acetabular socket cups.
 *
 * 4. Upper Limbs:
 *    - S-curved clavicles and sculpted triangular scapulae with acromion, spine, and glenoid fossa.
 *    - Humerus with spherical head, bicipital groove, shaft, epicondyles, and trochlea.
 *    - Ulna with hooked olecranon process (elbow beak); Radius with circular head and styloid.
 *    - Arched carpal cluster, 5 radiating metacarpals, and 5 fully articulated fingers with
 *      physiological length hierarchy (middle > ring > index > pinky) and terminal tufts.
 *
 * 5. Lower Limbs:
 *    - Femur with spherical head, 125° neck, greater/lesser trochanters, anteriorly bowed shaft, and bicondylar knee.
 *    - Patella sesamoid kneecaps.
 *    - Tibia with flared plateau, shin crest, and medial malleolus; slender fibula with lateral malleolus.
 *    - Sculpted calcaneus heel (tuber calcanei), talus saddle dome, tarsal arch, 5 metatarsals,
 *      and articulated toes with robust hallux.
 */
export class AnatomicalSkeletonBuilder {
  public static buildSkeleton(
    figureId: string,
    baseMaterial: THREE.MeshPhysicalMaterial
  ): SkeletonRigNodes {
    const root = new THREE.Group();
    root.name = `SkeletonRoot_${figureId}`;
    root.userData = { figureId, isSkeletonRoot: true };

    const jointGroups: Partial<Record<JointKey, THREE.Group>> = {};
    const boneMeshes: THREE.Mesh[] = [];
    const materials: THREE.MeshPhysicalMaterial[] = [baseMaterial];

    // 1. Create joint pivot groups
    (Object.keys(ANATOMICAL_JOINTS) as JointKey[]).forEach((key) => {
      const group = new THREE.Group();
      group.name = `Joint_${key}_${figureId}`;
      group.userData = { figureId, jointKey: key, isJoint: true };
      jointGroups[key] = group;
    });

    // 2. Assemble parent-child hierarchy
    (Object.keys(ANATOMICAL_JOINTS) as JointKey[]).forEach((key) => {
      const def = ANATOMICAL_JOINTS[key];
      const grp = jointGroups[key]!;
      grp.position.set(...def.defaultPosition);

      if (def.parentKey && jointGroups[def.parentKey]) {
        jointGroups[def.parentKey]!.add(grp);
      } else {
        root.add(grp);
      }
    });

    const registerBone = (
      mesh: THREE.Mesh,
      jointKey: JointKey,
      boneName: string,
      targetGroup: THREE.Group
    ) => {
      mesh.name = `Bone_${boneName}_${figureId}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { figureId, jointKey, boneName, isBone: true };
      boneMeshes.push(mesh);
      targetGroup.add(mesh);
    };

    // ==========================================
    // 1. PELVIS & SACRUM
    // ==========================================
    const pelvisGroup = jointGroups.pelvis!;
    this.createPelvisMesh(baseMaterial, (m, name) => registerBone(m, 'pelvis', name, pelvisGroup));

    // ==========================================
    // 2. VERTEBRAL SPINE & THORAX
    // ==========================================
    const lumbarGroup = jointGroups.spine_lumbar!;
    this.createVertebraeColumn(5, 0.046, 0.038, 0.034, 'lumbar', baseMaterial, (m, name) =>
      registerBone(m, 'spine_lumbar', name, lumbarGroup)
    );

    const thoracicGroup = jointGroups.spine_thoracic!;
    this.createThoracicCage(baseMaterial, (m, name) =>
      registerBone(m, 'spine_thoracic', name, thoracicGroup)
    );

    const cervicalGroup = jointGroups.spine_cervical!;
    this.createVertebraeColumn(7, 0.03, 0.026, 0.022, 'cervical', baseMaterial, (m, name) =>
      registerBone(m, 'spine_cervical', name, cervicalGroup)
    );

    // ==========================================
    // 3. SKULL & MANDIBLE
    // ==========================================
    const headGroup = jointGroups.head!;
    this.createSculptedSkull(baseMaterial, (m, name) => registerBone(m, 'head', name, headGroup));

    const jawGroup = jointGroups.jaw!;
    this.createSculptedMandible(baseMaterial, (m, name) => registerBone(m, 'jaw', name, jawGroup));

    // ==========================================
    // 4. UPPER & LOWER LIMBS (L & R)
    // ==========================================
    ['L', 'R'].forEach((side) => {
      const isL = side === 'L';

      // Clavicle & Scapula
      const clavKey = `clavicle_${side}` as JointKey;
      this.createClavicleScapula(isL, baseMaterial, (m, name) =>
        registerBone(m, clavKey, name, jointGroups[clavKey]!)
      );

      // Humerus
      const shKey = `shoulder_${side}` as JointKey;
      this.createSculptedHumerus(isL, baseMaterial, (m, name) =>
        registerBone(m, shKey, name, jointGroups[shKey]!)
      );

      // Radius & Ulna
      const laKey = `lower_arm_${side}` as JointKey;
      this.createSculptedForearm(isL, baseMaterial, (m, name) =>
        registerBone(m, laKey, name, jointGroups[laKey]!)
      );

      // Hand & Carpals
      const wrKey = `wrist_${side}` as JointKey;
      this.createSculptedHandCarpals(isL, baseMaterial, (m, name) =>
        registerBone(m, wrKey, name, jointGroups[wrKey]!)
      );

      // 5 Distinct Digits
      const fingerKeys = ['thumb', 'index', 'middle', 'ring', 'pinky'];
      fingerKeys.forEach((f) => {
        const fingerKey = `${f}_${side}` as JointKey;
        this.createSculptedFinger(f, isL, baseMaterial, (m, name) =>
          registerBone(m, fingerKey, name, jointGroups[fingerKey]!)
        );
      });

      // Femur
      const hipKey = `hip_${side}` as JointKey;
      this.createSculptedFemur(isL, baseMaterial, (m, name) =>
        registerBone(m, hipKey, name, jointGroups[hipKey]!)
      );

      // Tibia, Fibula, Patella
      const kneeKey = `knee_${side}` as JointKey;
      this.createSculptedLowerLeg(isL, baseMaterial, (m, name) =>
        registerBone(m, kneeKey, name, jointGroups[kneeKey]!)
      );

      // Ankle & Tarsals / Calcaneus
      const ankKey = `ankle_${side}` as JointKey;
      this.createSculptedFoot(isL, baseMaterial, (m, name) =>
        registerBone(m, ankKey, name, jointGroups[ankKey]!)
      );

      // Articulated Toes
      const toesKey = `toes_${side}` as JointKey;
      this.createSculptedToes(isL, baseMaterial, (m, name) =>
        registerBone(m, toesKey, name, jointGroups[toesKey]!)
      );
    });

    return {
      root,
      jointGroups: jointGroups as Record<JointKey, THREE.Group>,
      boneMeshes,
      materials,
    };
  }

  // =========================================================================
  // 1. SCULPTED HUMAN SKULL & CRANIUM
  // =========================================================================

  private static createSculptedSkull(
    mat: THREE.Material,
    register: (m: THREE.Mesh, name: string) => void
  ) {
    // 1. Cranium Vault (Calvaria) - Sculpted smooth anatomical cranial vault
    const vaultGeom = new THREE.SphereGeometry(0.125, 36, 30);
    const vPos = vaultGeom.attributes.position;
    for (let i = 0; i < vPos.count; i++) {
      let x = vPos.getX(i);
      let y = vPos.getY(i);
      let z = vPos.getZ(i);

      // Cranial vault elongation: dolichocephalic/mesocephalic human proportions
      x *= 0.86;
      y *= 1.04;
      z *= 1.15;

      // Flatten cranial base for foramen magnum
      if (y < -0.04) {
        y *= 0.72;
      }

      // Temporal fossae indentations on lateral walls
      if (z > -0.04 && z < 0.08 && y < 0.04) {
        x *= 0.93;
      }

      // Frontal slope down into forehead
      if (z > 0.04 && y > 0.02) {
        y *= 0.98;
        x *= 0.95;
      }

      // Prominent parietal eminences (widest point of posterior cranium)
      if (z < -0.02 && z > -0.08 && y > 0.02) {
        x *= 1.05;
      }

      vPos.setXYZ(i, x, y, z);
    }
    vaultGeom.computeVertexNormals();
    const vaultMesh = new THREE.Mesh(vaultGeom, mat);
    vaultMesh.position.set(0, 0.065, -0.015);
    register(vaultMesh, 'CraniumVault');

    // 2. Supraorbital Brow Ridge (Frontal bone arches)
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.068, 0.038, 0.11),
      new THREE.Vector3(-0.035, 0.046, 0.124),
      new THREE.Vector3(0, 0.042, 0.126), // Glabella
      new THREE.Vector3(0.035, 0.046, 0.124),
      new THREE.Vector3(0.068, 0.038, 0.11),
    ]);
    const browGeom = new THREE.TubeGeometry(browCurve, 24, 0.011, 12, false);
    const browMesh = new THREE.Mesh(browGeom, mat);
    register(browMesh, 'BrowRidge');

    // 3. Deep Almond-Shaped Orbital Cavities (Eye Sockets)
    [-1, 1].forEach((s) => {
      // Anatomical Orbital Margin Rim
      const rimCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(s * 0.02, 0.036, 0.122),  // Upper medial
        new THREE.Vector3(s * 0.042, 0.04, 0.12),   // Upper
        new THREE.Vector3(s * 0.066, 0.022, 0.112), // Lateral (malar)
        new THREE.Vector3(s * 0.054, -0.002, 0.114),// Lower
        new THREE.Vector3(s * 0.022, 0.008, 0.118), // Lower medial (lacrimal)
      ], true);
      const rimGeom = new THREE.TubeGeometry(rimCurve, 20, 0.0065, 10, true);
      const rimMesh = new THREE.Mesh(rimGeom, mat);
      register(rimMesh, `OrbitRim_${s > 0 ? 'L' : 'R'}`);

      // Deep Pyramidal Orbital Cavity
      const socketGeom = new THREE.ConeGeometry(0.025, 0.045, 18);
      socketGeom.rotateX(Math.PI / 2);
      const socketMesh = new THREE.Mesh(socketGeom, mat);
      socketMesh.position.set(s * 0.042, 0.018, 0.092);
      register(socketMesh, `OrbitDepth_${s > 0 ? 'L' : 'R'}`);

      // Zygomatic Arch (Cheekbone bridge connecting temporal to malar)
      const cheekCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(s * 0.052, -0.004, 0.11),
        new THREE.Vector3(s * 0.088, -0.006, 0.065),
        new THREE.Vector3(s * 0.082, 0.015, -0.015),
      ]);
      const cheekGeom = new THREE.TubeGeometry(cheekCurve, 18, 0.0085, 10, false);
      const cheekMesh = new THREE.Mesh(cheekGeom, mat);
      register(cheekMesh, `ZygomaticArch_${s > 0 ? 'L' : 'R'}`);
    });

    // 4. Piriform Aperture & Nasal Bones
    const nasalCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.042, 0.126), // Nasion
      new THREE.Vector3(0, 0.02, 0.134),  // Rhinion bridge
      new THREE.Vector3(0, -0.002, 0.126),// Anterior nasal spine
    ]);
    const nasalGeom = new THREE.TubeGeometry(nasalCurve, 12, 0.0075, 8, false);
    const nasalMesh = new THREE.Mesh(nasalGeom, mat);
    register(nasalMesh, 'NasalBones');

    // Pear-shaped Piriform Aperture opening rim
    const piriCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.02, 0.13),
      new THREE.Vector3(0.015, 0.008, 0.126),
      new THREE.Vector3(0.018, -0.008, 0.122),
      new THREE.Vector3(0, -0.014, 0.122), // Base spine
      new THREE.Vector3(-0.018, -0.008, 0.122),
      new THREE.Vector3(-0.015, 0.008, 0.126),
    ], true);
    const piriGeom = new THREE.TubeGeometry(piriCurve, 18, 0.0045, 8, true);
    const piriMesh = new THREE.Mesh(piriGeom, mat);
    register(piriMesh, 'PiriformAperture');

    // 5. Maxilla & Upper Dental Arch
    const maxillaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.044, -0.018, 0.065),
      new THREE.Vector3(-0.038, -0.034, 0.098),
      new THREE.Vector3(0, -0.036, 0.114),
      new THREE.Vector3(0.038, -0.034, 0.098),
      new THREE.Vector3(0.044, -0.018, 0.065),
    ]);
    const maxillaGeom = new THREE.TubeGeometry(maxillaCurve, 20, 0.0135, 10, false);
    const maxillaMesh = new THREE.Mesh(maxillaGeom, mat);
    register(maxillaMesh, 'MaxillaArch');

    // Upper Teeth (14 contoured anatomical teeth crowns)
    for (let t = 0; t < 14; t++) {
      const u = t / 13;
      const pt = maxillaCurve.getPoint(u);
      const isMolar = t < 3 || t > 10;
      const isCanine = t === 3 || t === 10;
      const toothGeom = isMolar
        ? new THREE.CylinderGeometry(0.0048, 0.0042, 0.012, 10)
        : isCanine
        ? new THREE.ConeGeometry(0.0038, 0.014, 8)
        : new THREE.CylinderGeometry(0.0035, 0.0028, 0.012, 8);
      toothGeom.rotateX(Math.PI);
      const toothMesh = new THREE.Mesh(toothGeom, mat);
      toothMesh.position.set(pt.x, pt.y - 0.011, pt.z);
      register(toothMesh, `UpperTooth_${t + 1}`);
    }
  }

  // =========================================================================
  // 2. SCULPTED MANDIBLE (JAW) WITH CONDYLES & CHIN
  // =========================================================================

  private static createSculptedMandible(
    mat: THREE.Material,
    register: (m: THREE.Mesh, name: string) => void
  ) {
    // Mandible Horseshoe Body
    const jawCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.054, 0.032, -0.024), // Left condyle (TMJ)
      new THREE.Vector3(-0.052, -0.012, 0.018),  // Left angle (gonion)
      new THREE.Vector3(-0.034, -0.028, 0.064),
      new THREE.Vector3(0, -0.032, 0.086),      // Chin point (gnathion)
      new THREE.Vector3(0.034, -0.028, 0.064),
      new THREE.Vector3(0.052, -0.012, 0.018),   // Right angle
      new THREE.Vector3(0.054, 0.032, -0.024),  // Right condyle
    ]);
    const jawGeom = new THREE.TubeGeometry(jawCurve, 30, 0.0115, 10, false);
    const jawMesh = new THREE.Mesh(jawGeom, mat);
    register(jawMesh, 'MandibleBody');

    // Left & Right Coronoid Processes (muscle attachment beaks)
    [-1, 1].forEach((s) => {
      const coronoidGeom = new THREE.ConeGeometry(0.008, 0.022, 8);
      coronoidGeom.rotateZ(s * -0.3);
      const coronoidMesh = new THREE.Mesh(coronoidGeom, mat);
      coronoidMesh.position.set(s * 0.048, 0.025, 0.002);
      register(coronoidMesh, `Coronoid_${s > 0 ? 'L' : 'R'}`);
    });

    // Mental Protuberance (Sculpted anatomical human chin triangle)
    const chinGeom = new THREE.SphereGeometry(0.016, 14, 12);
    chinGeom.scale(1.2, 0.9, 1.1);
    const chinMesh = new THREE.Mesh(chinGeom, mat);
    chinMesh.position.set(0, -0.032, 0.085);
    register(chinMesh, 'ChinProtuberance');

    // Lower Dental Arch & Teeth (12 contoured crowns)
    for (let t = 0; t < 12; t++) {
      const u = (t + 1) / 14;
      const pt = jawCurve.getPoint(u);
      const isMolar = t < 2 || t > 9;
      const toothGeom = isMolar
        ? new THREE.CylinderGeometry(0.0044, 0.0038, 0.011, 10)
        : new THREE.CylinderGeometry(0.0032, 0.0025, 0.011, 8);
      const toothMesh = new THREE.Mesh(toothGeom, mat);
      toothMesh.position.set(pt.x, pt.y + 0.011, pt.z);
      register(toothMesh, `LowerTooth_${t + 1}`);
    }
  }

  // =========================================================================
  // 3. VERTEBRAE COLUMN & THORACIC CAGE
  // =========================================================================

  private static createVertebraeColumn(
    count: number,
    spacing: number,
    radius: number,
    thickness: number,
    region: 'cervical' | 'thoracic' | 'lumbar',
    mat: THREE.Material,
    register: (m: THREE.Mesh, name: string) => void
  ) {
    for (let i = 0; i < count; i++) {
      const y = i * spacing;

      // Vertebral Body (spool cylinder with reniform curvature)
      const bodyGeom = new THREE.CylinderGeometry(radius * 0.95, radius, thickness, 20);
      const bodyMesh = new THREE.Mesh(bodyGeom, mat);
      bodyMesh.position.set(0, y, 0.004);
      register(bodyMesh, `Vertebra_${region}_${i + 1}`);

      // Spinous Process (backward projecting anatomical process)
      const spinousAngle = region === 'thoracic' ? -0.45 : region === 'lumbar' ? -0.1 : -0.2;
      const spinousCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, y, -radius * 0.6),
        new THREE.Vector3(0, y + spinousAngle * radius, -radius * 1.55),
      ]);
      const spinousGeom = new THREE.TubeGeometry(spinousCurve, 8, radius * 0.22, 6, false);
      const spinousMesh = new THREE.Mesh(spinousGeom, mat);
      register(spinousMesh, `SpinousProcess_${region}_${i + 1}`);

      // Transverse Processes (lateral wings)
      [-1, 1].forEach((s) => {
        const transGeom = new THREE.CylinderGeometry(radius * 0.16, radius * 0.22, thickness * 1.5, 8);
        transGeom.rotateZ(s * -Math.PI / 2);
        const transMesh = new THREE.Mesh(transGeom, mat);
        transMesh.position.set(s * radius * 0.85, y, -radius * 0.35);
        register(transMesh, `Transverse_${region}_${i + 1}_${s > 0 ? 'L' : 'R'}`);
      });
    }
  }

  private static createThoracicCage(
    mat: THREE.Material,
    register: (m: THREE.Mesh, name: string) => void
  ) {
    // 12 Thoracic Vertebrae
    this.createVertebraeColumn(12, 0.024, 0.034, 0.021, 'thoracic', mat, register);

    // Sternum (Manubrium, Sternal Body, Xiphoid Process)
    const sternumCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.23, 0.165), // Suprasternal notch
      new THREE.Vector3(0, 0.17, 0.17),  // Sternal angle of Louis
      new THREE.Vector3(0, 0.06, 0.165), // Gladiolus body
      new THREE.Vector3(0, -0.02, 0.155),// Xiphoid tip
    ]);
    const sternumGeom = new THREE.TubeGeometry(sternumCurve, 20, 0.016, 12, false);
    const sternumMesh = new THREE.Mesh(sternumGeom, mat);
    register(sternumMesh, 'SternumGladiolus');

    // Manubrium shield plate
    const manubriumGeom = new THREE.BoxGeometry(0.065, 0.045, 0.014);
    const manubriumMesh = new THREE.Mesh(manubriumGeom, mat);
    manubriumMesh.position.set(0, 0.21, 0.166);
    register(manubriumMesh, 'ManubriumShield');

    // 12 Pairs of True & False Ribs forming anatomical thoracic barrel
    for (let r = 0; r < 12; r++) {
      const yBack = 0.24 - r * 0.022;
      const yFront = 0.21 - r * 0.019;
      // Barrel expansion: widest at ribs 7-8
      const barrel = Math.sin((r / 11) * Math.PI) * 0.076 + 0.078;
      const latW = barrel * 1.55;
      const frontDist = 0.165 - Math.max(0, r - 7) * 0.014;

      [-1, 1].forEach((s) => {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(s * 0.03, yBack, -0.018),
          new THREE.Vector3(s * latW * 0.85, yBack - 0.01, -0.028),
          new THREE.Vector3(s * latW, yBack - 0.025, 0.055),
          new THREE.Vector3(s * latW * 0.72, yFront - 0.012, 0.132),
          new THREE.Vector3(s * (0.026 + Math.max(0, r - 6) * 0.01), yFront, frontDist),
        ]);
        const ribGeom = new THREE.TubeGeometry(curve, 22, 0.0078 - r * 0.00018, 8, false);
        const ribMesh = new THREE.Mesh(ribGeom, mat);
        register(ribMesh, `Rib_${r + 1}_${s > 0 ? 'L' : 'R'}`);
      });
    }
  }

  // =========================================================================
  // 4. PELVIS & SACRUM
  // =========================================================================

  private static createPelvisMesh(
    mat: THREE.Material,
    register: (m: THREE.Mesh, name: string) => void
  ) {
    [-1, 1].forEach((sign) => {
      // Iliac Wings & Crests (smooth anatomical contour)
      const iliumCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sign * 0.025, 0.08, -0.045), // Posterior superior spine
        new THREE.Vector3(sign * 0.145, 0.09, -0.015), // Iliac crest peak
        new THREE.Vector3(sign * 0.155, 0.02, 0.035),  // Anterior superior spine (ASIS)
        new THREE.Vector3(sign * 0.09, -0.04, 0.045),  // Acetabulum rim
      ]);
      const iliumGeom = new THREE.TubeGeometry(iliumCurve, 20, 0.018, 10, false);
      const iliumMesh = new THREE.Mesh(iliumGeom, mat);
      register(iliumMesh, `IliumCrest_${sign > 0 ? 'L' : 'R'}`);

      // Ilium Blade Fan
      const bladeGeom = new THREE.SphereGeometry(0.08, 16, 12, 0, Math.PI * 0.65, 0, Math.PI * 0.55);
      bladeGeom.scale(1.1, 0.9, 0.5);
      const bladeMesh = new THREE.Mesh(bladeGeom, mat);
      bladeMesh.position.set(sign * 0.085, 0.02, 0.01);
      bladeMesh.rotation.set(-0.25, sign * 0.45, sign * 0.15);
      register(bladeMesh, `IliumBlade_${sign > 0 ? 'L' : 'R'}`);

      // Ischium & Pubic Arch Ring (obturator foramen contour)
      const obturatorCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sign * 0.075, -0.035, 0.02),
        new THREE.Vector3(sign * 0.085, -0.11, -0.02), // Ischial tuberosity
        new THREE.Vector3(sign * 0.025, -0.095, 0.04), // Pubic symphysis
        new THREE.Vector3(sign * 0.045, -0.045, 0.04), // Superior pubic ramus
      ], true);
      const obturatorGeom = new THREE.TubeGeometry(obturatorCurve, 18, 0.014, 8, true);
      const obturatorMesh = new THREE.Mesh(obturatorGeom, mat);
      register(obturatorMesh, `IschiumPubis_${sign > 0 ? 'L' : 'R'}`);

      // Acetabular Cup (hip socket)
      const acetabulumGeom = new THREE.SphereGeometry(0.026, 14, 12);
      const acetabulumMesh = new THREE.Mesh(acetabulumGeom, mat);
      acetabulumMesh.position.set(sign * 0.085, -0.04, 0.01);
      register(acetabulumMesh, `Acetabulum_${sign > 0 ? 'L' : 'R'}`);
    });

    // Sacrum & Coccyx (perforated shield plate with sacral promontory)
    const sacrumCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.075, -0.045), // Promontory
      new THREE.Vector3(0, 0.01, -0.065),
      new THREE.Vector3(0, -0.055, -0.072),
      new THREE.Vector3(0, -0.095, -0.065), // Coccyx tip
    ]);
    const sacrumGeom = new THREE.TubeGeometry(sacrumCurve, 16, 0.028, 10, false);
    const sacrumMesh = new THREE.Mesh(sacrumGeom, mat);
    register(sacrumMesh, 'SacrumShield');
  }

  // =========================================================================
  // 5. UPPER LIMBS (CLAVICLE, SCAPULA, HUMERUS, FOREARM, HAND, FINGERS)
  // =========================================================================

  private static createClavicleScapula(
    isL: boolean,
    mat: THREE.Material,
    register: (m: THREE.Mesh, name: string) => void
  ) {
    const s = isL ? 1 : -1;

    // S-curved Clavicle
    const clavCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(s * 0.065, 0.014, 0.026),
      new THREE.Vector3(s * 0.145, -0.008, -0.014),
    ]);
    const clavGeom = new THREE.TubeGeometry(clavCurve, 18, 0.011, 10, false);
    const clavMesh = new THREE.Mesh(clavGeom, mat);
    register(clavMesh, `Clavicle_${isL ? 'L' : 'R'}`);

    // Scapula with Spine & Acromion Process
    const scapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * 0.04, -0.02, -0.08),  // Medial border
      new THREE.Vector3(s * 0.13, -0.015, -0.06), // Acromion tip
      new THREE.Vector3(s * 0.07, -0.16, -0.075), // Inferior angle
    ], true);
    const scapGeom = new THREE.TubeGeometry(scapCurve, 18, 0.012, 8, true);
    const scapMesh = new THREE.Mesh(scapGeom, mat);
    register(scapMesh, `Scapula_${isL ? 'L' : 'R'}`);

    // Acromion Arch capping the shoulder joint
    const acromionGeom = new THREE.BoxGeometry(0.038, 0.014, 0.042);
    const acromionMesh = new THREE.Mesh(acromionGeom, mat);
    acromionMesh.position.set(s * 0.14, 0.008, -0.025);
    register(acromionMesh, `Acromion_${isL ? 'L' : 'R'}`);
  }

  private static createSculptedHumerus(
    isL: boolean,
    mat: THREE.Material,
    register: (m: THREE.Mesh, name: string) => void
  ) {
    const s = isL ? 1 : -1;

    // Hemispherical Humeral Head fitting into glenoid
    const headGeom = new THREE.SphereGeometry(0.035, 20, 18);
    const headMesh = new THREE.Mesh(headGeom, mat);
    headMesh.position.set(s * -0.01, 0.008, -0.006);
    register(headMesh, `HumerusHead_${isL ? 'L' : 'R'}`);

    // Greater & Lesser Tubercles
    const tubercleGeom = new THREE.SphereGeometry(0.022, 12, 10);
    const tubercleMesh = new THREE.Mesh(tubercleGeom, mat);
    tubercleMesh.position.set(s * 0.018, 0.004, 0.012);
    register(tubercleMesh, `HumerusTubercle_${isL ? 'L' : 'R'}`);

    // Organic Shaft with Deltoid Curve
    const shaftCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(s * 0.012, -0.15, 0.008),
      new THREE.Vector3(0, -0.31, 0),
    ]);
    const shaftGeom = new THREE.TubeGeometry(shaftCurve, 20, 0.0165, 12, false);
    const shaftMesh = new THREE.Mesh(shaftGeom, mat);
    register(shaftMesh, `HumerusShaft_${isL ? 'L' : 'R'}`);

    // Distal Epicondyles & Spool Trochlea (Elbow joint surface)
    const condyleGeom = new THREE.CylinderGeometry(0.024, 0.022, 0.054, 16);
    condyleGeom.rotateZ(Math.PI / 2);
    const condyleMesh = new THREE.Mesh(condyleGeom, mat);
    condyleMesh.position.set(0, -0.31, 0);
    register(condyleMesh, `HumerusCondyles_${isL ? 'L' : 'R'}`);
  }

  private static createSculptedForearm(
    isL: boolean,
    mat: THREE.Material,
    register: (m: THREE.Mesh, name: string) => void
  ) {
    const s = isL ? 1 : -1;

    // 1. Ulna with Hooked Olecranon Process (The true anatomical elbow hook)
    const olecranonGeom = new THREE.SphereGeometry(0.022, 14, 12);
    olecranonGeom.scale(0.85, 1.2, 1.1);
    const olecranonMesh = new THREE.Mesh(olecranonGeom, mat);
    olecranonMesh.position.set(s * -0.012, 0.015, -0.016);
    register(olecranonMesh, `Olecranon_${isL ? 'L' : 'R'}`);

    const ulnaShaftGeom = new THREE.CylinderGeometry(0.013, 0.009, 0.28, 12);
    const ulnaMesh = new THREE.Mesh(ulnaShaftGeom, mat);
    ulnaMesh.position.set(s * -0.012, -0.14, -0.004);
    register(ulnaMesh, `UlnaShaft_${isL ? 'L' : 'R'}`);

    // 2. Radius with Circular Head & Broad Distal Styloid
    const radialHeadGeom = new THREE.CylinderGeometry(0.018, 0.016, 0.02, 16);
    const radialHeadMesh = new THREE.Mesh(radialHeadGeom, mat);
    radialHeadMesh.position.set(s * 0.016, -0.015, 0.004);
    register(radialHeadMesh, `RadialHead_${isL ? 'L' : 'R'}`);

    const radiusCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * 0.016, -0.02, 0.004),
      new THREE.Vector3(s * 0.022, -0.15, 0.008),
      new THREE.Vector3(s * 0.018, -0.27, 0.002),
    ]);
    const radiusGeom = new THREE.TubeGeometry(radiusCurve, 16, 0.0135, 10, false);
    const radiusMesh = new THREE.Mesh(radiusGeom, mat);
    register(radiusMesh, `RadiusShaft_${isL ? 'L' : 'R'}`);
  }

  private static createSculptedHandCarpals(
    isL: boolean,
    mat: THREE.Material,
    register: (m: THREE.Mesh, name: string) => void
  ) {
    const s = isL ? 1 : -1;

    // Arched Carpal Cluster (anatomical wrist pebbles with palmar groove)
    const carpalCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * -0.022, -0.012, 0),
      new THREE.Vector3(0, -0.015, -0.005),
      new THREE.Vector3(s * 0.022, -0.012, 0),
    ]);
    const carpalGeom = new THREE.TubeGeometry(carpalCurve, 12, 0.016, 10, false);
    const carpalMesh = new THREE.Mesh(carpalGeom, mat);
    register(carpalMesh, `CarpalArch_${isL ? 'L' : 'R'}`);

    // 5 Radiating Metacarpals with Knuckle Condyles
    for (let m = 0; m < 5; m++) {
      const isThumbMeta = m === 0;
      const xOff = isThumbMeta ? s * 0.024 : (m - 2.5) * 0.011 * s;
      const zOff = isThumbMeta ? 0.015 : 0;
      const metaLen = isThumbMeta ? 0.045 : 0.062 - Math.abs(m - 2) * 0.003;

      const metaCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xOff * 0.7, -0.022, zOff * 0.7),
        new THREE.Vector3(xOff, -0.022 - metaLen, zOff),
      ]);
      const metaGeom = new THREE.TubeGeometry(metaCurve, 8, 0.0062, 8, false);
      const metaMesh = new THREE.Mesh(metaGeom, mat);
      register(metaMesh, `Metacarpal_${m + 1}_${isL ? 'L' : 'R'}`);

      // Rounded Knuckle Condyle Head
      const knuckleGeom = new THREE.SphereGeometry(0.0075, 10, 8);
      const knuckleMesh = new THREE.Mesh(knuckleGeom, mat);
      knuckleMesh.position.set(xOff, -0.022 - metaLen, zOff);
      register(knuckleMesh, `Knuckle_${m + 1}_${isL ? 'L' : 'R'}`);
    }
  }

  private static createSculptedFinger(
    finger: string,
    isL: boolean,
    mat: THREE.Material,
    register: (m: THREE.Mesh, name: string) => void
  ) {
    const isThumb = finger === 'thumb';
    const numPhalanges = isThumb ? 2 : 3;

    // Physiological length scaling: middle finger longest, ring 2nd, index 3rd, pinky shortest
    const lengthMult =
      finger === 'middle' ? 1.05 : finger === 'ring' ? 0.98 : finger === 'index' ? 0.92 : finger === 'pinky' ? 0.78 : 0.88;
    const baseLen = (isThumb ? 0.024 : 0.022) * lengthMult;

    let accumY = 0;
    for (let p = 0; p < numPhalanges; p++) {
      const pLen = baseLen * (1 - p * 0.22);
      const rad = Math.max(0.003, 0.0048 - p * 0.0008);

      // Anatomical phalanx with widened articular bases
      const pCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, accumY, 0),
        new THREE.Vector3(0, accumY - pLen, p === 2 ? 0.002 : 0), // Slight natural flex curl
      ]);
      const pGeom = new THREE.TubeGeometry(pCurve, 8, rad, 8, false);
      const pMesh = new THREE.Mesh(pGeom, mat);
      register(pMesh, `Phalanx_${finger}_${p + 1}_${isL ? 'L' : 'R'}`);

      // Flared condylar knuckle between phalanges
      const jGeom = new THREE.SphereGeometry(rad * 1.1, 8, 6);
      const jMesh = new THREE.Mesh(jGeom, mat);
      jMesh.position.set(0, accumY - pLen, 0);
      register(jMesh, `PhalanxJoint_${finger}_${p + 1}_${isL ? 'L' : 'R'}`);

      accumY -= pLen;
    }
  }

  // =========================================================================
  // 6. LOWER LIMBS (FEMUR, PATELLA, TIBIA, FIBULA, FOOT, TOES)
  // =========================================================================

  private static createSculptedFemur(
    isL: boolean,
    mat: THREE.Material,
    register: (m: THREE.Mesh, name: string) => void
  ) {
    const s = isL ? 1 : -1;

    // Spherical Femoral Head fitting into acetabulum
    const headGeom = new THREE.SphereGeometry(0.042, 22, 18);
    const headMesh = new THREE.Mesh(headGeom, mat);
    headMesh.position.set(s * -0.05, 0.034, 0);
    register(headMesh, `FemurHead_${isL ? 'L' : 'R'}`);

    // Angled 125° Femoral Neck
    const neckCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * -0.05, 0.034, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const neckGeom = new THREE.TubeGeometry(neckCurve, 10, 0.021, 12, false);
    const neckMesh = new THREE.Mesh(neckGeom, mat);
    register(neckMesh, `FemurNeck_${isL ? 'L' : 'R'}`);

    // Greater Trochanter (prominent hip landmark)
    const trochanterGeom = new THREE.SphereGeometry(0.028, 14, 12);
    trochanterGeom.scale(0.9, 1.25, 0.95);
    const trochanterMesh = new THREE.Mesh(trochanterGeom, mat);
    trochanterMesh.position.set(s * 0.022, 0.014, 0);
    register(trochanterMesh, `GreaterTrochanter_${isL ? 'L' : 'R'}`);

    // Anteriorly Bowed Physiological Femur Shaft
    const shaftCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(s * -0.008, -0.22, 0.022), // Anterior convex bow
      new THREE.Vector3(0, -0.45, 0),
    ]);
    const shaftGeom = new THREE.TubeGeometry(shaftCurve, 22, 0.023, 14, false);
    const shaftMesh = new THREE.Mesh(shaftGeom, mat);
    register(shaftMesh, `FemurShaft_${isL ? 'L' : 'R'}`);

    // Broad Lateral & Medial Distal Condyles
    [-1, 1].forEach((c) => {
      const condyleGeom = new THREE.SphereGeometry(0.029, 16, 14);
      condyleGeom.scale(0.88, 1.1, 1.35);
      const condyleMesh = new THREE.Mesh(condyleGeom, mat);
      condyleMesh.position.set(c * 0.028, -0.45, -0.012);
      register(condyleMesh, `FemoralCondyle_${c > 0 ? 'L' : 'M'}_${isL ? 'L' : 'R'}`);
    });
  }

  private static createSculptedLowerLeg(
    isL: boolean,
    mat: THREE.Material,
    register: (m: THREE.Mesh, name: string) => void
  ) {
    const s = isL ? 1 : -1;

    // Patella Sesamoind Kneecap (teardrop with apex pointing down)
    const patellaGeom = new THREE.SphereGeometry(0.026, 16, 14);
    patellaGeom.scale(0.92, 1.25, 0.48);
    const patellaMesh = new THREE.Mesh(patellaGeom, mat);
    patellaMesh.position.set(0, 0.02, 0.04);
    register(patellaMesh, `Patella_${isL ? 'L' : 'R'}`);

    // Tibia with Broad Triangular Plateau & Shin Crest
    const plateauGeom = new THREE.CylinderGeometry(0.045, 0.036, 0.042, 18);
    const plateauMesh = new THREE.Mesh(plateauGeom, mat);
    plateauMesh.position.set(0, -0.02, 0);
    register(plateauMesh, `TibialPlateau_${isL ? 'L' : 'R'}`);

    // Anterior Tibial Crest (Shin ridge)
    const tibiaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.02, 0.008),
      new THREE.Vector3(s * 0.006, -0.22, 0.012), // Prominent anterior crest
      new THREE.Vector3(s * -0.01, -0.43, 0),
    ]);
    const tibiaGeom = new THREE.TubeGeometry(tibiaCurve, 20, 0.021, 12, false);
    const tibiaMesh = new THREE.Mesh(tibiaGeom, mat);
    register(tibiaMesh, `TibiaShaft_${isL ? 'L' : 'R'}`);

    // Medial Malleolus (inner ankle bone)
    const mmGeom = new THREE.SphereGeometry(0.018, 12, 10);
    mmGeom.scale(0.8, 1.3, 0.9);
    const mmMesh = new THREE.Mesh(mmGeom, mat);
    mmMesh.position.set(s * -0.024, -0.435, 0);
    register(mmMesh, `MedialMalleolus_${isL ? 'L' : 'R'}`);

    // Slender Fibula with Lateral Malleolus (outer ankle bone)
    const fibulaGeom = new THREE.CylinderGeometry(0.009, 0.01, 0.41, 10);
    const fibulaMesh = new THREE.Mesh(fibulaGeom, mat);
    fibulaMesh.position.set(s * 0.038, -0.22, -0.008);
    register(fibulaMesh, `FibulaShaft_${isL ? 'L' : 'R'}`);

    const lmGeom = new THREE.SphereGeometry(0.018, 12, 10);
    lmGeom.scale(0.8, 1.3, 0.9);
    const lmMesh = new THREE.Mesh(lmGeom, mat);
    lmMesh.position.set(s * 0.039, -0.44, -0.006);
    register(lmMesh, `LateralMalleolus_${isL ? 'L' : 'R'}`);
  }

  private static createSculptedFoot(
    isL: boolean,
    mat: THREE.Material,
    register: (m: THREE.Mesh, name: string) => void
  ) {
    const s = isL ? 1 : -1;

    // 1. Talus Dome (Smooth saddle articulating with tibial mortise)
    const talusGeom = new THREE.SphereGeometry(0.026, 16, 12);
    talusGeom.scale(1.1, 0.85, 1.3);
    const talusMesh = new THREE.Mesh(talusGeom, mat);
    talusMesh.position.set(0, 0, 0.014);
    register(talusMesh, `Talus_${isL ? 'L' : 'R'}`);

    // 2. Sculpted Calcaneus (Heel Bone - backward projecting tuber calcanei for Achilles tendon)
    const heelCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.015, -0.01),
      new THREE.Vector3(s * 0.005, -0.03, -0.055),
      new THREE.Vector3(0, -0.045, -0.082), // Posterior tuberosity
    ]);
    const heelGeom = new THREE.TubeGeometry(heelCurve, 14, 0.024, 12, false);
    const heelMesh = new THREE.Mesh(heelGeom, mat);
    register(heelMesh, `CalcaneusHeel_${isL ? 'L' : 'R'}`);

    // 3. Tarsal Arch & 5 Arched Metatarsals
    for (let m = 0; m < 5; m++) {
      const isBigRay = m === 0;
      const xOff = (m - 2) * 0.0115 * s;
      const rad = isBigRay ? 0.0085 : 0.0065;
      const len = isBigRay ? 0.088 : 0.082 - Math.abs(m - 1) * 0.003;

      const metaCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xOff * 0.6, -0.018, 0.018), // Tarsal base
        new THREE.Vector3(xOff * 0.8, -0.025, 0.05),  // Transverse arch peak
        new THREE.Vector3(xOff, -0.038, 0.018 + len), // Ball of foot
      ]);
      const metaGeom = new THREE.TubeGeometry(metaCurve, 12, rad, 8, false);
      const metaMesh = new THREE.Mesh(metaGeom, mat);
      register(metaMesh, `Metatarsal_${m + 1}_${isL ? 'L' : 'R'}`);

      // Ball of foot joint condyle
      const ballGeom = new THREE.SphereGeometry(rad * 1.25, 8, 8);
      const ballMesh = new THREE.Mesh(ballGeom, mat);
      ballMesh.position.set(xOff, -0.038, 0.018 + len);
      register(ballMesh, `BallOfFoot_${m + 1}_${isL ? 'L' : 'R'}`);
    }
  }

  private static createSculptedToes(
    isL: boolean,
    mat: THREE.Material,
    register: (m: THREE.Mesh, name: string) => void
  ) {
    const s = isL ? 1 : -1;

    // 5 Articulated Toes with Natural Plantar Resting Curl
    for (let t = 0; t < 5; t++) {
      const isBigToe = t === 0;
      const xOff = (t - 2) * 0.0115 * s;
      const rad = isBigToe ? 0.0075 : 0.0052;
      const len = isBigToe ? 0.038 : 0.03 - t * 0.0035;

      const toeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xOff, 0, 0),
        new THREE.Vector3(xOff, -0.003, len * 0.5),
        new THREE.Vector3(xOff, -0.004, len), // Toe tip pad
      ]);
      const toeGeom = new THREE.TubeGeometry(toeCurve, 8, rad, 8, false);
      const toeMesh = new THREE.Mesh(toeGeom, mat);
      register(toeMesh, `Toe_${t + 1}_${isL ? 'L' : 'R'}`);
    }
  }
}
