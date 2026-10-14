import { FigurePose, JointKey } from '../types/skeleton';
import { DEFAULT_NEUTRAL_POSE } from '../scene/jointDefinitions';

export interface PoseTemplate {
  id: string;
  name: string;
  category: 'standing' | 'sitting' | 'action' | 'lying' | 'artistic' | 'sports';
  description: string;
  joints: Partial<Record<JointKey, { x: number; y: number; z: number }>>;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Anatomically validated human pose library
 * Joint coordinate conventions:
 * - LOWER ARM / ELBOW: Negative X flexes the forearm FORWARD towards chest/face (+Z).
 *                      Positive X extends backwards.
 * - SHOULDER: Negative X raises arm forward (anterior flexion). Positive X extends backward.
 *             Negative Z abducts Left arm outward. Positive Z abducts Right arm outward.
 * - KNEE: Positive X flexes knee backward towards dorsal aspect (-Z).
 * - HIP: Negative X flexes thigh forward.
 * - GROUND CONTACT: Standing & ground poses are strictly validated with ground-plane clamping (Y >= 0).
 */
export const BUILTIN_POSE_TEMPLATES: Record<string, PoseTemplate> = {
  // 1. Doğal Ayakta Duruş (Natural Standing)
  natural_standing: {
    id: 'natural_standing',
    name: '1. Doğal Ayakta Duruş (Natural Standing)',
    category: 'standing',
    description: 'Anatomiye uygun, omurgası dengeli, kollar gövde yanında doğal dinlenme duruşu.',
    position: [0, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 0, y: 0, z: 0 },
      spine_lumbar: { x: 2, y: 0, z: 0 },
      spine_thoracic: { x: -2, y: 0, z: 0 },
      spine_cervical: { x: 2, y: 0, z: 0 },
      head: { x: 0, y: 0, z: 0 },
      shoulder_L: { x: 0, y: 0, z: -8 },
      lower_arm_L: { x: -8, y: 10, z: 0 },
      shoulder_R: { x: 0, y: 0, z: 8 },
      lower_arm_R: { x: -8, y: -10, z: 0 },
      hip_L: { x: 0, y: 0, z: 3 },
      knee_L: { x: 2, y: 0, z: 0 },
      ankle_L: { x: 0, y: 0, z: 0 },
      hip_R: { x: 0, y: 0, z: -3 },
      knee_R: { x: 2, y: 0, z: 0 },
      ankle_R: { x: 0, y: 0, z: 0 },
    },
  },

