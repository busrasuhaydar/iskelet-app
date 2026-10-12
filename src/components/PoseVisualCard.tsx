import React from 'react';
import { Sparkles, Users } from 'lucide-react';

interface PoseVisualCardProps {
  id: string;
  name: string;
  category: string;
  description: string;
  onApply: () => void;
}

export const PoseVisualCard: React.FC<PoseVisualCardProps> = ({
  id,
  name,
  category,
  description,
  onApply,
}) => {
  // Render distinct SVG pose silhouette diagrams
  const renderPosePreview = () => {
    switch (id) {
      case 'embrace_A':
      case 'embrace_B':
        return (
          // Two figures embracing
          <svg viewBox="0 0 100 80" className="w-full h-24 stroke-cyan-400 fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
            {/* Figure 1 (Left) */}
            <circle cx="42" cy="18" r="6" className="fill-cyan-400/20" />
            <line x1="42" y1="24" x2="40" y2="48" />
            {/* Arms wrapping Figure 2 */}
            <path d="M 40 28 Q 50 25 58 32 Q 62 38 60 45" />
            <path d="M 40 34 Q 52 38 58 42" />
            {/* Legs */}
            <line x1="40" y1="48" x2="35" y2="72" />
            <line x1="40" y1="48" x2="43" y2="72" />

            {/* Figure 2 (Right, Embracing) */}
            <circle cx="58" cy="20" r="5.5" className="fill-rose-400/20 stroke-rose-400" />
            <line x1="58" y1="25.5" x2="60" y2="48" className="stroke-rose-400" />
            {/* Arms wrapping Figure 1 */}
            <path d="M 60 28 Q 48 24 40 30 Q 36 36 38 42" className="stroke-rose-400" />
            <path d="M 60 35 Q 46 36 40 40" className="stroke-rose-400" />
            {/* Legs */}
            <line x1="60" y1="48" x2="57" y2="72" className="stroke-rose-400" />
            <line x1="60" y1="48" x2="65" y2="72" className="stroke-rose-400" />
          </svg>
        );

      case 'duel_A':
      case 'duel_B':
        return (
          // Two Figures Combat Duel
          <svg viewBox="0 0 100 80" className="w-full h-24 stroke-cyan-400 fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
            {/* Fighter 1 (Thrust) */}
            <circle cx="34" cy="22" r="5.5" className="fill-cyan-400/20" />
            <line x1="34" y1="27.5" x2="38" y2="48" />
            <path d="M 36 32 L 56 30 L 64 30" />
            <path d="M 36 34 L 26 40 L 22 48" />
            <path d="M 38 48 L 48 54 L 52 72" />
            <path d="M 38 48 L 28 58 L 24 72" />
            {/* Fighter 2 (Parry Guard) */}
            <circle cx="68" cy="24" r="5.5" className="fill-rose-400/20 stroke-rose-400" />
            <line x1="68" y1="29.5" x2="66" y2="48" className="stroke-rose-400" />
            <path d="M 67 34 L 58 28 L 56 22" className="stroke-rose-400" />
            <path d="M 67 36 L 76 42 L 78 50" className="stroke-rose-400" />
            <path d="M 66 48 L 60 56 L 56 72" className="stroke-rose-400" />
            <path d="M 66 48 L 74 58 L 76 72" className="stroke-rose-400" />
          </svg>
        );

      case 'dance_waltz':
        return (
          // Ballroom Waltz Dance
          <svg viewBox="0 0 100 80" className="w-full h-24 stroke-cyan-400 fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
            <circle cx="42" cy="18" r="5.5" className="fill-cyan-400/20" />
            <line x1="42" y1="23.5" x2="40" y2="48" />
            <circle cx="58" cy="20" r="5.5" className="fill-purple-400/20 stroke-purple-400" />
            <line x1="58" y1="25.5" x2="60" y2="48" className="stroke-purple-400" />
            {/* Joined high hands */}
            <path d="M 41 28 L 50 18 L 59 30" />
            {/* Waist hold */}
            <path d="M 40 34 L 52 36 L 60 36" className="stroke-cyan-400" />
            <line x1="40" y1="48" x2="36" y2="72" />
            <line x1="40" y1="48" x2="46" y2="72" />
            <line x1="60" y1="48" x2="56" y2="72" className="stroke-purple-400" />
            <line x1="60" y1="48" x2="64" y2="72" className="stroke-purple-400" />
          </svg>
        );

      case 'seated_lean_back':
        return (
          // Seated leaning back on arm, knees bent, one hand to head
          <svg viewBox="0 0 100 80" className="w-full h-24 stroke-cyan-400 fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
            {/* Ground */}
            <line x1="10" y1="72" x2="90" y2="72" className="stroke-slate-700 stroke-[1]" />
            {/* Head & Spine leaning back */}
            <circle cx="36" cy="22" r="6" className="fill-cyan-400/20" />
            <line x1="36" y1="28" x2="48" y2="60" />
            {/* Arm 1 supporting weight behind */}
            <path d="M 42 36 L 25 50 L 22 72" />
            {/* Arm 2 hand to skull */}
            <path d="M 40 34 L 38 18 L 33 22" />
            {/* Bent knees on floor */}
            <path d="M 48 60 L 68 45 L 75 72" />
            <path d="M 48 60 L 62 48 L 70 72" />
          </svg>
        );

      case 'the_thinker':
        return (
          // Seated Rodin Thinker
          <svg viewBox="0 0 100 80" className="w-full h-24 stroke-cyan-400 fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
            {/* Plinth */}
            <rect x="25" y="52" width="28" height="20" className="stroke-slate-700 stroke-[1] fill-white/5" />
            {/* Head bent forward */}
            <circle cx="48" cy="24" r="6" className="fill-cyan-400/20" />
            <path d="M 46 29 Q 40 40 38 52" />
            {/* Arm with elbow on knee & fist to chin */}
            <path d="M 42 36 L 60 48 L 50 30" />
            {/* Other arm */}
            <path d="M 38 38 L 46 54 L 48 65" />
            {/* Legs */}
            <path d="M 38 52 L 62 48 L 65 72" />
            <path d="M 38 52 L 52 54 L 54 72" />
          </svg>
        );

      case 'neutral_t':
        return (
          // Anatomical T-Pose
          <svg viewBox="0 0 100 80" className="w-full h-24 stroke-cyan-400 fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
            <circle cx="50" cy="16" r="6" className="fill-cyan-400/20" />
            <line x1="50" y1="22" x2="50" y2="48" />
            <line x1="18" y1="28" x2="82" y2="28" />
            <line x1="50" y1="48" x2="42" y2="74" />
            <line x1="50" y1="48" x2="58" y2="74" />
          </svg>
        );

      case 'contrapposto':
        return (
          // Classical Contrapposto S-Curve
          <svg viewBox="0 0 100 80" className="w-full h-24 stroke-cyan-400 fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
            <circle cx="52" cy="16" r="6" className="fill-cyan-400/20" />
            <path d="M 52 22 Q 47 34 51 46" />
            <path d="M 49 26 L 38 42 L 40 56" />
            <path d="M 52 26 L 63 38 L 64 52" />
            {/* Weight bearing right leg & relaxed left leg */}
            <line x1="51" y1="46" x2="53" y2="74" />
            <path d="M 51 46 Q 44 58 43 74" />
          </svg>
        );

      case 'running':
        return (
          // Dynamic Running Sprint
          <svg viewBox="0 0 100 80" className="w-full h-24 stroke-cyan-400 fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
            <circle cx="58" cy="18" r="6" className="fill-cyan-400/20" />
            <line x1="56" y1="23" x2="48" y2="45" />
            {/* Counter-pumping arms */}
            <path d="M 54 27 L 70 34 L 78 28" />
            <path d="M 52 28 L 38 32 L 32 44" />
            {/* Forward driving leg & rear extension leg */}
            <path d="M 48 45 L 68 46 L 64 68" />
            <path d="M 48 45 L 32 54 L 20 62" />
          </svg>
        );

      case 'kneeling':
        return (
          // Kneeling Reverence
          <svg viewBox="0 0 100 80" className="w-full h-24 stroke-cyan-400 fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
            <line x1="15" y1="72" x2="85" y2="72" className="stroke-slate-700 stroke-[1]" />
            <circle cx="50" cy="20" r="6" className="fill-cyan-400/20" />
            <line x1="50" y1="26" x2="50" y2="48" />
            <path d="M 50 30 L 42 45 L 46 62" />
            <path d="M 50 30 L 58 45 L 54 62" />
            {/* Folded knees on floor */}
            <path d="M 50 48 L 52 68 L 36 72" />
            <path d="M 50 48 L 48 68 L 34 72" />
          </svg>
        );

      default:
        // Natural relaxed standing
        return (
          <svg viewBox="0 0 100 80" className="w-full h-24 stroke-cyan-400 fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
            <circle cx="50" cy="16" r="6" className="fill-cyan-400/20" />
            <line x1="50" y1="22" x2="50" y2="48" />
            <path d="M 50 26 L 36 42 L 34 56" />
            <path d="M 50 26 L 64 42 L 66 56" />
            <line x1="50" y1="48" x2="44" y2="74" />
            <line x1="50" y1="48" x2="56" y2="74" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-[#121622] hover:bg-[#181d2c] border border-white/10 hover:border-cyan-500/40 rounded-xl p-3 flex flex-col justify-between transition-all group shadow-sm">
      <div className="space-y-2">
        {/* Silhouette Preview Container */}
        <div className="bg-black/40 rounded-lg p-2 border border-white/5 flex items-center justify-center relative overflow-hidden group-hover:border-cyan-500/20 transition-colors">
          {renderPosePreview()}
          {category === 'composition' && (
            <div className="absolute top-2 right-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
              <Users className="w-3 h-3" />
              <span>2 Figures</span>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
              {name}
            </h4>
            <span className="text-[10px] text-slate-500 font-mono uppercase">{category}</span>
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
            {description}
          </p>
        </div>
      </div>

      <button
        onClick={onApply}
        className="w-full mt-3 py-1.5 px-3 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 hover:border-cyan-400/50 rounded-lg text-xs font-semibold text-cyan-300 flex items-center justify-center gap-1.5 transition-all shadow-sm"
      >
        <Sparkles className="w-3 h-3 text-cyan-400" />
        <span>Apply Pose</span>
      </button>
    </div>
  );
};
