import { FigurePose, JointKey } from '../types/skeleton';
import { DEFAULT_NEUTRAL_POSE } from '../scene/jointDefinitions';

export interface PoseTemplate {
  id: string;
  name: string;
  category: 'neutral' | 'classical' | 'action' | 'ground' | 'composition';
  description: string;
  joints: Partial<Record<JointKey, { x: number; y: number; z: number }>>;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const BUILTIN_POSE_TEMPLATES: Record<string, PoseTemplate> = {
  neutral_t: {
    id: 'neutral_t',
    name: 'Anatomical T-Pose',
    category: 'neutral',
    description: 'Standard anatomical reference posture with extended horizontal arms.',
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      shoulder_L: { x: 0, y: 0, z: 75 },
      shoulder_R: { x: 0, y: 0, z: -75 },
      lower_arm_L: { x: 0, y: 0, z: 0 },
      lower_arm_R: { x: 0, y: 0, z: 0 },
    },
  },
  neutral_a: {
    id: 'neutral_a',
    name: 'Relaxed A-Pose',
    category: 'neutral',
    description: 'Natural resting stance with slight shoulder depression and arm clearance.',
    joints: { ...DEFAULT_NEUTRAL_POSE.joints },
  },
  contrapposto: {
    id: 'contrapposto',
    name: 'Classical Contrapposto',
    category: 'classical',
    description: 'Counterpoise stance with weight shifted onto right leg, tilted pelvis and shoulders.',
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 0, y: 6, z: -7 },
      spine_lumbar: { x: 2, y: -4, z: 6 },
      spine_thoracic: { x: -3, y: -3, z: 5 },
      head: { x: 2, y: 15, z: -4 },
      hip_L: { x: 8, y: -5, z: 8 },
      knee_L: { x: 18, y: 0, z: 0 },
      ankle_L: { x: -12, y: 0, z: 0 },
      hip_R: { x: -3, y: 0, z: -3 },
      knee_R: { x: 0, y: 0, z: 0 },
      ankle_R: { x: 0, y: 0, z: 0 },
      shoulder_L: { x: 12, y: 8, z: -25 },
      lower_arm_L: { x: 30, y: 10, z: 0 },
      shoulder_R: { x: 5, y: -5, z: 20 },
      lower_arm_R: { x: 15, y: -10, z: 0 },
    },
  },
  the_thinker: {
    id: 'the_thinker',
    name: 'The Thinker (Rodin)',
    category: 'classical',
    description: 'Iconic seated meditation pose with bent spine, elbow on knee, fist to chin.',
    position: [0, -0.4, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 15, y: 0, z: 0 },
      spine_lumbar: { x: 28, y: 12, z: 0 },
      spine_thoracic: { x: 25, y: 10, z: 0 },
      spine_cervical: { x: 20, y: -5, z: 0 },
      head: { x: 15, y: -8, z: 4 },
      hip_L: { x: -85, y: 12, z: 10 },
      knee_L: { x: 105, y: 0, z: 0 },
      ankle_L: { x: -15, y: 0, z: 0 },
      hip_R: { x: -80, y: -8, z: -8 },
      knee_R: { x: 100, y: 0, z: 0 },
      ankle_R: { x: -15, y: 0, z: 0 },
      shoulder_R: { x: 55, y: 25, z: -25 },
      lower_arm_R: { x: 110, y: 35, z: 0 },
      wrist_R: { x: 35, y: 0, z: 0 },
      shoulder_L: { x: 35, y: 10, z: -20 },
      lower_arm_L: { x: 65, y: 15, z: 0 },
    },
  },
  // Acceptance Test B Pose
  seated_lean_back: {
    id: 'seated_lean_back',
    name: 'Floor Seated Lean-Back',
    category: 'ground',
    description: 'Seated on ground with bent knees, leaning back on left hand, right hand on skull, head turned.',
    position: [0, -0.65, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: -16, y: -8, z: -4 },
      spine_lumbar: { x: -8, y: 4, z: -4 },
      spine_thoracic: { x: -6, y: 6, z: -2 },
      spine_cervical: { x: 8, y: 20, z: 4 },
      head: { x: 6, y: 25, z: 6 },
      // Left arm supports weight behind torso
      clavicle_L: { x: 5, y: 0, z: 10 },
      shoulder_L: { x: 28, y: -15, z: -35 },
      lower_arm_L: { x: 15, y: 20, z: 0 },
      wrist_L: { x: 45, y: 10, z: 0 },
      // Right arm raised, hand resting on cranium
      clavicle_R: { x: 0, y: 0, z: -10 },
      shoulder_R: { x: -75, y: 15, z: -65 },
      lower_arm_R: { x: 125, y: -25, z: 0 },
      wrist_R: { x: 25, y: 0, z: 0 },
      // Both knees bent
      hip_L: { x: -70, y: 15, z: 18 },
      knee_L: { x: 85, y: 0, z: 0 },
      ankle_L: { x: -18, y: 0, z: 0 },
      hip_R: { x: -65, y: -10, z: -14 },
      knee_R: { x: 92, y: 0, z: 0 },
      ankle_R: { x: -16, y: 0, z: 0 },
    },
  },
  kneeling: {
    id: 'kneeling',
    name: 'Kneeling Reverence',
    category: 'ground',
    description: 'Double knee ground support with erect upright spine and relaxed palms.',
    position: [0, -0.45, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      hip_L: { x: -8, y: 0, z: 2 },
      knee_L: { x: 125, y: 0, z: 0 },
      ankle_L: { x: 35, y: 0, z: 0 },
      hip_R: { x: -8, y: 0, z: -2 },
      knee_R: { x: 125, y: 0, z: 0 },
      ankle_R: { x: 35, y: 0, z: 0 },
      shoulder_L: { x: 15, y: 5, z: -18 },
      lower_arm_L: { x: 35, y: 10, z: 0 },
      shoulder_R: { x: 15, y: -5, z: 18 },
      lower_arm_R: { x: 35, y: -10, z: 0 },
    },
  },
  running: {
    id: 'running',
    name: 'Dynamic Sprint',
    category: 'action',
    description: 'High-speed forward propulsion stride with reciprocating counter-balanced arms.',
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 18, y: 8, z: 0 },
      spine_lumbar: { x: 10, y: -10, z: 0 },
      spine_thoracic: { x: 12, y: -12, z: 0 },
      head: { x: -15, y: 0, z: 0 },
      // Left leg forward drive
      hip_L: { x: -65, y: 0, z: 5 },
      knee_L: { x: 70, y: 0, z: 0 },
      ankle_L: { x: -15, y: 0, z: 0 },
      // Right leg rear extension
      hip_R: { x: 35, y: 0, z: -5 },
      knee_R: { x: 25, y: 0, z: 0 },
      ankle_R: { x: 20, y: 0, z: 0 },
      // Arms counter-pumping
      shoulder_L: { x: -45, y: 0, z: -15 },
      lower_arm_L: { x: 95, y: 20, z: 0 },
      shoulder_R: { x: 55, y: 0, z: 15 },
      lower_arm_R: { x: 95, y: -20, z: 0 },
    },
  },
  walking: {
    id: 'walking',
    name: 'Natural Walk Cycle',
    category: 'action',
    description: 'Measured mid-stride gait with subtle pelvis rotation and arm swing.',
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 4, y: 6, z: 0 },
      hip_L: { x: -28, y: 0, z: 3 },
      knee_L: { x: 12, y: 0, z: 0 },
      ankle_L: { x: -5, y: 0, z: 0 },
      hip_R: { x: 18, y: 0, z: -3 },
      knee_R: { x: 24, y: 0, z: 0 },
      ankle_R: { x: 12, y: 0, z: 0 },
      shoulder_L: { x: 18, y: 0, z: -18 },
      lower_arm_L: { x: 22, y: 0, z: 0 },
      shoulder_R: { x: -22, y: 0, z: 18 },
      lower_arm_R: { x: 18, y: 0, z: 0 },
    },
  },
  reaching: {
    id: 'reaching',
    name: 'Reaching Skyward',
    category: 'action',
    description: 'Aspirational vertical reach with extended spine and elevated clavicles.',
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      spine_lumbar: { x: -10, y: 0, z: 0 },
      spine_thoracic: { x: -12, y: 0, z: 0 },
      head: { x: 35, y: 0, z: 0 },
      clavicle_L: { x: 0, y: 0, z: 25 },
      shoulder_L: { x: 80, y: 0, z: 65 },
      lower_arm_L: { x: 10, y: 0, z: 0 },
      clavicle_R: { x: 0, y: 0, z: -25 },
      shoulder_R: { x: 80, y: 0, z: -65 },
      lower_arm_R: { x: 10, y: 0, z: 0 },
    },
  },
  crossed_arms: {
    id: 'crossed_arms',
    name: 'Crossed Arms Stance',
    category: 'neutral',
    description: 'Confident stance with arms folded symmetrically across upper thoracic cage.',
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      shoulder_L: { x: 35, y: 25, z: -40 },
      lower_arm_L: { x: 105, y: 40, z: 0 },
      shoulder_R: { x: 38, y: -25, z: 40 },
      lower_arm_R: { x: 105, y: -40, z: 0 },
    },
  },
  // Two-figure embrace presets (Acceptance Test D)
  embrace_A: {
    id: 'embrace_A',
    name: 'Embrace (Figure 1)',
    category: 'composition',
    description: 'Authentic human embrace: wraps left arm over partner scapula and right arm around partner waist.',
    position: [-0.19, 0, 0],
    rotation: [0, 82, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      spine_lumbar: { x: 3, y: 3, z: 0 },
      spine_thoracic: { x: 5, y: 4, z: 0 },
      head: { x: 8, y: -22, z: 6 },
      // Left arm reaches over partner's upper shoulder and rests on partner's scapula
      clavicle_L: { x: 0, y: 0, z: 6 },
      shoulder_L: { x: -42, y: 18, z: 0 },
      lower_arm_L: { x: 82, y: 15, z: 0 },
      wrist_L: { x: 15, y: 5, z: 0 },
      // Right arm reaches forward and wraps partner's waist/lower ribs
      clavicle_R: { x: 0, y: 0, z: -6 },
      shoulder_R: { x: -32, y: -18, z: 2 },
      lower_arm_R: { x: 76, y: -15, z: 0 },
      wrist_R: { x: 20, y: -5, z: 0 },
      // Solid natural stance
      hip_L: { x: -6, y: 0, z: 4 },
      knee_L: { x: 8, y: 0, z: 0 },
      hip_R: { x: 6, y: 0, z: -4 },
      knee_R: { x: 4, y: 0, z: 0 },
    },
  },
  embrace_B: {
    id: 'embrace_B',
    name: 'Embrace (Figure 2)',
    category: 'composition',
    description: 'Reciprocating embrace: wraps right arm over partner shoulder and left arm around waist.',
    position: [0.19, 0, 0],
    rotation: [0, -98, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      spine_lumbar: { x: 3, y: -3, z: 0 },
      spine_thoracic: { x: 5, y: -4, z: 0 },
      head: { x: 8, y: 22, z: -6 },
      // Right arm reaches over partner's upper shoulder and rests on partner's scapula
      clavicle_R: { x: 0, y: 0, z: -6 },
      shoulder_R: { x: -42, y: -18, z: 0 },
      lower_arm_R: { x: 82, y: -15, z: 0 },
      wrist_R: { x: 15, y: -5, z: 0 },
      // Left arm reaches forward and wraps partner's waist
      clavicle_L: { x: 0, y: 0, z: 6 },
      shoulder_L: { x: -32, y: 18, z: -2 },
      lower_arm_L: { x: 76, y: 15, z: 0 },
      wrist_L: { x: 20, y: 5, z: 0 },
      // Solid natural stance
      hip_L: { x: 5, y: 0, z: 3 },
      knee_L: { x: 6, y: 0, z: 0 },
      hip_R: { x: -6, y: 0, z: -3 },
      knee_R: { x: 8, y: 0, z: 0 },
    },
  },
  duel_A: {
    id: 'duel_A',
    name: 'Combat Stance (Attacker)',
    category: 'composition',
    description: 'Dynamic martial arts combat pose with thrusting arm and defensive rear guard.',
    position: [-0.45, 0, 0],
    rotation: [0, 75, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 10, y: 0, z: 0 },
      spine_lumbar: { x: 8, y: 8, z: 0 },
      spine_thoracic: { x: 12, y: 12, z: 0 },
      head: { x: 5, y: -15, z: 0 },
      hip_L: { x: -45, y: 10, z: 8 },
      knee_L: { x: 65, y: 0, z: 0 },
      hip_R: { x: 25, y: -10, z: -8 },
      knee_R: { x: 15, y: 0, z: 0 },
      // Forward thrust
      shoulder_L: { x: -65, y: 25, z: 10 },
      lower_arm_L: { x: 30, y: 10, z: 0 },
      wrist_L: { x: 25, y: 0, z: 0 },
      // Rear guard
      shoulder_R: { x: -20, y: -30, z: -25 },
      lower_arm_R: { x: 95, y: -20, z: 0 },
    },
  },
  duel_B: {
    id: 'duel_B',
    name: 'Combat Stance (Defender)',
    category: 'composition',
    description: 'Dynamic defensive parry stance leaning back with raised guard.',
    position: [0.45, 0, 0],
    rotation: [0, -105, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: -8, y: 0, z: 0 },
      spine_lumbar: { x: -10, y: -8, z: 0 },
      spine_thoracic: { x: -12, y: -10, z: 0 },
      head: { x: 8, y: 15, z: 0 },
      hip_R: { x: -35, y: -10, z: -6 },
      knee_R: { x: 55, y: 0, z: 0 },
      hip_L: { x: 20, y: 10, z: 6 },
      knee_L: { x: 20, y: 0, z: 0 },
      // High parry guard
      shoulder_R: { x: -60, y: -20, z: -15 },
      lower_arm_R: { x: 85, y: -15, z: 0 },
      shoulder_L: { x: -30, y: 25, z: 20 },
      lower_arm_L: { x: 90, y: 20, z: 0 },
    },
  },
  dance_waltz: {
    id: 'dance_waltz',
    name: 'Waltz Dance (Figure 1)',
    category: 'composition',
    description: 'Elegant ballroom dance posture leading with right hand raised and left hand on partner waist.',
    position: [-0.24, 0, 0],
    rotation: [0, 85, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      spine_thoracic: { x: -8, y: 6, z: 4 },
      head: { x: 5, y: -30, z: 6 },
      shoulder_R: { x: -55, y: -20, z: 25 },
      lower_arm_R: { x: 60, y: -10, z: 0 },
      shoulder_L: { x: -35, y: 15, z: -15 },
      lower_arm_L: { x: 80, y: 20, z: 0 },
    },
  },
};

// ==========================================
// LOCAL STORAGE PROJECT & POSE PERSISTENCE
// ==========================================

const CUSTOM_POSES_KEY = 'chromatic_skeleton_custom_poses_v1';

export function getCustomPoses(): Record<string, FigurePose> {
  try {
    const raw = localStorage.getItem(CUSTOM_POSES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCustomPose(name: string, pose: FigurePose) {
  const current = getCustomPoses();
  current[name] = JSON.parse(JSON.stringify(pose));
  localStorage.setItem(CUSTOM_POSES_KEY, JSON.stringify(current));
}

export function deleteCustomPose(name: string) {
  const current = getCustomPoses();
  delete current[name];
  localStorage.setItem(CUSTOM_POSES_KEY, JSON.stringify(current));
}
