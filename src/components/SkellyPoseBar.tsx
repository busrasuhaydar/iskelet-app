import React, { useState, useRef } from 'react';
import {
  RotateCcw,
  Undo2,
  Redo2,
  Sparkles,
  ArrowLeftRight,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Square,
  Repeat,
  Compass,
  Heart,
  Film,
  Activity,
} from 'lucide-react';
import { SkeletonRig } from '../scene/SkeletonRig';
import { JointKey, AnimationPlayerState } from '../types/skeleton';
import { BUILTIN_POSE_TEMPLATES } from '../services/poseLibrary';
import { MOTION_CAPTURE_CLIPS } from '../services/motionCaptureData';

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

  // Animation Studio props
  animationState?: AnimationPlayerState;
  onPlayAnimation?: (clipId: string) => void;
  onPauseAnimation?: () => void;
  onResumeAnimation?: () => void;
  onStopAnimation?: () => void;
  onSeekAnimation?: (time: number) => void;
  onSetAnimationSpeed?: (speed: number) => void;
  onToggleRootMotion?: (enable: boolean) => void;
  onToggleLoop?: (loop: boolean) => void;
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
  animationState,
  onPlayAnimation,
  onPauseAnimation,
  onResumeAnimation,
  onStopAnimation,
  onSeekAnimation,
  onSetAnimationSpeed,
  onToggleRootMotion,
  onToggleLoop,
}) => {
  const [activeBottomMode, setActiveBottomMode] = useState<'poses' | 'animations'>('poses');
  const scrollRef = useRef<HTMLDivElement>(null);
  const animScrollRef = useRef<HTMLDivElement>(null);

  const scrollPresets = (direction: 'left' | 'right') => {
    const target = activeBottomMode === 'poses' ? scrollRef.current : animScrollRef.current;
    if (target) {
      target.scrollBy({
        left: direction === 'left' ? -260 : 260,
        behavior: 'smooth',
      });
    }
  };

  const posePresets = Object.values(BUILTIN_POSE_TEMPLATES);
  const motionClips = Object.values(MOTION_CAPTURE_CLIPS);

  const isPlaying = animationState?.isPlaying || false;
  const currentTime = animationState?.currentTime || 0;
  const duration = animationState?.duration || 1;
  const currentClipId = animationState?.currentClipId || null;
  const speed = animationState?.playbackSpeed || 1.0;
  const loop = animationState?.loop ?? true;
  const rootMotion = animationState?.rootMotion ?? true;

  return (
    <footer className="bg-[#10121a]/95 border-t border-cyan-500/20 px-3 py-2 z-20 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col gap-2">
        {/* Top Control Bar: Mode Toggle + Quick Actions + Animation Timeline */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
          {/* Studio Mode Selector: Poses vs Motion-Capture Animations */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-black/50 p-0.5 rounded-lg border border-white/10">
              <button
                onClick={() => setActiveBottomMode('poses')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeBottomMode === 'poses'
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>21 Anatomik Poz</span>
              </button>
              <button
                onClick={() => setActiveBottomMode('animations')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeBottomMode === 'animations'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>21 Mocap Animasyon</span>
              </button>
            </div>

            {/* Quick Two Character Hug Action */}
            <button
              onClick={() => onPlayAnimation?.('two_character_hug')}
              title="İki İskeletin Birbirine Sarılması (Coordinated Hug Interaction)"
              className="px-2.5 py-1 bg-gradient-to-r from-rose-500/20 to-pink-500/20 hover:from-rose-500/30 hover:to-pink-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/40" />
              <span>❤️ Kucaklaşma (Hug)</span>
            </button>
          </div>

          {/* Center: Animation Player Controls (Visible when animation active or in animation mode) */}
          {activeBottomMode === 'animations' && (
            <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded-xl border border-pink-500/30 flex-1 max-w-xl">
              {/* Play / Pause */}
              <button
                onClick={() => {
                  if (isPlaying) {
                    onPauseAnimation?.();
                  } else if (currentClipId) {
                    onResumeAnimation?.();
                  } else {
                    onPlayAnimation?.('natural_walking');
                  }
                }}
                className={`p-1.5 rounded-lg transition-all ${
                  isPlaying
                    ? 'bg-amber-500 text-black hover:bg-amber-400'
                    : 'bg-emerald-500 text-black hover:bg-emerald-400'
                }`}
                title={isPlaying ? 'Duraklat' : 'Oynat'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-black" />}
              </button>

              {/* Stop */}
              <button
                onClick={onStopAnimation}
                disabled={!currentClipId}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-300 disabled:opacity-30 rounded-lg transition-colors"
                title="Durdur ve Sıfırla"
              >
                <Square className="w-3.5 h-3.5" />
              </button>

              {/* Scrubber slider */}
              <div className="flex-1 flex items-center gap-2">
                <span className="font-mono text-[10px] text-cyan-300 w-10 text-right">
                  {currentTime.toFixed(2)}s
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={0.01}
                  value={currentTime}
                  onChange={(e) => onSeekAnimation?.(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-400"
                />
                <span className="font-mono text-[10px] text-slate-400 w-10">
                  {duration.toFixed(2)}s
                </span>
              </div>

              {/* Speed Selector */}
              <div className="flex items-center gap-1 text-[10px]">
                {[0.5, 1.0, 1.5, 2.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => onSetAnimationSpeed?.(s)}
                    className={`px-1.5 py-0.5 rounded font-mono ${
                      speed === s
                        ? 'bg-cyan-500 text-black font-bold'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Root Motion Toggle */}
              <button
                onClick={() => onToggleRootMotion?.(!rootMotion)}
                className={`p-1.5 rounded transition-colors ${
                  rootMotion ? 'text-cyan-400 bg-cyan-500/20' : 'text-slate-400 hover:text-white'
                }`}
                title={rootMotion ? 'Kök Hareketi: Açık (Dünya Hareketi)' : 'Kök Hareketi: Kapalı (Yerinde)'}
              >
                <Compass className="w-3.5 h-3.5" />
              </button>

              {/* Loop Toggle */}
              <button
                onClick={() => onToggleLoop?.(!loop)}
                className={`p-1.5 rounded transition-colors ${
                  loop ? 'text-pink-400 bg-pink-500/20' : 'text-slate-400 hover:text-white'
                }`}
                title={loop ? 'Sonsuz Döngü Aktif' : 'Tek Sefer Oynat'}
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Right Section: Undo / Redo & Pose Utility Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
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

            {/* Reset Joint / T-Pose */}
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
              <span>Nötr Duruş</span>
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

            {/* Limits Toggle */}
            {activeRig && (
              <button
                onClick={() => onToggleLimits(activeRig.id)}
                title={
                  activeRig.enforceJointLimits
                    ? 'Anatomik Eklem Limitleri Aktif'
                    : 'Serbest 360° Rotasyon'
                }
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
          </div>
        </div>

        {/* Bottom Carousel: Poses OR Motion-Capture Clips */}
        <div className="flex items-center gap-1.5 min-w-0 max-w-full">
          <button
            onClick={() => scrollPresets('left')}
            className="p-1.5 bg-black/40 hover:bg-white/10 rounded-lg border border-white/10 text-slate-400 hover:text-white shrink-0 transition-colors"
            title="Sola Kaydır"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Mode 1: 21 Anatomically Corrected Preset Poses */}
          {activeBottomMode === 'poses' && (
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
                  <span className="text-cyan-400 text-[11px]">✦</span>
                  <span className="truncate">{tpl.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Mode 2: 21 Verified Motion-Capture Animations */}
          {activeBottomMode === 'animations' && (
            <div
              ref={animScrollRef}
              className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 flex-1"
            >
              {motionClips.map((clip) => {
                const isSelected = currentClipId === clip.id;
                return (
                  <button
                    key={clip.id}
                    onClick={() => onPlayAnimation?.(clip.id)}
                    className={`px-2.5 py-1.5 border rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all shadow-sm ${
                      isSelected && isPlaying
                        ? 'bg-gradient-to-r from-pink-500/30 to-purple-600/30 text-pink-200 border-pink-400 ring-1 ring-pink-400/50'
                        : isSelected
                        ? 'bg-white/15 text-white border-cyan-400'
                        : 'bg-gradient-to-b from-white/10 to-white/5 hover:from-pink-500/20 hover:to-purple-600/20 text-slate-200 hover:text-pink-200 border-white/10 hover:border-pink-500/40'
                    }`}
                  >
                    <Activity className={`w-3 h-3 ${isSelected ? 'text-pink-400 animate-pulse' : 'text-slate-400'}`} />
                    <span className="truncate">{clip.name}</span>
                    <span className="text-[10px] opacity-60 font-mono">({clip.duration}s)</span>
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={() => scrollPresets('right')}
            className="p-1.5 bg-black/40 hover:bg-white/10 rounded-lg border border-white/10 text-slate-400 hover:text-white shrink-0 transition-colors"
            title="Sağa Kaydır"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
