import React from 'react';
import {
  RotateCcw,
  Undo2,
  Redo2,
  Sparkles,
  ArrowLeftRight,
  ShieldAlert,
  Sliders,
  Maximize2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { SkeletonRig } from '../scene/SkeletonRig';
import { JointKey } from '../types/skeleton';
import { BUILTIN_POSE_TEMPLATES } from '../services/poseLibrary';

interface SkellyPoseBarProps {
  activeRig: SkeletonRig | null;
  selectedJointKey: JointKey | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onApplyPoseTemplate: (templateId: string) => void;
  onResetJoint: (key: JointKey) => void;
  onResetLimb: (category: string) => void;
  onResetAllPose: () => void;
  onMirrorPose: (sourceSide: 'L' | 'R') => void;
  onNudgeAngle: (axis: 'x' | 'y' | 'z', deltaDeg: number) => void;
  onToggleLimits: (figureId: string) => void;
}

export const SkellyPoseBar: React.FC<SkellyPoseBarProps> = ({
  activeRig,
  selectedJointKey,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onApplyPoseTemplate,
  onResetJoint,
  onResetLimb,
  onResetAllPose,
  onMirrorPose,
  onNudgeAngle,
  onToggleLimits,
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scrollPresets = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -240 : 240,
        behavior: 'smooth',
      });
    }
  };

  const posePresets = Object.values(BUILTIN_POSE_TEMPLATES);

  return (
    <footer className="bg-[#10121a]/95 border-t border-cyan-500/20 px-3 py-2 z-20 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        
        {/* Left Section: Pose Quick Actions & History */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 lg:pb-0">
          {/* Undo / Redo */}
          <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Geri Al (Undo)"
              className="p-1.5 hover:text-cyan-300 text-slate-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors rounded"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="İleri Al (Redo)"
              className="p-1.5 hover:text-cyan-300 text-slate-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors rounded"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset Buttons */}
          {selectedJointKey && (
            <button
              onClick={() => onResetJoint(selectedJointKey)}
              title="Seçili Eklemi Sıfırla"
              className="px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Eklemi Sıfırla</span>
            </button>
          )}

          <button
            onClick={onResetAllPose}
            title="Tüm İskeleti Nötr Anatomik Duruşa Sıfırla"
            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
          >
            <RotateCcw className="w-3 h-3 text-cyan-400" />
            <span>Nötr Duruş (T-Pose)</span>
          </button>

          {/* Symmetry Mirroring */}
          <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10 text-xs">
            <button
              onClick={() => onMirrorPose('L')}
              title="Sol Tarafı Sağa Aynala (L → R)"
              className="px-2 py-1 hover:bg-white/10 text-slate-300 hover:text-cyan-300 rounded transition-colors flex items-center gap-1"
            >
              <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
              <span>Sol → Sağ</span>
            </button>
            <span className="text-white/20">|</span>
            <button
              onClick={() => onMirrorPose('R')}
              title="Sağ Tarafı Sola Aynala (R → L)"
              className="px-2 py-1 hover:bg-white/10 text-slate-300 hover:text-cyan-300 rounded transition-colors flex items-center gap-1"
            >
              <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
              <span>Sağ → Sol</span>
            </button>
          </div>

          {/* Limits Enforced Toggle */}
          {activeRig && (
            <button
              onClick={() => onToggleLimits(activeRig.id)}
              title={activeRig.enforceJointLimits ? 'Anatomik Eklem Limitleri Aktif' : 'Serbest 360° Rotasyon'}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors shrink-0 ${
                activeRig.enforceJointLimits
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>{activeRig.enforceJointLimits ? 'Limitler: Aktif' : 'Limitler: Serbest'}</span>
            </button>
          )}

          {/* Quick Nudge Angle for Selected Bone */}
          {selectedJointKey && (
            <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/10 text-xs">
              <span className="text-[10px] text-slate-400">Hızlı Açı:</span>
              <button
                onClick={() => onNudgeAngle('x', 15)}
                className="px-1.5 py-0.5 bg-white/5 hover:bg-white/15 rounded text-[11px] text-cyan-300 font-mono"
                title="Pitch +15°"
              >
                +15°
              </button>
              <button
                onClick={() => onNudgeAngle('x', -15)}
                className="px-1.5 py-0.5 bg-white/5 hover:bg-white/15 rounded text-[11px] text-cyan-300 font-mono"
                title="Pitch -15°"
              >
                -15°
              </button>
            </div>
          )}
        </div>

        {/* Center/Right Section: Skelly-Style Instant Pose Library Bar */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 max-w-full">
          <button
            onClick={() => scrollPresets('left')}
            className="p-1 bg-black/40 hover:bg-white/10 rounded border border-white/10 text-slate-400 hover:text-white shrink-0"
            title="Sola Kaydır"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div
            ref={scrollRef}
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 flex-1"
          >
            {posePresets.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => onApplyPoseTemplate(tpl.id)}
                className="px-2.5 py-1.5 bg-gradient-to-b from-white/10 to-white/5 hover:from-cyan-500/20 hover:to-blue-600/20 border border-white/10 hover:border-cyan-500/40 rounded-lg text-xs text-slate-200 hover:text-cyan-200 font-medium shrink-0 flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span className="text-cyan-400">✦</span>
                <span className="truncate">{tpl.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollPresets('right')}
            className="p-1 bg-black/40 hover:bg-white/10 rounded border border-white/10 text-slate-400 hover:text-white shrink-0"
            title="Sağa Kaydır"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
