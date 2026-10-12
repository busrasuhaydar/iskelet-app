import { JointKey, EulerDegrees } from '../types/skeleton';
import { BUILTIN_POSE_TEMPLATES } from './poseLibrary';
import { ANATOMICAL_JOINTS } from '../scene/jointDefinitions';

export interface AIPoseFigureUpdate {
  figureIndex: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  joints: Partial<Record<JointKey, EulerDegrees>>;
}

export interface AIPoseResponse {
  explanation: string;
  isTargetedEdit: boolean;
  figures: AIPoseFigureUpdate[];
  source: 'gemini-3.8-flash' | 'local_solver';
}

export class AIPoseSolver {
  /**
   * Main entry point: tries server-side Gemini 3.8 Flash first,
   * falls back seamlessly to smart local procedural biomechanics solver when offline or quota is exceeded.
   */
  public static async solvePose(
    prompt: string,
    currentFiguresState: any[],
    forceOffline = false
  ): Promise<AIPoseResponse> {
    const isTargeted = this.detectTargetedEdit(prompt);

    if (!forceOffline) {
      try {
        const response = await fetch('/api/pose-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            currentSceneState: currentFiguresState,
            isTargetedEdit: isTargeted,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.result) {
            return {
              explanation: data.result.explanation || 'Pose calculated by Gemini 3.8 Flash.',
              isTargetedEdit: Boolean(data.result.isTargetedEdit),
              figures: (data.result.figures || []).map((f: any) => ({
                figureIndex: f.figureIndex ?? 0,
                position: f.position,
                rotation: f.rotation,
                joints: this.sanitizeJointAngles(f.joints),
              })),
              source: 'gemini-3.8-flash',
            };
          }
        }
      } catch (err) {
        console.warn('Server AI endpoint unavailable, using local procedural solver:', err);
      }
    }