  // 2. Klasik Rahat Duruş (Contrapposto)
  contrapposto: {
    id: 'contrapposto',
    name: '2. Klasik Rahat Duruş (Contrapposto)',
    category: 'standing',
    description: 'Ağırlık sağ bacağa verilmiş, pelvis ve omuzlar dengelenmiş estetik ve doğal heykel duruşu.',
    position: [0, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 0, y: 4, z: -5 },
      spine_lumbar: { x: 2, y: -2, z: 4 },
      spine_thoracic: { x: -2, y: -2, z: 3 },
      spine_cervical: { x: 3, y: 8, z: -2 },
      head: { x: 1, y: 12, z: -3 },
      hip_R: { x: -2, y: 0, z: -2 },
      knee_R: { x: 2, y: 0, z: 0 },
      ankle_R: { x: 0, y: 0, z: 0 },
      hip_L: { x: 12, y: -6, z: 6 },
      knee_L: { x: 25, y: 0, z: 0 },
      ankle_L: { x: -16, y: 0, z: 0 },
      shoulder_L: { x: -5, y: 5, z: -15 },
      lower_arm_L: { x: -25, y: 15, z: 0 },
      shoulder_R: { x: 2, y: -4, z: 12 },
      lower_arm_R: { x: -15, y: -10, z: 0 },
    },
  },

  // 3. Sandalyede Oturma (Chair Seated)
  chair_seated: {
    id: 'chair_seated',
    name: '3. Sandalyede Oturan (Seated on Chair)',
    category: 'sitting',
    description: 'Kalça ve dizler 90 derece bükülü, eller bacaklar üzerinde rahat oturuş, ayaklar yere basılı.',
    position: [0, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 8, y: 0, z: 0 },
      spine_lumbar: { x: 4, y: 0, z: 0 },
      spine_thoracic: { x: -3, y: 0, z: 0 },
      spine_cervical: { x: 2, y: 0, z: 0 },
      head: { x: 2, y: 0, z: 0 },
      hip_L: { x: -85, y: 5, z: 6 },
      knee_L: { x: 90, y: 0, z: 0 },
      ankle_L: { x: -5, y: 0, z: 0 },
      hip_R: { x: -85, y: -5, z: -6 },
      knee_R: { x: 90, y: 0, z: 0 },
      ankle_R: { x: -5, y: 0, z: 0 },
      shoulder_L: { x: -15, y: 10, z: -10 },
      lower_arm_L: { x: -75, y: 25, z: 0 },
      wrist_L: { x: 10, y: 0, z: 0 },
      shoulder_R: { x: -15, y: -10, z: 10 },
      lower_arm_R: { x: -75, y: -25, z: 0 },
      wrist_R: { x: 10, y: 0, z: 0 },
    },
  },

  // 4. Bağdaş Kurma / Meditasyon (Cross-Legged Lotus)
  lotus_meditation: {
    id: 'lotus_meditation',
    name: '4. Bağdaş Kurma / Meditasyon (Lotus Pose)',
    category: 'sitting',
    description: 'Yerde çapraz bacaklar, dik omurga, eller dizler üstünde zen meditasyon duruşu.',
    position: [0, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 6, y: 0, z: 0 },
      spine_lumbar: { x: 4, y: 0, z: 0 },
      spine_thoracic: { x: -4, y: 0, z: 0 },
      spine_cervical: { x: 2, y: 0, z: 0 },
      head: { x: 0, y: 0, z: 0 },
      hip_L: { x: -65, y: 40, z: 35 },
      knee_L: { x: 125, y: 10, z: 0 },
      ankle_L: { x: 20, y: 0, z: 15 },
      hip_R: { x: -65, y: -40, z: -35 },
      knee_R: { x: 125, y: -10, z: 0 },
      ankle_R: { x: 20, y: 0, z: -15 },
      shoulder_L: { x: -10, y: 15, z: -25 },
      lower_arm_L: { x: -65, y: 40, z: 0 },
      shoulder_R: { x: -10, y: -15, z: 25 },
      lower_arm_R: { x: -65, y: -40, z: 0 },
    },
  },

  // 5. Sırtüstü Yatan (Supine Lying Down)
  floor_lying_supine: {
    id: 'floor_lying_supine',
    name: '5. Sırtüstü Yatan (Supine Lying Down)',
    category: 'lying',
    description: 'Zemine tamamen uzanmış, baş hafif dinlenmede, kollar yanlarda huzurlu uyku pozu.',
    position: [0, 0.14, 0],
    rotation: [-90, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 0, y: 0, z: 0 },
      spine_lumbar: { x: 2, y: 0, z: 0 },
      spine_thoracic: { x: 0, y: 0, z: 0 },
      spine_cervical: { x: -2, y: 0, z: 0 },
      head: { x: 0, y: 0, z: 0 },
      hip_L: { x: 0, y: 12, z: 8 },
      knee_L: { x: 5, y: 0, z: 0 },
      ankle_L: { x: 15, y: 0, z: 0 },
      hip_R: { x: 0, y: -12, z: -8 },
      knee_R: { x: 5, y: 0, z: 0 },
      ankle_R: { x: 15, y: 0, z: 0 },
      shoulder_L: { x: 0, y: 0, z: -18 },
      lower_arm_L: { x: -12, y: 20, z: 0 },
      shoulder_R: { x: 0, y: 0, z: 18 },
      lower_arm_R: { x: -12, y: -20, z: 0 },
    },
  },

  // 6. Yan Yatan (Side-Lying Rest)
  side_lying_rest: {
    id: 'side_lying_rest',
    name: '6. Yan Yatarak Dinlenme (Side-Lying Rest)',
    category: 'lying',
    description: 'Cenin eğrisi, bacaklar hafif bükülü, bir kol baş altında yastık gibi.',
    position: [0, 0.16, 0],
    rotation: [-90, 90, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 10, y: 0, z: 0 },
      spine_lumbar: { x: 8, y: 0, z: 2 },
      spine_thoracic: { x: 6, y: 0, z: 2 },
      spine_cervical: { x: -4, y: 0, z: -8 },
      head: { x: 0, y: 0, z: -10 },
      hip_L: { x: -55, y: 0, z: 5 },
      knee_L: { x: 85, y: 0, z: 0 },
      ankle_L: { x: -10, y: 0, z: 0 },
      hip_R: { x: -45, y: 0, z: -5 },
      knee_R: { x: 75, y: 0, z: 0 },
      ankle_R: { x: -10, y: 0, z: 0 },
      shoulder_L: { x: -45, y: 0, z: -35 },
      lower_arm_L: { x: -85, y: 20, z: 0 },
      shoulder_R: { x: -20, y: 0, z: 20 },
      lower_arm_R: { x: -45, y: -15, z: 0 },
    },
  },

  // 7. Plank Pozisyonu (Prone Plank)
  prone_plank: {
    id: 'prone_plank',
    name: '7. Plank Egzersizi (Athletic Plank)',
    category: 'action',
    description: 'Ön kollar ve ayak parmakları üzerinde dümdüz atletik gövde stabilitesi.',
    position: [0, 0.24, 0],
    rotation: [90, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 0, y: 0, z: 0 },
      spine_lumbar: { x: -1, y: 0, z: 0 },
      spine_thoracic: { x: 1, y: 0, z: 0 },
      spine_cervical: { x: -10, y: 0, z: 0 },
      head: { x: -15, y: 0, z: 0 },
      hip_L: { x: 0, y: 0, z: 4 },
      knee_L: { x: 0, y: 0, z: 0 },
      ankle_L: { x: -40, y: 0, z: 0 },
      hip_R: { x: 0, y: 0, z: -4 },
      knee_R: { x: 0, y: 0, z: 0 },
      ankle_R: { x: -40, y: 0, z: 0 },
      shoulder_L: { x: 0, y: 0, z: -15 },
      lower_arm_L: { x: -90, y: 0, z: 0 },
      shoulder_R: { x: 0, y: 0, z: 15 },
      lower_arm_R: { x: -90, y: 0, z: 0 },
    },
  },

  // 8. Atletik Sprint (Athletic Sprint)
  athletic_sprint: {
    id: 'athletic_sprint',
    name: '8. Atletik Sprint Koşu (Athletic Sprint)',
    category: 'action',
    description: 'Patlayıcı koşu adımı, zıt bacak ve kollar maksimum dinamizmle açık.',
    position: [0, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 15, y: 10, z: 0 },
      spine_lumbar: { x: 10, y: -8, z: 0 },
      spine_thoracic: { x: 8, y: -6, z: 0 },
      spine_cervical: { x: -10, y: 2, z: 0 },
      head: { x: -8, y: 4, z: 0 },
      hip_L: { x: -70, y: 0, z: 6 },
      knee_L: { x: 110, y: 0, z: 0 },
      ankle_L: { x: -25, y: 0, z: 0 },
      hip_R: { x: 35, y: 0, z: -6 },
      knee_R: { x: 20, y: 0, z: 0 },
      ankle_R: { x: 25, y: 0, z: 0 },
      shoulder_L: { x: 40, y: 0, z: -15 },
      lower_arm_L: { x: -85, y: 15, z: 0 },
      shoulder_R: { x: -55, y: 0, z: 15 },
      lower_arm_R: { x: -90, y: -15, z: 0 },
    },
  },

  // 9. Dinamik Yürüyüş (Dynamic Walk)
  dynamic_walk: {
    id: 'dynamic_walk',
    name: '9. Dinamik Yürüyüş Adımı (Dynamic Walk)',
    category: 'standing',
    description: 'Öne adım atan, karşıt kol salınımıyla zarif ve dengeli yürüyüş anı.',
    position: [0, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 0, y: 5, z: 0 },
      spine_lumbar: { x: 2, y: -4, z: 0 },
      spine_thoracic: { x: -2, y: -3, z: 0 },
      head: { x: 0, y: 2, z: 0 },
      hip_L: { x: -28, y: 0, z: 4 },
      knee_L: { x: 10, y: 0, z: 0 },
      ankle_L: { x: -10, y: 0, z: 0 },
      hip_R: { x: 20, y: 0, z: -4 },
      knee_R: { x: 35, y: 0, z: 0 },
      ankle_R: { x: 15, y: 0, z: 0 },
      shoulder_L: { x: 20, y: 0, z: -10 },
      lower_arm_L: { x: -35, y: 15, z: 0 },
      shoulder_R: { x: -25, y: 0, z: 10 },
      lower_arm_R: { x: -45, y: -15, z: 0 },
    },
  },

  // 10. Serbest Yüzme (Freestyle Swimming)
  freestyle_swim: {
    id: 'freestyle_swim',
    name: '10. Serbest Yüzme (Freestyle Swimming)',
    category: 'sports',
    description: 'Yatay vücut, kulaç atan sağ kol ve nefes alma için yana dönük baş.',
    position: [0, 0.95, 0],
    rotation: [85, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 0, y: 20, z: 0 },
      spine_lumbar: { x: 0, y: 15, z: 0 },
      spine_thoracic: { x: 0, y: 15, z: 0 },
      spine_cervical: { x: 0, y: 35, z: 10 },
      head: { x: 0, y: 40, z: 10 },
      hip_L: { x: 15, y: 0, z: 4 },
      knee_L: { x: 20, y: 0, z: 0 },
      ankle_L: { x: 30, y: 0, z: 0 },
      hip_R: { x: -15, y: 0, z: -4 },
      knee_R: { x: 10, y: 0, z: 0 },
      ankle_R: { x: 30, y: 0, z: 0 },
      shoulder_L: { x: 25, y: 0, z: -15 },
      lower_arm_L: { x: -20, y: 10, z: 0 },
      shoulder_R: { x: -155, y: 0, z: 25 },
      lower_arm_R: { x: -75, y: -20, z: 0 },
    },
  },

  // 11. Kurbağalama Yüzme (Breaststroke Swim)
  breaststroke_swim: {
    id: 'breaststroke_swim',
    name: '11. Kurbağalama Yüzme (Breaststroke Swim)',
    category: 'sports',
    description: 'Simetrik açılmış kollar ve bacaklar ile su yüzeyinde nefes alma fazı.',
    position: [0, 0.9, 0],
    rotation: [80, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: -5, y: 0, z: 0 },
      spine_lumbar: { x: -8, y: 0, z: 0 },
      spine_thoracic: { x: -12, y: 0, z: 0 },
      spine_cervical: { x: -20, y: 0, z: 0 },
      head: { x: -20, y: 0, z: 0 },
      hip_L: { x: -35, y: 25, z: 35 },
      knee_L: { x: 80, y: 15, z: 0 },
      ankle_L: { x: -15, y: 0, z: 15 },
      hip_R: { x: -35, y: -25, z: -35 },
      knee_R: { x: 80, y: -15, z: 0 },
      ankle_R: { x: -15, y: 0, z: -15 },
      shoulder_L: { x: -45, y: 25, z: -65 },
      lower_arm_L: { x: -75, y: 35, z: 0 },
      shoulder_R: { x: -45, y: -25, z: 65 },
      lower_arm_R: { x: -75, y: -35, z: 0 },
    },
  },

  // 12. Derin Çömelme (Deep Squat)
  deep_squat: {
    id: 'deep_squat',
    name: '12. Derin Çömelme / Squat (Deep Squat)',
    category: 'action',
    description: 'Dizler ve kalça tam bükülü, kollar denge için öne uzatılmış stabil çömelme.',
    position: [0, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 18, y: 0, z: 0 },
      spine_lumbar: { x: 12, y: 0, z: 0 },
      spine_thoracic: { x: 10, y: 0, z: 0 },
      spine_cervical: { x: -15, y: 0, z: 0 },
      head: { x: -10, y: 0, z: 0 },
      hip_L: { x: -115, y: 15, z: 18 },
      knee_L: { x: 135, y: 0, z: 0 },
      ankle_L: { x: -28, y: 0, z: 0 },
      hip_R: { x: -115, y: -15, z: -18 },
      knee_R: { x: 135, y: 0, z: 0 },
      ankle_R: { x: -28, y: 0, z: 0 },
      shoulder_L: { x: -70, y: 0, z: -10 },
      lower_arm_L: { x: -20, y: 0, z: 0 },
      shoulder_R: { x: -70, y: 0, z: 10 },
      lower_arm_R: { x: -20, y: 0, z: 0 },
    },
  },

  // 13. Diz Çökme (Kneeling Prayer)
  kneeling_prayer: {
    id: 'kneeling_prayer',
    name: '13. Diz Çökme (Kneeling Posture)',
    category: 'sitting',
    description: 'İki diz üzerinde duruş, dik omurga, eller göğüste kenetlenmiş saygı duruşu.',
    position: [0, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 2, y: 0, z: 0 },
      spine_lumbar: { x: 2, y: 0, z: 0 },
      spine_thoracic: { x: -3, y: 0, z: 0 },
      spine_cervical: { x: 3, y: 0, z: 0 },
      head: { x: 5, y: 0, z: 0 },
      hip_L: { x: 0, y: 0, z: 4 },
      knee_L: { x: 92, y: 0, z: 0 },
      ankle_L: { x: 35, y: 0, z: 0 },
      hip_R: { x: 0, y: 0, z: -4 },
      knee_R: { x: 92, y: 0, z: 0 },
      ankle_R: { x: 35, y: 0, z: 0 },
      shoulder_L: { x: -38, y: 15, z: -15 },
      lower_arm_L: { x: -95, y: 35, z: 0 },
      shoulder_R: { x: -38, y: -15, z: 15 },
      lower_arm_R: { x: -95, y: -35, z: 0 },
    },
  },

  // 14. Duvara Yaslanma (Wall Lean)
  wall_lean: {
    id: 'wall_lean',
    name: '14. Duvara Yaslanma (Relaxed Wall Lean)',
    category: 'standing',
    description: 'Ayak bilekleri çapraz, kollar göğüste kavuşmuş cool ve rahat yaslanma.',
    position: [0, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: -4, y: 2, z: 2 },
      spine_lumbar: { x: 3, y: 0, z: -2 },
      spine_thoracic: { x: -2, y: 0, z: -2 },
      spine_cervical: { x: 2, y: 4, z: 0 },
      head: { x: 2, y: 6, z: 0 },
      hip_L: { x: -5, y: 0, z: 8 },
      knee_L: { x: 6, y: 0, z: 0 },
      ankle_L: { x: 0, y: 0, z: 0 },
      hip_R: { x: 5, y: 0, z: -4 },
      knee_R: { x: 12, y: 0, z: 0 },
      ankle_R: { x: -6, y: 0, z: 0 },
      shoulder_L: { x: -32, y: 22, z: -15 },
      lower_arm_L: { x: -105, y: 15, z: 0 },
      shoulder_R: { x: -26, y: -22, z: 15 },
      lower_arm_R: { x: -105, y: -15, z: 0 },
    },
  },

  // 15. Kaya Tırmanışı (Rock Climb)
  rock_climb: {
    id: 'rock_climb',
    name: '15. Duvar / Kaya Tırmanışı (Rock Climbing)',
    category: 'action',
    description: 'Yukarı uzanmış eller, duvara kenetlenmiş ayak parmakları ve gergin vücut.',
    position: [0, 0.35, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: -10, y: 8, z: 0 },
      spine_lumbar: { x: -6, y: -4, z: 0 },
      spine_thoracic: { x: -8, y: -4, z: 0 },
      spine_cervical: { x: 25, y: 0, z: 0 },
      head: { x: 25, y: 0, z: 0 },
      hip_L: { x: -65, y: 25, z: 25 },
      knee_L: { x: 105, y: 0, z: 0 },
      ankle_L: { x: -20, y: 0, z: 0 },
      hip_R: { x: -35, y: -20, z: -15 },
      knee_R: { x: 50, y: 0, z: 0 },
      ankle_R: { x: 10, y: 0, z: 0 },
      shoulder_L: { x: -140, y: 15, z: -35 },
      lower_arm_L: { x: -55, y: 15, z: 0 },
      shoulder_R: { x: -160, y: -10, z: 25 },
      lower_arm_R: { x: -75, y: -15, z: 0 },
    },
  },

  // 16. Havada Zıplama (Mid-Air Jump)
  midair_jump: {
    id: 'midair_jump',
    name: '16. Havada Zıplama & Sevinç (Mid-Air Leap)',
    category: 'action',
    description: 'Havada asılı kalmış, kollar coşkuyla açılmış enerjik sıçrama pozu.',
    position: [0, 0.55, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: -5, y: 0, z: 0 },
      spine_lumbar: { x: -6, y: 0, z: 0 },
      spine_thoracic: { x: -8, y: 0, z: 0 },
      spine_cervical: { x: 10, y: 0, z: 0 },
      head: { x: 10, y: 0, z: 0 },
      hip_L: { x: -35, y: 15, z: 18 },
      knee_L: { x: 75, y: 0, z: 0 },
      ankle_L: { x: 25, y: 0, z: 0 },
      hip_R: { x: 15, y: -15, z: -18 },
      knee_R: { x: 65, y: 0, z: 0 },
      ankle_R: { x: 25, y: 0, z: 0 },
      shoulder_L: { x: -125, y: 0, z: -45 },
      lower_arm_L: { x: -35, y: 10, z: 0 },
      shoulder_R: { x: -125, y: 0, z: 45 },
      lower_arm_R: { x: -35, y: -10, z: 0 },
    },
  },

  // 17. Rodin Düşünen Adam (Rodin's Thinker)
  rodin_thinker: {
    id: 'rodin_thinker',
    name: '17. Rodin Düşünen Adam (The Thinker)',
    category: 'artistic',
    description: 'Öne eğilmiş gövde, çeneyi destekleyen sağ el ve diz üzerinde dirsek.',
    position: [0, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 25, y: -10, z: 0 },
      spine_lumbar: { x: 22, y: 8, z: 0 },
      spine_thoracic: { x: 20, y: 8, z: 0 },
      spine_cervical: { x: -15, y: 10, z: 0 },
      head: { x: -10, y: 10, z: 0 },
      hip_L: { x: -95, y: 10, z: 10 },
      knee_L: { x: 105, y: 0, z: 0 },
      ankle_L: { x: -15, y: 0, z: 0 },
      hip_R: { x: -85, y: -12, z: -8 },
      knee_R: { x: 95, y: 0, z: 0 },
      ankle_R: { x: -10, y: 0, z: 0 },
      shoulder_L: { x: -20, y: -10, z: -15 },
      lower_arm_L: { x: -75, y: 15, z: 0 },
      shoulder_R: { x: -65, y: 25, z: 15 },
      lower_arm_R: { x: -115, y: -20, z: 0 },
      wrist_R: { x: 30, y: 0, z: 0 },
    },
  },

  // 18. Zafer & Kutlama (Triumphant Victory)
  triumphant_victory: {
    id: 'triumphant_victory',
    name: '18. Zafer & Kutlama (Triumphant Victory)',
    category: 'action',
    description: 'Göğe kalkmış V şeklinde kollar, geriye hafif bükülü coşkulu göğüs kafesi.',
    position: [0, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: -4, y: 0, z: 0 },
      spine_lumbar: { x: -6, y: 0, z: 0 },
      spine_thoracic: { x: -8, y: 0, z: 0 },
      spine_cervical: { x: 15, y: 0, z: 0 },
      head: { x: 18, y: 0, z: 0 },
      hip_L: { x: 0, y: 0, z: 8 },
      knee_L: { x: 4, y: 0, z: 0 },
      ankle_L: { x: 0, y: 0, z: 0 },
      hip_R: { x: 0, y: 0, z: -8 },
      knee_R: { x: 4, y: 0, z: 0 },
      ankle_R: { x: 0, y: 0, z: 0 },
      shoulder_L: { x: -145, y: 0, z: -35 },
      lower_arm_L: { x: -25, y: 10, z: 0 },
      shoulder_R: { x: -145, y: 0, z: 35 },
      lower_arm_R: { x: -25, y: -10, z: 0 },
    },
  },

  // 19. Bale Arabesk (Ballet Arabesque)
  ballet_arabesque: {
    id: 'ballet_arabesque',
    name: '19. Bale Arabesk (Ballet Arabesque)',
    category: 'artistic',
    description: 'Tek ayak üzerinde kusursuz denge, arkaya uzatılmış bacak ve zarif kollar.',
    position: [0, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 12, y: 0, z: 0 },
      spine_lumbar: { x: -10, y: 0, z: 0 },
      spine_thoracic: { x: -12, y: 0, z: 0 },
      spine_cervical: { x: 5, y: 15, z: 0 },
      head: { x: 5, y: 18, z: 0 },
      hip_L: { x: 0, y: 0, z: 2 },
      knee_L: { x: 2, y: 0, z: 0 },
      ankle_L: { x: 0, y: 0, z: 0 },
      hip_R: { x: 65, y: 0, z: -5 },
      knee_R: { x: 0, y: 0, z: 0 },
      ankle_R: { x: 45, y: 0, z: 0 },
      shoulder_L: { x: -85, y: 10, z: -10 },
      lower_arm_L: { x: -15, y: 5, z: 0 },
      shoulder_R: { x: 25, y: -20, z: 65 },
      lower_arm_R: { x: -20, y: -5, z: 0 },
    },
  },

  // 20. Savaşçı Duruşu Yoga (Warrior II Pose)
  warrior_yoga: {
    id: 'warrior_yoga',
    name: '20. Yoga Savaşçı II (Warrior II Yoga)',
    category: 'sports',
    description: 'Geniş bacak açısı, 90 derece bükülü ön diz ve yatay iki yana açılmış kollar.',
    position: [0, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 0, y: 0, z: 0 },
      spine_lumbar: { x: 0, y: 0, z: 0 },
      spine_thoracic: { x: 0, y: 0, z: 0 },
      spine_cervical: { x: 0, y: 45, z: 0 },
      head: { x: 0, y: 45, z: 0 },
      hip_L: { x: -45, y: 0, z: 35 },
      knee_L: { x: 75, y: 0, z: 0 },
      ankle_L: { x: -25, y: 0, z: 0 },
      hip_R: { x: 10, y: 0, z: -35 },
      knee_R: { x: 0, y: 0, z: 0 },
      ankle_R: { x: 0, y: 0, z: 0 },
      shoulder_L: { x: 0, y: 0, z: -88 },
      lower_arm_L: { x: -10, y: 0, z: 0 },
      shoulder_R: { x: 0, y: 0, z: 88 },
      lower_arm_R: { x: -10, y: 0, z: 0 },
    },
  },

  // 21. Boksör Gardı (Boxer Guard)
  boxer_guard: {
    id: 'boxer_guard',
    name: '21. Boksör Gard Duruşu (Boxer Guard)',
    category: 'action',
    description: 'Yüzü ve çeneyi koruyan sıkı dirsekler ve yumruklar, hafif bükülü yaylanan dizler.',
    position: [0, 0, 0],
    joints: {
      ...DEFAULT_NEUTRAL_POSE.joints,
      pelvis: { x: 5, y: 20, z: 0 },
      spine_lumbar: { x: 8, y: -10, z: 0 },
      spine_thoracic: { x: 10, y: -10, z: 0 },
      spine_cervical: { x: -8, y: 4, z: 0 },
      head: { x: -8, y: 5, z: 0 },
      hip_L: { x: -25, y: 15, z: 12 },
      knee_L: { x: 25, y: 0, z: 0 },
      ankle_L: { x: -10, y: 0, z: 0 },
      hip_R: { x: 10, y: -15, z: -10 },
      knee_R: { x: 30, y: 0, z: 0 },
      ankle_R: { x: 15, y: 0, z: 0 },
      shoulder_L: { x: -45, y: 25, z: -15 },
      lower_arm_L: { x: -110, y: 25, z: 0 },
      wrist_L: { x: 10, y: 0, z: 0 },
      shoulder_R: { x: -40, y: -20, z: 15 },
      lower_arm_R: { x: -115, y: -25, z: 0 },
      wrist_R: { x: 10, y: 0, z: 0 },
    },
  },
};

const STORAGE_KEY = 'skelly_saved_custom_poses_v2';

export function getSavedCustomPoses(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load saved poses:', err);
    return [];
  }
}

export function saveCustomPoseRecord(record: any): any[] {
  try {
    const list = getSavedCustomPoses();
    const updated = [record, ...list.filter((r) => r.id !== record.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save custom pose:', err);
    return getSavedCustomPoses();
  }
}

export function deleteCustomPoseRecord(id: string): any[] {
  try {
    const list = getSavedCustomPoses();
    const filtered = list.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.error('Failed to delete custom pose:', err);
    return getSavedCustomPoses();
  }
}
