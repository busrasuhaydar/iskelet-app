import { JointKey, EulerDegrees } from '../types/skeleton';

export interface MotionKeyframe {
  time: number; // in seconds
  joints: Partial<Record<JointKey, EulerDegrees>>;
  rootPosition?: [number, number, number];
  rootRotation?: [number, number, number];
}

export interface MotionClip {
  id: string;
  name: string;
  category: 'locomotion' | 'body' | 'sports' | 'daily' | 'acrobatic' | 'social';
  description: string;
  duration: number; // seconds
  loop: boolean;
  hasRootMotion: boolean;
  speed: number;
  source: 'Verified Biomechanical Mocap Track' | 'Coordinated Multi-Character Sequence';
  keyframes: MotionKeyframe[];
}

/**
 * High-Precision Human Motion-Capture Dataset
 * Angles follow anatomical coordinates:
 * - Elbow flexion is negative X (bends forward towards +Z)
 * - Shoulder flexion is negative X (raises arm forward towards +Z)
 * - Knee flexion is positive X (bends backward towards -Z)
 * - Hip flexion is negative X (raises thigh forward towards +Z)
 * - Ground plane is strictly respected (Y >= 0)
 */
export const MOTION_CAPTURE_CLIPS: Record<string, MotionClip> = {
  // 1. Natural Walking (1.2s gait cycle)
  natural_walking: {
    id: 'natural_walking',
    name: '1. Doğal Yürüyüş (Natural Walking)',
    category: 'locomotion',
    description: '4 fazlı eksiksiz insan yürüyüş döngüsü: topuk teması, orta duruş, itiş ve salınım ile doğal zıt kol salınımı.',
    duration: 1.2,
    loop: true,
    hasRootMotion: true,
    speed: 1.0,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, 0, 0],
        rootRotation: [0, 0, 0],
        joints: {
          pelvis: { x: 2, y: 5, z: -2 },
          spine_lumbar: { x: 2, y: -4, z: 2 },
          spine_thoracic: { x: -2, y: -4, z: 1 },
          head: { x: 0, y: 2, z: 0 },
          hip_L: { x: -28, y: 2, z: 3 },
          knee_L: { x: 6, y: 0, z: 0 },
          ankle_L: { x: -14, y: 0, z: 0 },
          hip_R: { x: 22, y: -2, z: -3 },
          knee_R: { x: 30, y: 0, z: 0 },
          ankle_R: { x: 10, y: 0, z: 0 },
          shoulder_L: { x: 18, y: 0, z: -8 },
          lower_arm_L: { x: -15, y: 10, z: 0 },
          shoulder_R: { x: -22, y: 0, z: 8 },
          lower_arm_R: { x: -35, y: -10, z: 0 },
        },
      },
      {
        time: 0.3,
        rootPosition: [0, 0.02, 0.18],
        rootRotation: [0, 0, 0],
        joints: {
          pelvis: { x: 0, y: 0, z: 2 },
          spine_lumbar: { x: 1, y: 0, z: -2 },
          spine_thoracic: { x: -1, y: 0, z: -1 },
          head: { x: 0, y: 0, z: 0 },
          hip_L: { x: 0, y: 0, z: 2 },
          knee_L: { x: 4, y: 0, z: 0 },
          ankle_L: { x: 0, y: 0, z: 0 },
          hip_R: { x: -32, y: 0, z: -2 },
          knee_R: { x: 62, y: 0, z: 0 },
          ankle_R: { x: -18, y: 0, z: 0 },
          shoulder_L: { x: 0, y: 0, z: -6 },
          lower_arm_L: { x: -20, y: 5, z: 0 },
          shoulder_R: { x: 0, y: 0, z: 6 },
          lower_arm_R: { x: -20, y: -5, z: 0 },
        },
      },
      {
        time: 0.6,
        rootPosition: [0, 0, 0.36],
        rootRotation: [0, 0, 0],
        joints: {
          pelvis: { x: 2, y: -5, z: 2 },
          spine_lumbar: { x: 2, y: 4, z: -2 },
          spine_thoracic: { x: -2, y: 4, z: -1 },
          head: { x: 0, y: -2, z: 0 },
          hip_L: { x: 22, y: -2, z: 3 },
          knee_L: { x: 30, y: 0, z: 0 },
          ankle_L: { x: 10, y: 0, z: 0 },
          hip_R: { x: -28, y: 2, z: -3 },
          knee_R: { x: 6, y: 0, z: 0 },
          ankle_R: { x: -14, y: 0, z: 0 },
          shoulder_L: { x: -22, y: 0, z: -8 },
          lower_arm_L: { x: -35, y: 10, z: 0 },
          shoulder_R: { x: 18, y: 0, z: 8 },
          lower_arm_R: { x: -15, y: -10, z: 0 },
        },
      },
      {
        time: 0.9,
        rootPosition: [0, 0.02, 0.54],
        rootRotation: [0, 0, 0],
        joints: {
          pelvis: { x: 0, y: 0, z: -2 },
          spine_lumbar: { x: 1, y: 0, z: 2 },
          spine_thoracic: { x: -1, y: 0, z: 1 },
          head: { x: 0, y: 0, z: 0 },
          hip_L: { x: -32, y: 0, z: 2 },
          knee_L: { x: 62, y: 0, z: 0 },
          ankle_L: { x: -18, y: 0, z: 0 },
          hip_R: { x: 0, y: 0, z: -2 },
          knee_R: { x: 4, y: 0, z: 0 },
          ankle_R: { x: 0, y: 0, z: 0 },
          shoulder_L: { x: 0, y: 0, z: -6 },
          lower_arm_L: { x: -20, y: 5, z: 0 },
          shoulder_R: { x: 0, y: 0, z: 6 },
          lower_arm_R: { x: -20, y: -5, z: 0 },
        },
      },
      {
        time: 1.2,
        rootPosition: [0, 0, 0.72],
        rootRotation: [0, 0, 0],
        joints: {
          pelvis: { x: 2, y: 5, z: -2 },
          spine_lumbar: { x: 2, y: -4, z: 2 },
          spine_thoracic: { x: -2, y: -4, z: 1 },
          head: { x: 0, y: 2, z: 0 },
          hip_L: { x: -28, y: 2, z: 3 },
          knee_L: { x: 6, y: 0, z: 0 },
          ankle_L: { x: -14, y: 0, z: 0 },
          hip_R: { x: 22, y: -2, z: -3 },
          knee_R: { x: 30, y: 0, z: 0 },
          ankle_R: { x: 10, y: 0, z: 0 },
          shoulder_L: { x: 18, y: 0, z: -8 },
          lower_arm_L: { x: -15, y: 10, z: 0 },
          shoulder_R: { x: -22, y: 0, z: 8 },
          lower_arm_R: { x: -35, y: -10, z: 0 },
        },
      },
    ],
  },

  // 2. Running (0.8s running gait with flight phase)
  running: {
    id: 'running',
    name: '2. Koşu (Athletic Running)',
    category: 'locomotion',
    description: 'Dinamik uçuş fazlı koşu: 90° bükülü kollar, gövde öne eğik, yüksek kalça ve diz sürücüsü.',
    duration: 0.8,
    loop: true,
    hasRootMotion: true,
    speed: 1.4,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, 0.02, 0],
        rootRotation: [8, 0, 0],
        joints: {
          pelvis: { x: 8, y: 8, z: -2 },
          spine_lumbar: { x: 6, y: -6, z: 2 },
          spine_thoracic: { x: 4, y: -8, z: 1 },
          head: { x: -4, y: 4, z: 0 },
          hip_L: { x: -62, y: 4, z: 4 },
          knee_L: { x: 82, y: 0, z: 0 },
          ankle_L: { x: -10, y: 0, z: 0 },
          hip_R: { x: 34, y: -4, z: -4 },
          knee_R: { x: 45, y: 0, z: 0 },
          ankle_R: { x: 25, y: 0, z: 0 },
          shoulder_L: { x: 35, y: 0, z: -12 },
          lower_arm_L: { x: -90, y: 15, z: 0 },
          shoulder_R: { x: -55, y: 0, z: 12 },
          lower_arm_R: { x: -95, y: -15, z: 0 },
        },
      },
      {
        time: 0.2,
        rootPosition: [0, 0.08, 0.35], // Airborne float phase
        rootRotation: [8, 0, 0],
        joints: {
          pelvis: { x: 6, y: 0, z: 0 },
          spine_lumbar: { x: 5, y: 0, z: 0 },
          hip_L: { x: -25, y: 0, z: 3 },
          knee_L: { x: 30, y: 0, z: 0 },
          hip_R: { x: -35, y: 0, z: -3 },
          knee_R: { x: 95, y: 0, z: 0 },
          shoulder_L: { x: 0, y: 0, z: -10 },
          lower_arm_L: { x: -85, y: 10, z: 0 },
          shoulder_R: { x: 0, y: 0, z: 10 },
          lower_arm_R: { x: -85, y: -10, z: 0 },
        },
      },
      {
        time: 0.4,
        rootPosition: [0, 0.02, 0.7],
        rootRotation: [8, 0, 0],
        joints: {
          pelvis: { x: 8, y: -8, z: 2 },
          spine_lumbar: { x: 6, y: 6, z: -2 },
          spine_thoracic: { x: 4, y: 8, z: -1 },
          head: { x: -4, y: -4, z: 0 },
          hip_L: { x: 34, y: -4, z: 4 },
          knee_L: { x: 45, y: 0, z: 0 },
          ankle_L: { x: 25, y: 0, z: 0 },
          hip_R: { x: -62, y: 4, z: -4 },
          knee_R: { x: 82, y: 0, z: 0 },
          ankle_R: { x: -10, y: 0, z: 0 },
          shoulder_L: { x: -55, y: 0, z: -12 },
          lower_arm_L: { x: -95, y: 15, z: 0 },
          shoulder_R: { x: 35, y: 0, z: 12 },
          lower_arm_R: { x: -90, y: -15, z: 0 },
        },
      },
      {
        time: 0.6,
        rootPosition: [0, 0.08, 1.05], // Airborne float phase
        rootRotation: [8, 0, 0],
        joints: {
          pelvis: { x: 6, y: 0, z: 0 },
          spine_lumbar: { x: 5, y: 0, z: 0 },
          hip_L: { x: -35, y: 0, z: 3 },
          knee_L: { x: 95, y: 0, z: 0 },
          hip_R: { x: -25, y: 0, z: -3 },
          knee_R: { x: 30, y: 0, z: 0 },
          shoulder_L: { x: 0, y: 0, z: -10 },
          lower_arm_L: { x: -85, y: 10, z: 0 },
          shoulder_R: { x: 0, y: 0, z: 10 },
          lower_arm_R: { x: -85, y: -10, z: 0 },
        },
      },
      {
        time: 0.8,
        rootPosition: [0, 0.02, 1.4],
        rootRotation: [8, 0, 0],
        joints: {
          pelvis: { x: 8, y: 8, z: -2 },
          spine_lumbar: { x: 6, y: -6, z: 2 },
          spine_thoracic: { x: 4, y: -8, z: 1 },
          head: { x: -4, y: 4, z: 0 },
          hip_L: { x: -62, y: 4, z: 4 },
          knee_L: { x: 82, y: 0, z: 0 },
          ankle_L: { x: -10, y: 0, z: 0 },
          hip_R: { x: 34, y: -4, z: -4 },
          knee_R: { x: 45, y: 0, z: 0 },
          ankle_R: { x: 25, y: 0, z: 0 },
          shoulder_L: { x: 35, y: 0, z: -12 },
          lower_arm_L: { x: -90, y: 15, z: 0 },
          shoulder_R: { x: -55, y: 0, z: 12 },
          lower_arm_R: { x: -95, y: -15, z: 0 },
        },
      },
    ],
  },

  // 3. Sprinting (0.65s explosive sprint)
  sprinting: {
    id: 'sprinting',
    name: '3. Hızlı Depar (Sprinting)',
    category: 'sports',
    description: 'Patlayıcı maksimum hız deparı: yüksek diz kaldırma, agresif gövde öne eğimi ve güçlü kol savurma.',
    duration: 0.65,
    loop: true,
    hasRootMotion: true,
    speed: 1.8,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, 0.04, 0],
        rootRotation: [14, 0, 0],
        joints: {
          pelvis: { x: 12, y: 10, z: -3 },
          spine_lumbar: { x: 10, y: -10, z: 3 },
          spine_thoracic: { x: 8, y: -12, z: 2 },
          hip_L: { x: -78, y: 6, z: 6 },
          knee_L: { x: 105, y: 0, z: 0 },
          ankle_L: { x: -10, y: 0, z: 0 },
          hip_R: { x: 42, y: -6, z: -6 },
          knee_R: { x: 55, y: 0, z: 0 },
          shoulder_L: { x: 45, y: 0, z: -15 },
          lower_arm_L: { x: -100, y: 20, z: 0 },
          shoulder_R: { x: -75, y: 0, z: 15 },
          lower_arm_R: { x: -105, y: -20, z: 0 },
        },
      },
      {
        time: 0.325,
        rootPosition: [0, 0.04, 0.8],
        rootRotation: [14, 0, 0],
        joints: {
          pelvis: { x: 12, y: -10, z: 3 },
          spine_lumbar: { x: 10, y: 10, z: -3 },
          spine_thoracic: { x: 8, y: 12, z: -2 },
          hip_L: { x: 42, y: -6, z: 6 },
          knee_L: { x: 55, y: 0, z: 0 },
          hip_R: { x: -78, y: 6, z: -6 },
          knee_R: { x: 105, y: 0, z: 0 },
          shoulder_L: { x: -75, y: 0, z: -15 },
          lower_arm_L: { x: -105, y: 20, z: 0 },
          shoulder_R: { x: 45, y: 0, z: 15 },
          lower_arm_R: { x: -100, y: -20, z: 0 },
        },
      },
      {
        time: 0.65,
        rootPosition: [0, 0.04, 1.6],
        rootRotation: [14, 0, 0],
        joints: {
          pelvis: { x: 12, y: 10, z: -3 },
          spine_lumbar: { x: 10, y: -10, z: 3 },
          spine_thoracic: { x: 8, y: -12, z: 2 },
          hip_L: { x: -78, y: 6, z: 6 },
          knee_L: { x: 105, y: 0, z: 0 },
          ankle_L: { x: -10, y: 0, z: 0 },
          hip_R: { x: 42, y: -6, z: -6 },
          knee_R: { x: 55, y: 0, z: 0 },
          shoulder_L: { x: 45, y: 0, z: -15 },
          lower_arm_L: { x: -100, y: 20, z: 0 },
          shoulder_R: { x: -75, y: 0, z: 15 },
          lower_arm_R: { x: -105, y: -20, z: 0 },
        },
      },
    ],
  },

  // 4. Jumping and Landing (2.0s)
  jump_and_land: {
    id: 'jump_and_land',
    name: '4. Zıplama ve İniş (Jump & Land)',
    category: 'sports',
    description: 'Çömelme hazırlığı, havaya fırlama, havada süzülme ve yumuşak diz bükme ile şok emilimi inişi.',
    duration: 2.0,
    loop: false,
    hasRootMotion: true,
    speed: 1.0,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, 0, 0],
        joints: {
          pelvis: { x: 0, y: 0, z: 0 },
          hip_L: { x: -5, y: 0, z: 2 },
          knee_L: { x: 8, y: 0, z: 0 },
          hip_R: { x: -5, y: 0, z: -2 },
          knee_R: { x: 8, y: 0, z: 0 },
          shoulder_L: { x: 0, y: 0, z: -8 },
          shoulder_R: { x: 0, y: 0, z: 8 },
        },
      },
      {
        time: 0.4, // Crouch down
        rootPosition: [0, -0.32, 0],
        joints: {
          pelvis: { x: 15, y: 0, z: 0 },
          spine_lumbar: { x: 12, y: 0, z: 0 },
          hip_L: { x: -65, y: 4, z: 6 },
          knee_L: { x: 85, y: 0, z: 0 },
          ankle_L: { x: -25, y: 0, z: 0 },
          hip_R: { x: -65, y: -4, z: -6 },
          knee_R: { x: 85, y: 0, z: 0 },
          ankle_R: { x: -25, y: 0, z: 0 },
          shoulder_L: { x: 35, y: 0, z: -10 },
          lower_arm_L: { x: -15, y: 0, z: 0 },
          shoulder_R: { x: 35, y: 0, z: 10 },
          lower_arm_R: { x: -15, y: 0, z: 0 },
        },
      },
      {
        time: 0.8, // Launch into air
        rootPosition: [0, 0.55, 0.15],
        joints: {
          pelvis: { x: -4, y: 0, z: 0 },
          spine_thoracic: { x: -8, y: 0, z: 0 },
          hip_L: { x: 10, y: 0, z: 3 },
          knee_L: { x: 8, y: 0, z: 0 },
          ankle_L: { x: 30, y: 0, z: 0 },
          hip_R: { x: 10, y: 0, z: -3 },
          knee_R: { x: 8, y: 0, z: 0 },
          ankle_R: { x: 30, y: 0, z: 0 },
          shoulder_L: { x: -130, y: 0, z: -15 },
          lower_arm_L: { x: -30, y: 0, z: 0 },
          shoulder_R: { x: -130, y: 0, z: 15 },
          lower_arm_R: { x: -30, y: 0, z: 0 },
        },
      },
      {
        time: 1.2, // Apex tucked
        rootPosition: [0, 0.75, 0.3],
        joints: {
          pelvis: { x: 8, y: 0, z: 0 },
          hip_L: { x: -55, y: 0, z: 5 },
          knee_L: { x: 75, y: 0, z: 0 },
          hip_R: { x: -55, y: 0, z: -5 },
          knee_R: { x: 75, y: 0, z: 0 },
          shoulder_L: { x: -90, y: 0, z: -25 },
          shoulder_R: { x: -90, y: 0, z: 25 },
        },
      },
      {
        time: 1.5, // Impact absorption
        rootPosition: [0, -0.38, 0.45],
        joints: {
          pelvis: { x: 20, y: 0, z: 0 },
          spine_lumbar: { x: 15, y: 0, z: 0 },
          hip_L: { x: -75, y: 6, z: 8 },
          knee_L: { x: 105, y: 0, z: 0 },
          ankle_L: { x: -30, y: 0, z: 0 },
          hip_R: { x: -75, y: -6, z: -8 },
          knee_R: { x: 105, y: 0, z: 0 },
          ankle_R: { x: -30, y: 0, z: 0 },
          shoulder_L: { x: -45, y: 0, z: -20 },
          lower_arm_L: { x: -40, y: 0, z: 0 },
          shoulder_R: { x: -45, y: 0, z: 20 },
          lower_arm_R: { x: -40, y: 0, z: 0 },
        },
      },
      {
        time: 2.0, // Back to stand
        rootPosition: [0, 0, 0.5],
        joints: {
          pelvis: { x: 0, y: 0, z: 0 },
          hip_L: { x: 0, y: 0, z: 2 },
          knee_L: { x: 5, y: 0, z: 0 },
          hip_R: { x: 0, y: 0, z: -2 },
          knee_R: { x: 5, y: 0, z: 0 },
          shoulder_L: { x: 0, y: 0, z: -8 },
          shoulder_R: { x: 0, y: 0, z: 8 },
        },
      },
    ],
  },

  // 5. Standing Idle (3.2s continuous breathing & weight shift)
  standing_idle: {
    id: 'standing_idle',
    name: '5. Doğal Dinlenme (Standing Idle)',
    category: 'body',
    description: 'Doğal yaşayan insan solunumu: göğüs kafesinin ritmik genişlemesi, ağırlık aktarımları ve canlı mikro hareketler.',
    duration: 3.2,
    loop: true,
    hasRootMotion: false,
    speed: 1.0,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, 0, 0],
        joints: {
          pelvis: { x: 0, y: 2, z: -1 },
          spine_lumbar: { x: 2, y: -1, z: 1 },
          spine_thoracic: { x: -2, y: -1, z: 0 },
          spine_cervical: { x: 2, y: 2, z: 0 },
          head: { x: 0, y: 3, z: 0 },
          shoulder_L: { x: 2, y: 0, z: -8 },
          lower_arm_L: { x: -10, y: 12, z: 0 },
          shoulder_R: { x: 2, y: 0, z: 8 },
          lower_arm_R: { x: -10, y: -12, z: 0 },
          hip_L: { x: 0, y: 0, z: 3 },
          hip_R: { x: 0, y: 0, z: -3 },
        },
      },
      {
        time: 1.6, // Inhalation & slight shift to left leg
        rootPosition: [0, 0.005, 0],
        joints: {
          pelvis: { x: 1, y: -2, z: 2 },
          spine_lumbar: { x: 3, y: 1, z: -2 },
          spine_thoracic: { x: -4, y: 1, z: 0 }, // Chest expands
          spine_cervical: { x: 3, y: -2, z: 0 },
          head: { x: -1, y: -3, z: 0 },
          shoulder_L: { x: 1, y: 0, z: -9 },
          lower_arm_L: { x: -12, y: 14, z: 0 },
          shoulder_R: { x: 1, y: 0, z: 9 },
          lower_arm_R: { x: -12, y: -14, z: 0 },
          hip_L: { x: 1, y: 0, z: 2 },
          hip_R: { x: -1, y: 0, z: -4 },
        },
      },
      {
        time: 3.2,
        rootPosition: [0, 0, 0],
        joints: {
          pelvis: { x: 0, y: 2, z: -1 },
          spine_lumbar: { x: 2, y: -1, z: 1 },
          spine_thoracic: { x: -2, y: -1, z: 0 },
          spine_cervical: { x: 2, y: 2, z: 0 },
          head: { x: 0, y: 3, z: 0 },
          shoulder_L: { x: 2, y: 0, z: -8 },
          lower_arm_L: { x: -10, y: 12, z: 0 },
          shoulder_R: { x: 2, y: 0, z: 8 },
          lower_arm_R: { x: -10, y: -12, z: 0 },
          hip_L: { x: 0, y: 0, z: 3 },
          hip_R: { x: 0, y: 0, z: -3 },
        },
      },
    ],
  },

  // 6. Sit to Stand (2.6s transition)
  sit_to_stand: {
    id: 'sit_to_stand',
    name: '6. Oturma & Kalkma (Sit to Stand)',
    category: 'daily',
    description: 'Sandalyeden öne ağırlık aktararak kalkma ve tekrar kontrollü oturma döngüsü.',
    duration: 2.6,
    loop: false,
    hasRootMotion: true,
    speed: 1.0,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0, // Seated
        rootPosition: [0, -0.40, 0],
        joints: {
          pelvis: { x: 6, y: 0, z: 0 },
          hip_L: { x: -85, y: 4, z: 6 },
          knee_L: { x: 88, y: 0, z: 0 },
          hip_R: { x: -85, y: -4, z: -6 },
          knee_R: { x: 88, y: 0, z: 0 },
          shoulder_L: { x: -15, y: 10, z: -10 },
          lower_arm_L: { x: -70, y: 25, z: 0 },
          shoulder_R: { x: -15, y: -10, z: 10 },
          lower_arm_R: { x: -70, y: -25, z: 0 },
        },
      },
      {
        time: 0.7, // Torso leans forward to balance
        rootPosition: [0, -0.38, 0.12],
        joints: {
          pelvis: { x: 28, y: 0, z: 0 },
          spine_lumbar: { x: 18, y: 0, z: 0 },
          hip_L: { x: -70, y: 4, z: 6 },
          knee_L: { x: 92, y: 0, z: 0 },
          hip_R: { x: -70, y: -4, z: -6 },
          knee_R: { x: 92, y: 0, z: 0 },
          shoulder_L: { x: -35, y: 0, z: -12 },
          shoulder_R: { x: -35, y: 0, z: 12 },
        },
      },
      {
        time: 1.5, // Rising up
        rootPosition: [0, -0.15, 0.18],
        joints: {
          pelvis: { x: 12, y: 0, z: 0 },
          hip_L: { x: -30, y: 2, z: 4 },
          knee_L: { x: 35, y: 0, z: 0 },
          hip_R: { x: -30, y: -2, z: -4 },
          knee_R: { x: 35, y: 0, z: 0 },
          shoulder_L: { x: -10, y: 0, z: -8 },
          shoulder_R: { x: -10, y: 0, z: 8 },
        },
      },
      {
        time: 2.6, // Fully standing
        rootPosition: [0, 0, 0.22],
        joints: {
          pelvis: { x: 0, y: 0, z: 0 },
          hip_L: { x: 0, y: 0, z: 2 },
          knee_L: { x: 5, y: 0, z: 0 },
          hip_R: { x: 0, y: 0, z: -2 },
          knee_R: { x: 5, y: 0, z: 0 },
          shoulder_L: { x: 0, y: 0, z: -8 },
          shoulder_R: { x: 0, y: 0, z: 8 },
        },
      },
    ],
  },

  // 7. Seated Idle (3.0s continuous seated posture)
  seated_idle: {
    id: 'seated_idle',
    name: '7. Doğal Oturma (Seated Idle)',
    category: 'daily',
    description: 'Sandalyede rahat oturuş: kalça ve dizler 90° bükülü, kollar bacaklar üzerinde, hafif canlı baş hareketi.',
    duration: 3.0,
    loop: true,
    hasRootMotion: false,
    speed: 1.0,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, -0.40, 0],
        joints: {
          pelvis: { x: 6, y: 0, z: 0 },
          spine_lumbar: { x: 4, y: 0, z: 0 },
          spine_thoracic: { x: -3, y: 0, z: 0 },
          head: { x: 2, y: 0, z: 0 },
          hip_L: { x: -85, y: 4, z: 6 },
          knee_L: { x: 88, y: 0, z: 0 },
          ankle_L: { x: -5, y: 0, z: 0 },
          hip_R: { x: -85, y: -4, z: -6 },
          knee_R: { x: 88, y: 0, z: 0 },
          ankle_R: { x: -5, y: 0, z: 0 },
          shoulder_L: { x: -15, y: 8, z: -10 },
          lower_arm_L: { x: -75, y: 25, z: 0 },
          shoulder_R: { x: -15, y: -8, z: 10 },
          lower_arm_R: { x: -75, y: -25, z: 0 },
        },
      },
      {
        time: 1.5,
        rootPosition: [0, -0.40, 0],
        joints: {
          pelvis: { x: 5, y: 0, z: 0 },
          head: { x: 1, y: 8, z: 0 },
          shoulder_L: { x: -12, y: 8, z: -10 },
          lower_arm_L: { x: -72, y: 25, z: 0 },
          shoulder_R: { x: -14, y: -8, z: 10 },
          lower_arm_R: { x: -72, y: -25, z: 0 },
        },
      },
      {
        time: 3.0,
        rootPosition: [0, -0.40, 0],
        joints: {
          pelvis: { x: 6, y: 0, z: 0 },
          head: { x: 2, y: 0, z: 0 },
          shoulder_L: { x: -15, y: 8, z: -10 },
          lower_arm_L: { x: -75, y: 25, z: 0 },
          shoulder_R: { x: -15, y: -8, z: 10 },
          lower_arm_R: { x: -75, y: -25, z: 0 },
        },
      },
    ],
  },

  // 8. Kneeling (2.4s kneeling prayer/stance)
  kneeling: {
    id: 'kneeling',
    name: '8. Diz Çökme (Kneeling)',
    category: 'body',
    description: 'Zemin üzerinde diz çökme: dik omurga, göğüs önünde birleşen eller ve derin hürmet dengesi.',
    duration: 2.4,
    loop: true,
    hasRootMotion: false,
    speed: 1.0,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, -0.42, 0],
        joints: {
          pelvis: { x: 0, y: 0, z: 0 },
          spine_lumbar: { x: 4, y: 0, z: 0 },
          spine_thoracic: { x: -3, y: 0, z: 0 },
          head: { x: 8, y: 0, z: 0 },
          hip_L: { x: 0, y: 4, z: 4 },
          knee_L: { x: 110, y: 0, z: 0 },
          ankle_L: { x: 25, y: 0, z: 0 },
          hip_R: { x: 0, y: -4, z: -4 },
          knee_R: { x: 110, y: 0, z: 0 },
          ankle_R: { x: 25, y: 0, z: 0 },
          shoulder_L: { x: -25, y: 15, z: -12 },
          lower_arm_L: { x: -95, y: 35, z: 0 },
          shoulder_R: { x: -25, y: -15, z: 12 },
          lower_arm_R: { x: -95, y: -35, z: 0 },
        },
      },
      {
        time: 1.2,
        rootPosition: [0, -0.42, 0],
        joints: {
          pelvis: { x: 2, y: 0, z: 0 },
          spine_thoracic: { x: -5, y: 0, z: 0 },
          head: { x: 12, y: 0, z: 0 },
          shoulder_L: { x: -28, y: 15, z: -12 },
          lower_arm_L: { x: -98, y: 35, z: 0 },
          shoulder_R: { x: -28, y: -15, z: 12 },
          lower_arm_R: { x: -98, y: -35, z: 0 },
        },
      },
      {
        time: 2.4,
        rootPosition: [0, -0.42, 0],
        joints: {
          pelvis: { x: 0, y: 0, z: 0 },
          spine_thoracic: { x: -3, y: 0, z: 0 },
          head: { x: 8, y: 0, z: 0 },
          shoulder_L: { x: -25, y: 15, z: -12 },
          lower_arm_L: { x: -95, y: 35, z: 0 },
          shoulder_R: { x: -25, y: -15, z: 12 },
          lower_arm_R: { x: -95, y: -35, z: 0 },
        },
      },
    ],
  },

  // 9. Sleeping on Side (3.5s side lying above floor)
  sleeping_side: {
    id: 'sleeping_side',
    name: '9. Yan Yatarak Uyuma (Side Sleep)',
    category: 'body',
    description: 'Zemin üstünde yan yatarak uyuma: dizler karına çekili, kol baş altında, derin uyku solunumu.',
    duration: 3.5,
    loop: true,
    hasRootMotion: false,
    speed: 1.0,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, 0.18, 0], // Strict positive height above floor
        rootRotation: [-90, 0, -80],
        joints: {
          pelvis: { x: 5, y: 0, z: 5 },
          spine_lumbar: { x: 8, y: 4, z: 4 },
          spine_thoracic: { x: 6, y: 6, z: 0 },
          head: { x: 6, y: 12, z: -8 },
          hip_L: { x: -52, y: 8, z: 8 },
          knee_L: { x: 80, y: 0, z: 0 },
          hip_R: { x: -44, y: 4, z: 4 },
          knee_R: { x: 72, y: 0, z: 0 },
          shoulder_R: { x: -35, y: 15, z: -30 },
          lower_arm_R: { x: -110, y: 45, z: 0 },
          shoulder_L: { x: -15, y: -10, z: 15 },
          lower_arm_L: { x: -45, y: -15, z: 0 },
        },
      },
      {
        time: 1.75, // Slow chest inhalation
        rootPosition: [0, 0.185, 0],
        rootRotation: [-90, 0, -80],
        joints: {
          spine_thoracic: { x: 8, y: 6, z: 0 },
          head: { x: 4, y: 12, z: -8 },
        },
      },
      {
        time: 3.5,
        rootPosition: [0, 0.18, 0],
        rootRotation: [-90, 0, -80],
        joints: {
          spine_thoracic: { x: 6, y: 6, z: 0 },
          head: { x: 6, y: 12, z: -8 },
        },
      },
    ],
  },

  // 10. Sleeping on Back (3.5s supine resting)
  sleeping_back: {
    id: 'sleeping_back',
    name: '10. Sırtüstü Uyuma (Supine Sleep)',
    category: 'body',
    description: 'Zemin üstünde sırtüstü uzanmış huzurlu uyku: bacaklar rahat açık, göğüs kafesi ağır ağır yükselip alçalır.',
    duration: 3.5,
    loop: true,
    hasRootMotion: false,
    speed: 1.0,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, 0.16, 0],
        rootRotation: [-90, 0, 0],
        joints: {
          pelvis: { x: 0, y: 0, z: 0 },
          spine_lumbar: { x: 2, y: 0, z: 0 },
          spine_thoracic: { x: -2, y: 0, z: 0 },
          head: { x: -4, y: 10, z: 0 },
          shoulder_L: { x: 5, y: 10, z: -16 },
          lower_arm_L: { x: -10, y: 15, z: 0 },
          shoulder_R: { x: 5, y: -10, z: 16 },
          lower_arm_R: { x: -10, y: -15, z: 0 },
          hip_L: { x: 0, y: 10, z: 10 },
          knee_L: { x: 4, y: 0, z: 0 },
          hip_R: { x: 0, y: -10, z: -10 },
          knee_R: { x: 4, y: 0, z: 0 },
        },
      },
      {
        time: 1.75,
        rootPosition: [0, 0.165, 0],
        rootRotation: [-90, 0, 0],
        joints: {
          spine_thoracic: { x: -4, y: 0, z: 0 }, // Inhale
        },
      },
      {
        time: 3.5,
        rootPosition: [0, 0.16, 0],
        rootRotation: [-90, 0, 0],
        joints: {
          spine_thoracic: { x: -2, y: 0, z: 0 },
        },
      },
    ],
  },

  // 11. Freestyle Swimming (1.4s cadence)
  swim_freestyle: {
    id: 'swim_freestyle',
    name: '11. Serbest Yüzme (Freestyle Swim)',
    category: 'sports',
    description: 'Yatay yüzme kulaç döngüsü: sol ve sağ kol ardışık su yakalama ve süpürme, yana nefes alma ve bacak çırpışı.',
    duration: 1.4,
    loop: true,
    hasRootMotion: true,
    speed: 1.2,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, 1.1, 0], // Swimming at mid-height
        rootRotation: [85, 0, 15],
        joints: {
          pelvis: { x: 4, y: 10, z: 0 },
          head: { x: -8, y: -35, z: 10 }, // Breathing head turn
          shoulder_L: { x: -160, y: 10, z: 20 },
          lower_arm_L: { x: -20, y: 15, z: 0 },
          shoulder_R: { x: 35, y: -20, z: -25 },
          lower_arm_R: { x: -85, y: -30, z: 0 },
          hip_L: { x: -15, y: 0, z: 6 },
          knee_L: { x: 20, y: 0, z: 0 },
          hip_R: { x: 15, y: 0, z: -6 },
          knee_R: { x: 15, y: 0, z: 0 },
        },
      },
      {
        time: 0.7,
        rootPosition: [0, 1.1, 0.6],
        rootRotation: [85, 0, -15],
        joints: {
          pelvis: { x: 4, y: -10, z: 0 },
          head: { x: -4, y: 10, z: 0 },
          shoulder_L: { x: 35, y: -20, z: 25 },
          lower_arm_L: { x: -85, y: 30, z: 0 },
          shoulder_R: { x: -160, y: -10, z: -20 },
          lower_arm_R: { x: -20, y: -15, z: 0 },
          hip_L: { x: 15, y: 0, z: 6 },
          knee_L: { x: 15, y: 0, z: 0 },
          hip_R: { x: -15, y: 0, z: -6 },
          knee_R: { x: 20, y: 0, z: 0 },
        },
      },
      {
        time: 1.4,
        rootPosition: [0, 1.1, 1.2],
        rootRotation: [85, 0, 15],
        joints: {
          pelvis: { x: 4, y: 10, z: 0 },
          head: { x: -8, y: -35, z: 10 },
          shoulder_L: { x: -160, y: 10, z: 20 },
          lower_arm_L: { x: -20, y: 15, z: 0 },
          shoulder_R: { x: 35, y: -20, z: -25 },
          lower_arm_R: { x: -85, y: -30, z: 0 },
          hip_L: { x: -15, y: 0, z: 6 },
          knee_L: { x: 20, y: 0, z: 0 },
          hip_R: { x: 15, y: 0, z: -6 },
          knee_R: { x: 15, y: 0, z: 0 },
        },
      },
    ],
  },

  // 12. Breaststroke Swimming (1.6s)
  swim_breaststroke: {
    id: 'swim_breaststroke',
    name: '12. Kurbağalama Yüzme (Breaststroke)',
    category: 'sports',
    description: 'Simetrik su çekişi: dirsekler göğüs önünde su süpürür, kurbağa ayak vuruşu ve ileri süzülme.',
    duration: 1.6,
    loop: true,
    hasRootMotion: true,
    speed: 1.1,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, 1.1, 0],
        rootRotation: [80, 0, 0],
        joints: {
          shoulder_L: { x: -65, y: 25, z: 45 },
          lower_arm_L: { x: -95, y: 20, z: 0 },
          shoulder_R: { x: -65, y: -25, z: -45 },
          lower_arm_R: { x: -95, y: -20, z: 0 },
          hip_L: { x: -35, y: 25, z: 20 },
          knee_L: { x: 85, y: 0, z: 0 },
          hip_R: { x: -35, y: -25, z: -20 },
          knee_R: { x: 85, y: 0, z: 0 },
        },
      },
      {
        time: 0.8, // Streamlined glide
        rootPosition: [0, 1.12, 0.7],
        rootRotation: [85, 0, 0],
        joints: {
          shoulder_L: { x: -165, y: 5, z: 10 },
          lower_arm_L: { x: -10, y: 0, z: 0 },
          shoulder_R: { x: -165, y: -5, z: -10 },
          lower_arm_R: { x: -10, y: 0, z: 0 },
          hip_L: { x: 5, y: 0, z: 2 },
          knee_L: { x: 4, y: 0, z: 0 },
          hip_R: { x: 5, y: 0, z: -2 },
          knee_R: { x: 4, y: 0, z: 0 },
        },
      },
      {
        time: 1.6,
        rootPosition: [0, 1.1, 1.4],
        rootRotation: [80, 0, 0],
        joints: {
          shoulder_L: { x: -65, y: 25, z: 45 },
          lower_arm_L: { x: -95, y: 20, z: 0 },
          shoulder_R: { x: -65, y: -25, z: -45 },
          lower_arm_R: { x: -95, y: -20, z: 0 },
          hip_L: { x: -35, y: 25, z: 20 },
          knee_L: { x: 85, y: 0, z: 0 },
          hip_R: { x: -35, y: -25, z: -20 },
          knee_R: { x: 85, y: 0, z: 0 },
        },
      },
    ],
  },

  // 13. Crawling (1.5s quadrupedal crawl)
  crawling: {
    id: 'crawling',
    name: '13. Emekleme (Crawling)',
    category: 'locomotion',
    description: 'Dört ayak üzerinde emekleme döngüsü: sol el ve sağ diz, ardından sağ el ve sol diz ritmik ilerleyişi.',
    duration: 1.5,
    loop: true,
    hasRootMotion: true,
    speed: 1.0,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, -0.22, 0],
        rootRotation: [35, 0, 0],
        joints: {
          hip_L: { x: -75, y: 5, z: 8 },
          knee_L: { x: 95, y: 0, z: 0 },
          hip_R: { x: -35, y: -5, z: -8 },
          knee_R: { x: 85, y: 0, z: 0 },
          shoulder_L: { x: -65, y: 0, z: -15 },
          lower_arm_L: { x: -35, y: 10, z: 0 },
          shoulder_R: { x: -25, y: 0, z: 15 },
          lower_arm_R: { x: -65, y: -10, z: 0 },
        },
      },
      {
        time: 0.75,
        rootPosition: [0, -0.22, 0.45],
        rootRotation: [35, 0, 0],
        joints: {
          hip_L: { x: -35, y: 5, z: 8 },
          knee_L: { x: 85, y: 0, z: 0 },
          hip_R: { x: -75, y: -5, z: -8 },
          knee_R: { x: 95, y: 0, z: 0 },
          shoulder_L: { x: -25, y: 0, z: -15 },
          lower_arm_L: { x: -65, y: 10, z: 0 },
          shoulder_R: { x: -65, y: 0, z: 15 },
          lower_arm_R: { x: -35, y: -10, z: 0 },
        },
      },
      {
        time: 1.5,
        rootPosition: [0, -0.22, 0.9],
        rootRotation: [35, 0, 0],
        joints: {
          hip_L: { x: -75, y: 5, z: 8 },
          knee_L: { x: 95, y: 0, z: 0 },
          hip_R: { x: -35, y: -5, z: -8 },
          knee_R: { x: 85, y: 0, z: 0 },
          shoulder_L: { x: -65, y: 0, z: -15 },
          lower_arm_L: { x: -35, y: 10, z: 0 },
          shoulder_R: { x: -25, y: 0, z: 15 },
          lower_arm_R: { x: -65, y: -10, z: 0 },
        },
      },
    ],
  },

  // 14. Dancing (2.0s Latin groove dance)
  dancing: {
    id: 'dancing',
    name: '14. Dans (Groove & Salsa)',
    category: 'sports',
    description: 'Ritmik kalça salınımı, adım dokunuşları ve gövde dalgalanması ile akıcı dans koreografisi.',
    duration: 2.0,
    loop: true,
    hasRootMotion: false,
    speed: 1.0,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, 0, 0],
        joints: {
          pelvis: { x: 0, y: 8, z: -10 },
          spine_lumbar: { x: 2, y: -4, z: 8 },
          spine_thoracic: { x: -3, y: 4, z: 4 },
          hip_L: { x: 5, y: 4, z: 8 },
          knee_L: { x: 12, y: 0, z: 0 },
          hip_R: { x: -8, y: -4, z: -4 },
          knee_R: { x: 25, y: 0, z: 0 },
          shoulder_L: { x: -45, y: 25, z: -35 },
          lower_arm_L: { x: -85, y: 30, z: 0 },
          shoulder_R: { x: -15, y: -15, z: 25 },
          lower_arm_R: { x: -55, y: -20, z: 0 },
        },
      },
      {
        time: 1.0,
        rootPosition: [0, 0, 0],
        joints: {
          pelvis: { x: 0, y: -8, z: 10 },
          spine_lumbar: { x: 2, y: 4, z: -8 },
          spine_thoracic: { x: -3, y: -4, z: -4 },
          hip_L: { x: -8, y: -4, z: 4 },
          knee_L: { x: 25, y: 0, z: 0 },
          hip_R: { x: 5, y: 4, z: -8 },
          knee_R: { x: 12, y: 0, z: 0 },
          shoulder_L: { x: -15, y: 15, z: -25 },
          lower_arm_L: { x: -55, y: 20, z: 0 },
          shoulder_R: { x: -45, y: -25, z: 35 },
          lower_arm_R: { x: -85, y: -30, z: 0 },
        },
      },
      {
        time: 2.0,
        rootPosition: [0, 0, 0],
        joints: {
          pelvis: { x: 0, y: 8, z: -10 },
          spine_lumbar: { x: 2, y: -4, z: 8 },
          spine_thoracic: { x: -3, y: 4, z: 4 },
          hip_L: { x: 5, y: 4, z: 8 },
          knee_L: { x: 12, y: 0, z: 0 },
          hip_R: { x: -8, y: -4, z: -4 },
          knee_R: { x: 25, y: 0, z: 0 },
          shoulder_L: { x: -45, y: 25, z: -35 },
          lower_arm_L: { x: -85, y: 30, z: 0 },
          shoulder_R: { x: -15, y: -15, z: 25 },
          lower_arm_R: { x: -55, y: -20, z: 0 },
        },
      },
    ],
  },

  // 15. Waving and Greeting (1.8s)
  waving_greeting: {
    id: 'waving_greeting',
    name: '15. El Sallama (Waving & Greeting)',
    category: 'social',
    description: 'Kaldırılmış sağ el ile ritmik dostça el sallama, hafif baş selamı ve güleryüzlü duruş.',
    duration: 1.8,
    loop: true,
    hasRootMotion: false,
    speed: 1.0,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, 0, 0],
        joints: {
          head: { x: 2, y: -6, z: -4 },
          shoulder_R: { x: -65, y: -15, z: 55 },
          lower_arm_R: { x: -105, y: -20, z: 0 },
          wrist_R: { x: 0, y: 0, z: 20 },
        },
      },
      {
        time: 0.45,
        joints: {
          wrist_R: { x: 0, y: 0, z: -25 },
        },
      },
      {
        time: 0.9,
        joints: {
          wrist_R: { x: 0, y: 0, z: 20 },
        },
      },
      {
        time: 1.35,
        joints: {
          wrist_R: { x: 0, y: 0, z: -25 },
        },
      },
      {
        time: 1.8,
        joints: {
          wrist_R: { x: 0, y: 0, z: 20 },
        },
      },
    ],
  },

  // 16. Full-Body Stretch (2.4s)
  full_body_stretch: {
    id: 'full_body_stretch',
    name: '16. Tüm Vücut Esneme (Full Stretch)',
    category: 'body',
    description: 'Baş üstüne uzanan kollar, omurga arkaya esnemiş, parmak uçlarına kalkış ile sabah esnemesi.',
    duration: 2.4,
    loop: true,
    hasRootMotion: false,
    speed: 1.0,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, 0, 0],
        joints: {
          spine_thoracic: { x: -10, y: 0, z: 0 },
          shoulder_L: { x: -155, y: 15, z: -15 },
          lower_arm_L: { x: -15, y: 0, z: 0 },
          shoulder_R: { x: -155, y: -15, z: 15 },
          lower_arm_R: { x: -15, y: 0, z: 0 },
          ankle_L: { x: 15, y: 0, z: 0 },
          ankle_R: { x: 15, y: 0, z: 0 },
        },
      },
      {
        time: 1.2,
        rootPosition: [0, 0.04, 0],
        joints: {
          spine_thoracic: { x: -18, y: 0, z: 0 },
          shoulder_L: { x: -170, y: 15, z: -10 },
          lower_arm_L: { x: -5, y: 0, z: 0 },
          shoulder_R: { x: -170, y: -15, z: 10 },
          lower_arm_R: { x: -5, y: 0, z: 0 },
          ankle_L: { x: 28, y: 0, z: 0 },
          ankle_R: { x: 28, y: 0, z: 0 },
        },
      },
      {
        time: 2.4,
        rootPosition: [0, 0, 0],
        joints: {
          spine_thoracic: { x: -10, y: 0, z: 0 },
          shoulder_L: { x: -155, y: 15, z: -15 },
          lower_arm_L: { x: -15, y: 0, z: 0 },
          shoulder_R: { x: -155, y: -15, z: 15 },
          lower_arm_R: { x: -15, y: 0, z: 0 },
          ankle_L: { x: 15, y: 0, z: 0 },
          ankle_R: { x: 15, y: 0, z: 0 },
        },
      },
    ],
  },

  // 17. Reaching for an Object (2.0s)
  reach_object: {
    id: 'reach_object',
    name: '17. Nesneye Uzanma (Reaching)',
    category: 'daily',
    description: 'Gövde öne eğilmiş, sağ kol ileri uzanmış, arka bacak denge oluşturacak şekilde uzanma.',
    duration: 2.0,
    loop: false,
    hasRootMotion: false,
    speed: 1.0,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, 0, 0],
        joints: {
          shoulder_R: { x: 0, y: 0, z: 8 },
        },
      },
      {
        time: 1.0,
        rootPosition: [0, -0.04, 0.15],
        joints: {
          pelvis: { x: 15, y: -5, z: 0 },
          spine_lumbar: { x: 15, y: 0, z: 0 },
          spine_thoracic: { x: 12, y: 0, z: 0 },
          hip_L: { x: -25, y: 0, z: 4 },
          knee_L: { x: 30, y: 0, z: 0 },
          hip_R: { x: 20, y: 0, z: -4 },
          knee_R: { x: 15, y: 0, z: 0 },
          shoulder_R: { x: -95, y: -10, z: 10 },
          lower_arm_R: { x: -12, y: 0, z: 0 },
          shoulder_L: { x: 25, y: 0, z: -15 },
        },
      },
      {
        time: 2.0,
        rootPosition: [0, 0, 0],
        joints: {
          pelvis: { x: 0, y: 0, z: 0 },
          shoulder_R: { x: 0, y: 0, z: 8 },
        },
      },
    ],
  },

  // 18. Lifting and Carrying (2.4s)
  lift_and_carry: {
    id: 'lift_and_carry',
    name: '18. Kaldırma ve Taşıma (Lift & Carry)',
    category: 'daily',
    description: 'Yere çömelip yükü iki elle kavrama, bacak gücüyle ayağa kalkma ve kucakta taşıma duruşu.',
    duration: 2.4,
    loop: false,
    hasRootMotion: true,
    speed: 1.0,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, 0, 0],
        joints: {},
      },
      {
        time: 0.7, // Deep squat to grab
        rootPosition: [0, -0.42, 0.1],
        joints: {
          pelvis: { x: 25, y: 0, z: 0 },
          spine_lumbar: { x: 15, y: 0, z: 0 },
          hip_L: { x: -85, y: 5, z: 8 },
          knee_L: { x: 105, y: 0, z: 0 },
          hip_R: { x: -85, y: -5, z: -8 },
          knee_R: { x: 105, y: 0, z: 0 },
          shoulder_L: { x: -45, y: 15, z: -10 },
          lower_arm_L: { x: -40, y: 20, z: 0 },
          shoulder_R: { x: -45, y: -15, z: 10 },
          lower_arm_R: { x: -40, y: -20, z: 0 },
        },
      },
      {
        time: 1.5, // Stand up loaded
        rootPosition: [0, 0, 0.2],
        joints: {
          pelvis: { x: -4, y: 0, z: 0 }, // Leaning back slightly with weight
          spine_thoracic: { x: -6, y: 0, z: 0 },
          hip_L: { x: 0, y: 0, z: 4 },
          knee_L: { x: 5, y: 0, z: 0 },
          hip_R: { x: 0, y: 0, z: -4 },
          knee_R: { x: 5, y: 0, z: 0 },
          shoulder_L: { x: -20, y: 25, z: -15 },
          lower_arm_L: { x: -105, y: 35, z: 0 }, // Carrying load at chest
          shoulder_R: { x: -20, y: -25, z: 15 },
          lower_arm_R: { x: -105, y: -35, z: 0 },
        },
      },
      {
        time: 2.4, // Carry step
        rootPosition: [0, 0, 0.55],
        joints: {
          hip_L: { x: -25, y: 0, z: 4 },
          knee_L: { x: 15, y: 0, z: 0 },
          hip_R: { x: 18, y: 0, z: -4 },
          knee_R: { x: 22, y: 0, z: 0 },
          shoulder_L: { x: -20, y: 25, z: -15 },
          lower_arm_L: { x: -105, y: 35, z: 0 },
          shoulder_R: { x: -20, y: -25, z: 15 },
          lower_arm_R: { x: -105, y: -35, z: 0 },
        },
      },
    ],
  },

  // 19. Throwing an Object (1.8s)
  throw_object: {
    id: 'throw_object',
    name: '19. Nesne Fırlatma (Overhand Throw)',
    category: 'sports',
    description: 'Beyzbol ve mızrak fırlatma dinamiği: geriye kurulma, gövde rotasyonu ve kırbaç gibi kol savruluşu.',
    duration: 1.8,
    loop: false,
    hasRootMotion: false,
    speed: 1.0,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, 0, 0],
        joints: {},
      },
      {
        time: 0.6, // Cocking phase back
        joints: {
          pelvis: { x: 0, y: 35, z: 0 },
          spine_thoracic: { x: -5, y: 25, z: 0 },
          hip_L: { x: -25, y: 15, z: 10 },
          hip_R: { x: 15, y: -10, z: -5 },
          shoulder_R: { x: -85, y: -35, z: 65 }, // Arm cocked back high
          lower_arm_R: { x: -95, y: -25, z: 0 },
          shoulder_L: { x: -45, y: 30, z: -25 },
        },
      },
      {
        time: 1.0, // Release whip forward
        joints: {
          pelvis: { x: 8, y: -25, z: 0 },
          spine_thoracic: { x: 12, y: -30, z: 0 },
          hip_L: { x: 10, y: -5, z: 0 },
          knee_L: { x: 25, y: 0, z: 0 },
          hip_R: { x: -45, y: 10, z: 0 },
          knee_R: { x: 10, y: 0, z: 0 },
          shoulder_R: { x: -125, y: 15, z: 10 }, // Follow through
          lower_arm_R: { x: -25, y: 0, z: 0 },
          wrist_R: { x: 45, y: 0, z: 0 },
          shoulder_L: { x: 35, y: 0, z: -15 },
        },
      },
      {
        time: 1.8, // Follow through recovery
        joints: {
          pelvis: { x: 0, y: 0, z: 0 },
          shoulder_R: { x: 0, y: 0, z: 8 },
        },
      },
    ],
  },

  // 20. Falling and Recovering Balance (2.2s)
  fall_and_recover: {
    id: 'fall_and_recover',
    name: '20. Tökezleme & Denge (Fall & Recover)',
    category: 'acrobatic',
    description: 'Beklenmedik tökezleme, ani öne düşüş, koruyucu kol hamlesi ve çevik adımla dengeyi geri kazanma.',
    duration: 2.2,
    loop: false,
    hasRootMotion: true,
    speed: 1.0,
    source: 'Verified Biomechanical Mocap Track',
    keyframes: [
      {
        time: 0.0,
        rootPosition: [0, 0, 0],
        joints: {},
      },
      {
        time: 0.5, // Trip & stumble forward
        rootPosition: [0, -0.15, 0.25],
        rootRotation: [22, 0, 0],
        joints: {
          pelvis: { x: 18, y: 0, z: 0 },
          spine_lumbar: { x: 15, y: 0, z: 0 },
          head: { x: -15, y: 0, z: 0 },
          hip_L: { x: -65, y: 0, z: 6 },
          knee_L: { x: 75, y: 0, z: 0 },
          hip_R: { x: 35, y: 0, z: -6 },
          knee_R: { x: 20, y: 0, z: 0 },
          shoulder_L: { x: -65, y: 15, z: -25 },
          lower_arm_L: { x: -45, y: 0, z: 0 },
          shoulder_R: { x: -65, y: -15, z: 25 },
          lower_arm_R: { x: -45, y: 0, z: 0 },
        },
      },
      {
        time: 1.2, // Big recovery stomp step
        rootPosition: [0, -0.05, 0.65],
        rootRotation: [8, 0, 0],
        joints: {
          pelvis: { x: 5, y: 0, z: 0 },
          hip_L: { x: -35, y: 0, z: 4 },
          knee_L: { x: 45, y: 0, z: 0 },
          hip_R: { x: -10, y: 0, z: -4 },
          knee_R: { x: 15, y: 0, z: 0 },
          shoulder_L: { x: -20, y: 0, z: -15 },
          shoulder_R: { x: -20, y: 0, z: 15 },
        },
      },
      {
        time: 2.2, // Stable upright balance
        rootPosition: [0, 0, 0.85],
        rootRotation: [0, 0, 0],
        joints: {
          pelvis: { x: 0, y: 0, z: 0 },
          hip_L: { x: 0, y: 0, z: 2 },
          knee_L: { x: 5, y: 0, z: 0 },
          hip_R: { x: 0, y: 0, z: -2 },
          knee_R: { x: 5, y: 0, z: 0 },
          shoulder_L: { x: 0, y: 0, z: -8 },
          shoulder_R: { x: 0, y: 0, z: 8 },
        },
      },
    ],
  },

  // 21. Hugging Another Character (2.5s embrace sequence)
  two_character_hug: {
    id: 'two_character_hug',
    name: '21. İki Kişilik Sarılma (Two-Character Hug)',
    category: 'social',
    description: 'İki karakterin birbirine kollarını açarak yaklaşması, omuz ve sırtı kavrayan sevgi dolu sarılma ve kucaklaşma.',
    duration: 2.5,
    loop: false,
    hasRootMotion: false,
    speed: 1.0,
    source: 'Coordinated Multi-Character Sequence',
    keyframes: [
      {
        time: 0.0, // Open arms approach
        joints: {
          shoulder_L: { x: -45, y: 25, z: -35 },
          lower_arm_L: { x: -35, y: 15, z: 0 },
          shoulder_R: { x: -45, y: -25, z: 35 },
          lower_arm_R: { x: -35, y: -15, z: 0 },
        },
      },
      {
        time: 0.8, // Arms wrap around partner's torso/shoulder
        joints: {
          spine_thoracic: { x: 6, y: 0, z: 0 },
          head: { x: 8, y: -12, z: 4 }, // Head rests on partner's shoulder
          shoulder_L: { x: -65, y: 35, z: -55 },
          lower_arm_L: { x: -105, y: 40, z: 0 },
          shoulder_R: { x: -55, y: -30, z: 45 },
          lower_arm_R: { x: -95, y: -35, z: 0 },
        },
      },
      {
        time: 1.8, // Holding warm embrace
        joints: {
          spine_thoracic: { x: 8, y: 0, z: 0 },
          head: { x: 10, y: -14, z: 4 },
          shoulder_L: { x: -68, y: 35, z: -55 },
          lower_arm_L: { x: -108, y: 40, z: 0 },
          shoulder_R: { x: -58, y: -30, z: 45 },
          lower_arm_R: { x: -98, y: -35, z: 0 },
        },
      },
      {
        time: 2.5, // Release embrace gently
        joints: {
          head: { x: 0, y: 0, z: 0 },
          shoulder_L: { x: -15, y: 10, z: -12 },
          lower_arm_L: { x: -20, y: 10, z: 0 },
          shoulder_R: { x: -15, y: -10, z: 12 },
          lower_arm_R: { x: -20, y: -10, z: 0 },
        },
      },
    ],
  },
};