    // Offline / Local Procedural Biomechanical Engine
    return this.solveLocally(prompt, currentFiguresState, isTargeted);
  }

  /**
   * Detects whether user wants a targeted follow-up edit vs full pose regeneration
   */
  public static detectTargetedEdit(prompt: string): boolean {
    const p = prompt.toLowerCase();

    // Multi-figure composition words should NOT be targeted edits
    if (
      p.includes('sarıl') ||
      p.includes('sarılan') ||
      p.includes('kucak') ||
      p.includes('embrace') ||
      p.includes('hug') ||
      p.includes('iki iskelet') ||
      p.includes('two skeleton') ||
      p.includes('dövüş') ||
      p.includes('duel') ||
      p.includes('dans') ||
      p.includes('dance') ||
      p.includes('el ele') ||
      p.includes('sırt sırta')
    ) {
      return false;
    }

    const targetedPhrases = [
      'raise',
      'lower',
      'lift',
      'bend',
      'turn head',
      'tilt head',
      'open jaw',
      'close jaw',
      'move',
      'adjust',
      'keep everything else',
      'without changing',
      'only',
      'higher',
      'lower',
      'more to the',
      'straighten',
      // Turkish phrases
      'kaldır',
      'indir',
      'bük',
      'çevir',
      'döndür',
      'aç',
      'kapat',
      'kolunu kaldır',
      'kafayı çevir',
      'dizini bük',
      'diğerlerini değiştirme',
      'sadece',
      'biraz daha',
    ];

    return targetedPhrases.some((phrase) => p.includes(phrase));
  }

  /**
   * Smart local heuristic biomechanics engine supporting rich multilingual queries
   */
  private static solveLocally(
    prompt: string,
    currentFiguresState: any[],
    isTargetedEdit: boolean
  ): AIPoseResponse {
    const p = prompt.toLowerCase();

    // 1. Two-figure compositions (Embrace, Hug, Sarılma, Kucaklaşma)
    if (
      p.includes('sarıl') ||
      p.includes('sarılan') ||
      p.includes('kucaklaş') ||
      p.includes('kucaklayan') ||
      p.includes('kucak') ||
      p.includes('embrace') ||
      p.includes('hug') ||
      p.includes('hugging') ||
      (p.includes('iki') && (p.includes('sarıl') || p.includes('kucak'))) ||
      (p.includes('two') && (p.includes('embrace') || p.includes('hug')))
    ) {
      return {
        explanation: 'Solved two-figure authentic human embrace: figures facing each other with arms wrapped around partner back and waist.',
        isTargetedEdit: false,
        figures: [
          {
            figureIndex: 0,
            position: BUILTIN_POSE_TEMPLATES['embrace_A'].position,
            rotation: BUILTIN_POSE_TEMPLATES['embrace_A'].rotation,
            joints: this.sanitizeJointAngles(BUILTIN_POSE_TEMPLATES['embrace_A'].joints as any),
          },
          {
            figureIndex: 1,
            position: BUILTIN_POSE_TEMPLATES['embrace_B'].position,
            rotation: BUILTIN_POSE_TEMPLATES['embrace_B'].rotation,
            joints: this.sanitizeJointAngles(BUILTIN_POSE_TEMPLATES['embrace_B'].joints as any),
          },
        ],
        source: 'local_solver',
      };
    }

    // 2. Combat / Duel / Fight / Martial arts
    if (
      p.includes('dövüş') ||
      p.includes('kılıç') ||
      p.includes('savaş') ||
      p.includes('boks') ||
      p.includes('fight') ||
      p.includes('duel') ||
      p.includes('combat') ||
      p.includes('martial')
    ) {
      return {
        explanation: 'Solved two-figure dynamic combat duel: opposing attacker and defender martial arts stances.',
        isTargetedEdit: false,
        figures: [
          {
            figureIndex: 0,
            position: BUILTIN_POSE_TEMPLATES['duel_A'].position,
            rotation: BUILTIN_POSE_TEMPLATES['duel_A'].rotation,
            joints: this.sanitizeJointAngles(BUILTIN_POSE_TEMPLATES['duel_A'].joints as any),
          },
          {
            figureIndex: 1,
            position: BUILTIN_POSE_TEMPLATES['duel_B'].position,
            rotation: BUILTIN_POSE_TEMPLATES['duel_B'].rotation,
            joints: this.sanitizeJointAngles(BUILTIN_POSE_TEMPLATES['duel_B'].joints as any),
          },
        ],
        source: 'local_solver',
      };
    }

    // 3. Dance / Waltz
    if (p.includes('dans') || p.includes('vals') || p.includes('dance') || p.includes('waltz')) {
      return {
        explanation: 'Composed two figures in classical ballroom dance partnership.',
        isTargetedEdit: false,
        figures: [
          {
            figureIndex: 0,
            position: [-0.22, 0, 0],
            rotation: [0, 80, 0],
            joints: this.sanitizeJointAngles(BUILTIN_POSE_TEMPLATES['dance_waltz'].joints as any),
          },
          {
            figureIndex: 1,
            position: [0.22, 0, 0],
            rotation: [0, -100, 0],
            joints: this.sanitizeJointAngles({
              ...BUILTIN_POSE_TEMPLATES['dance_waltz'].joints,
              shoulder_L: { x: -55, y: 20, z: -25 },
              lower_arm_L: { x: 60, y: 10, z: 0 },
              shoulder_R: { x: -35, y: -15, z: 15 },
              lower_arm_R: { x: 80, y: -20, z: 0 },
            } as any),
          },
        ],
        source: 'local_solver',
      };
    }

    // 4. Holding Hands
    if (p.includes('holding hand') || p.includes('hold hand') || p.includes('el ele') || p.includes('tutuş')) {
      return {
        explanation: 'Positioned figures side-by-side with naturally joined hands.',
        isTargetedEdit: false,
        figures: [
          {
            figureIndex: 0,
            position: [-0.36, 0, 0],
            rotation: [0, 10, 0],
            joints: this.sanitizeJointAngles({
              shoulder_L: { x: -20, y: 15, z: -15 },
              lower_arm_L: { x: 45, y: 20, z: 0 },
            } as any),
          },
          {
            figureIndex: 1,
            position: [0.36, 0, 0],
            rotation: [0, -10, 0],
            joints: this.sanitizeJointAngles({
              shoulder_R: { x: -20, y: -15, z: 15 },
              lower_arm_R: { x: 45, y: -20, z: 0 },
            } as any),
          },
        ],
        source: 'local_solver',
      };
    }

    // 5. Back-to-Back
    if (p.includes('back to back') || p.includes('sırt sırta')) {
      return {
        explanation: 'Composed figures leaning back-to-back with opposing orientations.',
        isTargetedEdit: false,
        figures: [
          {
            figureIndex: 0,
            position: [0, 0, -0.15],
            rotation: [0, 0, 0],
            joints: this.sanitizeJointAngles({
              spine_lumbar: { x: -6, y: 0, z: 0 },
              spine_thoracic: { x: -5, y: 0, z: 0 },
            } as any),
          },
          {
            figureIndex: 1,
            position: [0, 0, 0.15],
            rotation: [0, 180, 0],
            joints: this.sanitizeJointAngles({
              spine_lumbar: { x: -6, y: 0, z: 0 },
              spine_thoracic: { x: -5, y: 0, z: 0 },
            } as any),
          },
        ],
        source: 'local_solver',
      };
    }

    // 6. Targeted Joint Adjustments (English & Turkish)
    if (isTargetedEdit) {
      const updates: AIPoseFigureUpdate[] = [];
      const jointDiffs: Partial<Record<JointKey, EulerDegrees>> = {};

      // Arm raises / lowers
      if (p.includes('left arm') || p.includes('left hand') || p.includes('sol kol') || p.includes('sol el')) {
        if (p.includes('higher') || p.includes('up') || p.includes('raise') || p.includes('lift') || p.includes('kaldır') || p.includes('yukarı')) {
          jointDiffs['shoulder_L'] = { x: -65, y: 15, z: 35 };
          jointDiffs['lower_arm_L'] = { x: 35, y: 20, z: 0 };
        } else if (p.includes('lower') || p.includes('down') || p.includes('indir') || p.includes('aşağı')) {
          jointDiffs['shoulder_L'] = { x: 0, y: 0, z: -25 };
          jointDiffs['lower_arm_L'] = { x: 10, y: 0, z: 0 };
        }
      }

      if (p.includes('right arm') || p.includes('right hand') || p.includes('sağ kol') || p.includes('sağ el')) {
        if (p.includes('higher') || p.includes('up') || p.includes('raise') || p.includes('lift') || p.includes('kaldır') || p.includes('yukarı')) {
          jointDiffs['shoulder_R'] = { x: -65, y: -15, z: -35 };
          jointDiffs['lower_arm_R'] = { x: 35, y: -20, z: 0 };
        } else if (p.includes('lower') || p.includes('down') || p.includes('indir') || p.includes('aşağı')) {
          jointDiffs['shoulder_R'] = { x: 0, y: 0, z: 25 };
          jointDiffs['lower_arm_R'] = { x: 10, y: 0, z: 0 };
        }
      }

      // Head turns / tilts
      if (p.includes('head') || p.includes('skull') || p.includes('kafa') || p.includes('baş')) {
        if (p.includes('left') || p.includes('sola')) {
          jointDiffs['head'] = { x: 0, y: 35, z: 5 };
        } else if (p.includes('right') || p.includes('sağa') || p.includes('other skeleton') || p.includes('diğer iskelet') || p.includes('towards')) {
          jointDiffs['head'] = { x: 0, y: -35, z: -5 };
        } else if (p.includes('camera') || p.includes('kamera') || p.includes('forward') || p.includes('öne')) {
          jointDiffs['head'] = { x: 5, y: 0, z: 0 };
        } else if (p.includes('up') || p.includes('yukarı')) {
          jointDiffs['head'] = { x: 35, y: 0, z: 0 };
        } else if (p.includes('down') || p.includes('aşağı')) {
          jointDiffs['head'] = { x: -30, y: 0, z: 0 };
        }
      }

      // Knee bends
      if (p.includes('right knee') || p.includes('sağ diz') || p.includes('sağ bacak')) {
        jointDiffs['knee_R'] = { x: 85, y: 0, z: 0 };
      }
      if (p.includes('left knee') || p.includes('sol diz') || p.includes('sol bacak')) {
        jointDiffs['knee_L'] = { x: 85, y: 0, z: 0 };
      }

      // Jaw open/close
      if (p.includes('jaw') || p.includes('mouth') || p.includes('çene') || p.includes('ağız')) {
        if (p.includes('close') || p.includes('kapat')) {
          jointDiffs['jaw'] = { x: 0, y: 0, z: 0 };
        } else {
          jointDiffs['jaw'] = { x: 28, y: 0, z: 0 };
        }
      }

      if (Object.keys(jointDiffs).length > 0) {
        updates.push({
          figureIndex: 0,
          joints: this.sanitizeJointAngles(jointDiffs as any),
        });

        return {
          explanation: `Targeted adjustment applied to ${Object.keys(jointDiffs).join(', ')}. All other joints preserved.`,
          isTargetedEdit: true,
          figures: updates,
          source: 'local_solver',
        };
      }
    }

    // 7. Single-Figure Stances (Turkish & English)
    // Seated on ground / Floor
    if (
      p.includes('sit') ||
      p.includes('seated') ||
      p.includes('floor') ||
      p.includes('otur') ||
      p.includes('oturan') ||
      p.includes('yerde') ||
      p.includes('bağdaş')
    ) {
      return {
        explanation: 'Solved seated ground posture with bent knees, supporting hand, and counterpoised torso.',
        isTargetedEdit: false,
        figures: [
          {
            figureIndex: 0,
            position: [0, -0.65, 0],
            rotation: [0, -15, 0],
            joints: this.sanitizeJointAngles(BUILTIN_POSE_TEMPLATES['seated_lean_back'].joints as any),
          },
        ],
        source: 'local_solver',
      };
    }

    // Kneeling
    if (p.includes('kneel') || p.includes('kneeling') || p.includes('diz çök') || p.includes('çömel')) {
      return {
        explanation: 'Configured kneeling pose with knee ground support and upright vertebral column.',
        isTargetedEdit: false,
        figures: [
          {
            figureIndex: 0,
            position: [0, -0.45, 0],
            joints: this.sanitizeJointAngles(BUILTIN_POSE_TEMPLATES['kneeling'].joints as any),
          },
        ],
        source: 'local_solver',
      };
    }

    // Running / Sprint
    if (p.includes('run') || p.includes('sprint') || p.includes('koş') || p.includes('koşan')) {
      return {
        explanation: 'Applied athletic running stride with reciprocating contralateral limbs.',
        isTargetedEdit: false,
        figures: [
          {
            figureIndex: 0,
            joints: this.sanitizeJointAngles(BUILTIN_POSE_TEMPLATES['running'].joints as any),
          },
        ],
        source: 'local_solver',
      };
    }

    // Walking
    if (p.includes('walk') || p.includes('walking') || p.includes('yürü') || p.includes('yürüyen')) {
      return {
        explanation: 'Configured natural anatomical walk cycle stance.',
        isTargetedEdit: false,
        figures: [
          {
            figureIndex: 0,
            joints: this.sanitizeJointAngles(BUILTIN_POSE_TEMPLATES['walking'].joints as any),
          },
        ],
        source: 'local_solver',
      };
    }

    // Rodin Thinker / Pondering
    if (p.includes('think') || p.includes('thinker') || p.includes('düşünür') || p.includes('düşünen')) {
      return {
        explanation: 'Configured Rodin Thinker seated contemplation pose with elbow resting on knee.',
        isTargetedEdit: false,
        figures: [
          {
            figureIndex: 0,
            position: [0, -0.4, 0],
            joints: this.sanitizeJointAngles(BUILTIN_POSE_TEMPLATES['the_thinker'].joints as any),
          },
        ],
        source: 'local_solver',
      };
    }

    // Reaching / Skyward
    if (p.includes('reach') || p.includes('sky') || p.includes('uzan') || p.includes('göğe')) {
      return {
        explanation: 'Configured upward reaching posture with extended spine and elevated clavicles.',
        isTargetedEdit: false,
        figures: [
          {
            figureIndex: 0,
            joints: this.sanitizeJointAngles(BUILTIN_POSE_TEMPLATES['reaching'].joints as any),
          },
        ],
        source: 'local_solver',
      };
    }

    // Crossed arms
    if ((p.includes('cross') && p.includes('arm')) || (p.includes('kollar') && p.includes('bağla'))) {
      return {
        explanation: 'Configured crossed arms posture across upper ribcage.',
        isTargetedEdit: false,
        figures: [
          {
            figureIndex: 0,
            joints: this.sanitizeJointAngles(BUILTIN_POSE_TEMPLATES['crossed_arms'].joints as any),
          },
        ],
        source: 'local_solver',
      };
    }

    // Default: Classical contrapposto stance
    return {
      explanation: `Interpreted "${prompt}" as a classical dynamic anatomical stance.`,
      isTargetedEdit: false,
      figures: [
        {
          figureIndex: 0,
          joints: this.sanitizeJointAngles(BUILTIN_POSE_TEMPLATES['contrapposto'].joints as any),
        },
      ],
      source: 'local_solver',
    };
  }

  /**
   * Sanitizes all angles returned by Gemini or heuristic generators to guarantee
   * biomechanical validity within true human joint limits.
   */
  public static sanitizeJointAngles(
    joints?: Partial<Record<JointKey, EulerDegrees | [number, number, number]>>
  ): Partial<Record<JointKey, EulerDegrees>> {
    if (!joints) return {};
    const sanitized: Partial<Record<JointKey, EulerDegrees>> = {};

    Object.entries(joints).forEach(([key, val]) => {
      const jKey = key as JointKey;
      const def = ANATOMICAL_JOINTS[jKey];
      if (!def) return;

      let x = 0;
      let y = 0;
      let z = 0;

      if (Array.isArray(val)) {
        x = val[0] || 0;
        y = val[1] || 0;
        z = val[2] || 0;
      } else if (typeof val === 'object' && val !== null) {
        x = val.x || 0;
        y = val.y || 0;
        z = val.z || 0;
      }

      // Enforce anatomical limits
      if (def.limits) {
        x = Math.max(def.limits.min.x, Math.min(def.limits.max.x, x));
        y = Math.max(def.limits.min.y, Math.min(def.limits.max.y, y));
        z = Math.max(def.limits.min.z, Math.min(def.limits.max.z, z));
      }

      sanitized[jKey] = { x, y, z };
    });

    return sanitized;
  }
}
