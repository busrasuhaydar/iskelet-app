import React, { useState } from 'react';
import {
  RotateCcw,
  Sparkles,
  Sun,
  Camera as CameraIcon,
  Maximize2,
  Copy,
  Check,
  Eye,
  Sliders,
  BookOpen,
} from 'lucide-react';
import { SkeletonRig } from '../scene/SkeletonRig';
import { JointKey, EulerDegrees, MaterialSettings, LightingStudioState } from '../types/skeleton';
import { ANATOMICAL_JOINTS, CHROME_MATERIAL_PRESETS } from '../scene/jointDefinitions';
import { BUILTIN_POSE_TEMPLATES } from '../services/poseLibrary';
import { PoseVisualCard } from './PoseVisualCard';

interface RightPanelProps {
  activeRig: SkeletonRig | null;
  selectedJointKey: JointKey | null;
  lightingState: LightingStudioState;
  activeTab: 'viewport' | 'materials' | 'lighting' | 'library' | 'tests';
  onUpdateJointRotation: (key: JointKey, angles: EulerDegrees) => void;
  onResetJoint: (key: JointKey) => void;
  onResetLimb: (category: any) => void;
  onResetAllPose: () => void;
  onMirrorPose: (fromSide: 'L' | 'R') => void;
  onUpdateMaterial: (settings: MaterialSettings) => void;
  onApplyLightingPreset: (presetId: string) => void;
  onUpdateLighting: (state: LightingStudioState) => void;
  onSetCameraView: (view: 'front' | 'back' | 'left' | 'right' | 'top' | 'three_quarter' | 'reset') => void;
  onFocusSelection: () => void;
  onToggleOrtho: (ortho: boolean) => void;
  onSetExposure: (exp: number) => void;
  onApplyPoseTemplate: (templateId: string) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  activeRig,
  selectedJointKey,
  lightingState,
  activeTab,
  onUpdateJointRotation,
  onResetJoint,
  onResetLimb,
  onResetAllPose,
  onMirrorPose,
  onUpdateMaterial,
  onApplyLightingPreset,
  onUpdateLighting,
  onSetCameraView,
  onFocusSelection,
  onToggleOrtho,
  onSetExposure,
  onApplyPoseTemplate,
}) => {
  const [internalTab, setInternalTab] = useState<'joint' | 'poses' | 'material' | 'lighting' | 'camera'>(
    activeTab === 'materials'
      ? 'material'
      : activeTab === 'lighting'
      ? 'lighting'
      : activeTab === 'library'
      ? 'poses'
      : 'joint'
  );

  // Sync tab with header when header clicks materials, lighting, or library
  React.useEffect(() => {
    if (activeTab === 'materials') setInternalTab('material');
    if (activeTab === 'lighting') setInternalTab('lighting');
    if (activeTab === 'library') setInternalTab('poses');
    if (activeTab === 'viewport') setInternalTab('joint');
  }, [activeTab]);

  const [poseFilter, setPoseFilter] = useState<'all' | 'neutral' | 'classical' | 'action' | 'ground' | 'composition'>('all');
  const [copiedRotation, setCopiedRotation] = useState<EulerDegrees | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Material state
  const currentMaterial = activeRig
    ? {
        name: 'Custom',
        metalness: activeRig.material.metalness,
        roughness: activeRig.material.roughness,
        color: `#${activeRig.material.color.getHexString()}`,
        envMapIntensity: activeRig.material.envMapIntensity,
        clearcoat: activeRig.material.clearcoat,
        clearcoatRoughness: activeRig.material.clearcoatRoughness,
        iridescence: activeRig.material.iridescence,
        iridescenceIOR: activeRig.material.iridescenceIOR,
        iridescenceThicknessMin: activeRig.material.iridescenceThicknessRange[0],
        iridescenceThicknessMax: activeRig.material.iridescenceThicknessRange[1],
      }
    : CHROME_MATERIAL_PRESETS.pure_mirror;

  const currentRotation =
    activeRig && selectedJointKey ? activeRig.getJointRotation(selectedJointKey) : { x: 0, y: 0, z: 0 };

  const jointDef = selectedJointKey ? ANATOMICAL_JOINTS[selectedJointKey] : null;

  const handleAxisChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedJointKey || !activeRig) return;
    const updated = { ...currentRotation, [axis]: value };
    onUpdateJointRotation(selectedJointKey, updated);
  };

  const handleCopyRotation = () => {
    if (!selectedJointKey || !activeRig) return;
    setCopiedRotation({ ...currentRotation });
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 1500);
  };

  const handlePasteRotation = () => {
    if (!selectedJointKey || !copiedRotation || !activeRig) return;
    onUpdateJointRotation(selectedJointKey, { ...copiedRotation });
  };

  return (
    <aside className="w-80 bg-[#0d0f15]/95 border-l border-white/10 flex flex-col h-full overflow-hidden select-none z-20">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black/20 p-1">
        <button
          onClick={() => setInternalTab('joint')}
          className={`flex-1 py-1.5 text-[10px] font-medium rounded transition-colors ${
            internalTab === 'joint'
              ? 'bg-white/10 text-slate-100 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Joints
        </button>
        <button
          onClick={() => setInternalTab('poses')}
          className={`flex-1 py-1.5 text-[10px] font-medium rounded transition-colors ${
            internalTab === 'poses'
              ? 'bg-cyan-500/20 text-cyan-300 shadow-sm font-semibold border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Poses
        </button>
        <button
          onClick={() => setInternalTab('material')}
          className={`flex-1 py-1.5 text-[10px] font-medium rounded transition-colors ${
            internalTab === 'material'
              ? 'bg-white/10 text-slate-100 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Chrome
        </button>
        <button
          onClick={() => setInternalTab('lighting')}
          className={`flex-1 py-1.5 text-[10px] font-medium rounded transition-colors ${
            internalTab === 'lighting'
              ? 'bg-white/10 text-slate-100 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Lights
        </button>
        <button
          onClick={() => setInternalTab('camera')}
          className={`flex-1 py-1.5 text-[10px] font-medium rounded transition-colors ${
            internalTab === 'camera'
              ? 'bg-white/10 text-slate-100 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Camera
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ========================================================= */}
        {/* TAB: VISUAL POSE LIBRARY */}
        {/* ========================================================= */}
        {internalTab === 'poses' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                Ready Anatomical Poses
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                {Object.keys(BUILTIN_POSE_TEMPLATES).length} Presets
              </span>
            </div>

            <div className="space-y-2.5">
              {Object.values(BUILTIN_POSE_TEMPLATES).map((tpl) => (
                <PoseVisualCard
                  key={tpl.id}
                  id={tpl.id}
                  name={tpl.name}
                  category={tpl.category}
                  description={tpl.description}
                  onApply={() => onApplyPoseTemplate(tpl.id)}
                />
              ))}
            </div>
          </div>
        )}
        {/* ========================================================= */}
        {/* TAB 1: JOINT INSPECTOR & RIG */}
        {/* ========================================================= */}
        {internalTab === 'joint' && (
          <div className="space-y-4">
            {selectedJointKey && jointDef ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-100">{jointDef.label}</h3>
                    <div className="text-[10px] text-slate-400">
                      Category: {jointDef.category} · Parent: {jointDef.parentKey || 'Pelvis (Root)'}
                    </div>
                  </div>
                  <button
                    onClick={() => onResetJoint(selectedJointKey)}
                    title="Reset Joint to Neutral"
                    className="p-1 hover:text-rose-400 text-slate-400 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Numerical Sliders (X, Y, Z) */}
                <div className="space-y-3">
                  {(['x', 'y', 'z'] as const).map((axis) => {
                    const val = Math.round(currentRotation[axis]);
                    const min = jointDef.limits?.min[axis] ?? -180;
                    const max = jointDef.limits?.max[axis] ?? 180;

                    return (
                      <div key={axis} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium uppercase text-slate-300">
                            {axis === 'x' ? 'Pitch (X)' : axis === 'y' ? 'Yaw (Y)' : 'Roll (Z)'}
                          </span>
                          <span className="font-mono text-cyan-400 tabular-nums text-[11px]">{val}°</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={min}
                            max={max}
                            value={val}
                            onChange={(e) => handleAxisChange(axis, Number(e.target.value))}
                            className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                          <span>{min}°</span>
                          <span>{max}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Joint Tool Buttons */}
                <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={handleCopyRotation}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded text-slate-300 transition-colors"
                  >
                    {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedNotification ? 'Copied' : 'Copy Angles'}</span>
                  </button>
                  <button
                    onClick={handlePasteRotation}
                    disabled={!copiedRotation}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded transition-colors ${
                      copiedRotation
                        ? 'bg-white/5 hover:bg-white/10 text-slate-300'
                        : 'bg-white/5 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <span>Paste Angles</span>
                  </button>
                </div>

                {/* Mirroring actions */}
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Pose Symmetry & Reset
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => onMirrorPose('L')}
                      className="py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded text-slate-300 transition-colors"
                    >
                      Mirror L → R
                    </button>
                    <button
                      onClick={() => onMirrorPose('R')}
                      className="py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded text-slate-300 transition-colors"
                    >
                      Mirror R → L
                    </button>
                  </div>
                  <button
                    onClick={() => onResetLimb(jointDef.category)}
                    className="w-full py-1.5 text-xs text-rose-300/80 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 rounded transition-colors mt-2"
                  >
                    Reset Current Limb
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs text-slate-400 space-y-2">
                  <div className="font-semibold text-slate-200">No Joint Selected</div>
                  <p>
                    Click any bone directly in the 3D viewport or select from the anatomical tree to
                    rotate joints.
                  </p>
                </div>

                {activeRig && (
                  <div className="space-y-3 pt-2 border-t border-white/10 text-xs">
                    <div className="font-semibold text-slate-300">Figure Transforms</div>
                    <div className="space-y-2 text-slate-400">
                      <div>
                        Position: [{activeRig.currentPose.position.map((v) => v.toFixed(2)).join(', ')}]
                      </div>
                      <div>
                        Rotation: [{activeRig.currentPose.rotation.map((v) => v.toFixed(0)).join(', ')}°]
                      </div>
                    </div>

                    <button
                      onClick={onResetAllPose}
                      className="w-full py-2 text-xs font-medium text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Entire Pose to Neutral
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: POSE PRESET LIBRARY & VISUAL GALLERY */}
        {/* ========================================================= */}
        {internalTab === 'poses' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                Pose Library
              </span>
              <span className="text-[11px] text-slate-400">
                {Object.keys(BUILTIN_POSE_TEMPLATES).length} presets
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: 'all', label: 'All' },
                { id: 'composition', label: '2-Figures' },
                { id: 'neutral', label: 'Reference' },
                { id: 'classical', label: 'Classical' },
                { id: 'ground', label: 'Floor' },
                { id: 'action', label: 'Action' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setPoseFilter(c.id as any)}
                  className={`px-2 py-1 rounded whitespace-nowrap transition-colors ${
                    poseFilter === c.id
                      ? 'bg-cyan-500/25 text-cyan-300 font-medium border border-cyan-500/40'
                      : 'bg-white/5 hover:bg-white/10 text-slate-400'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* List of Pose Cards */}
            <div className="space-y-2.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {Object.values(BUILTIN_POSE_TEMPLATES)
                .filter((tpl) => poseFilter === 'all' || tpl.category === poseFilter)
                .map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-medium text-xs text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {tpl.name}
                      </div>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40 text-cyan-400/80 border border-white/5">
                        {tpl.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                      {tpl.description}
                    </p>

                    <button
                      onClick={() => onApplyPoseTemplate(tpl.id)}
                      className="w-full py-1.5 px-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 rounded text-xs text-cyan-300 font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{tpl.category === 'composition' ? 'Compose 2 Skeletons' : 'Apply Pose'}</span>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CHROME & CHROMATIC MATERIAL FINISHES */}
        {/* ========================================================= */}
        {internalTab === 'material' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                Chrome Presets
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CHROME_MATERIAL_PRESETS).map(([id, p]) => (
                  <button
                    key={id}
                    onClick={() => onUpdateMaterial(p)}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition-colors flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.iridescence > 0.5 && (
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-200 truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed PBR & Iridescence Sliders */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Material Parameters
              </h4>

              {/* Tint Color Picker */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Base Tint Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentMaterial.color}
                    onChange={(e) =>
                      onUpdateMaterial({ ...currentMaterial, color: e.target.value })
                    }
                    className="w-6 h-6 rounded border border-white/20 cursor-pointer bg-transparent"
                  />
                  <span className="font-mono text-[11px] text-slate-400">
                    {currentMaterial.color.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Metalness */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Metalness (Chrome Response)</span>
                  <span className="font-mono text-cyan-400 tabular-nums text-[11px]">
                    {currentMaterial.metalness.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.0"
                  step="0.01"
                  value={currentMaterial.metalness}
                  onChange={(e) =>
                    onUpdateMaterial({ ...currentMaterial, metalness: Number(e.target.value) })
                  }
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Roughness */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Roughness / Polish</span>
                  <span className="font-mono text-cyan-400 tabular-nums text-[11px]">
                    {currentMaterial.roughness.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.5"
                  step="0.01"
                  value={currentMaterial.roughness}
                  onChange={(e) =>
                    onUpdateMaterial({ ...currentMaterial, roughness: Number(e.target.value) })
                  }
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Iridescence (Thin Film) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Iridescence Strength</span>
                  <span className="font-mono text-purple-400 tabular-nums text-[11px]">
                    {currentMaterial.iridescence.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.05"
                  value={currentMaterial.iridescence}
                  onChange={(e) =>
                    onUpdateMaterial({ ...currentMaterial, iridescence: Number(e.target.value) })
                  }
                  className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Environment Reflection Intensity */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Environment Reflection</span>
                  <span className="font-mono text-cyan-400 tabular-nums text-[11px]">
                    {currentMaterial.envMapIntensity.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.1"
                  value={currentMaterial.envMapIntensity}
                  onChange={(e) =>
                    onUpdateMaterial({
                      ...currentMaterial,
                      envMapIntensity: Number(e.target.value),
                    })
                  }
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: STUDIO LIGHTING & SHADOWS */}
        {/* ========================================================= */}
        {internalTab === 'lighting' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                Studio Lighting Presets
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'black_gallery', label: 'Black Gallery Studio' },
                  { id: 'dramatic_rim', label: 'Dramatic Rim Highlights' },
                  { id: 'cinematic_blue_magenta', label: 'Cinematic Cyan & Magenta' },
                  { id: 'warm_gold', label: 'Warm Gold Studio' },
                  { id: 'high_key', label: 'High-Key White Studio' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onApplyLightingPreset(item.id)}
                    className={`px-3 py-2 text-xs font-medium text-left rounded-lg transition-colors flex items-center justify-between ${
                      lightingState.preset === item.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span>{item.label}</span>
                    <Sun className="w-3.5 h-3.5 opacity-70" />
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Lights Configuration */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Active Studio Lights
              </h4>

              {lightingState.lights.map((l) => (
                <div key={l.id} className="p-2.5 bg-white/5 rounded-lg border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{l.name}</span>
                    <button
                      onClick={() => {
                        const updated = { ...lightingState };
                        const found = updated.lights.find((item) => item.id === l.id);
                        if (found) found.enabled = !found.enabled;
                        onUpdateLighting(updated);
                      }}
                      className={`text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                        l.enabled ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {l.enabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {l.enabled && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Intensity</span>
                        <span className="font-mono text-cyan-400">{l.intensity.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="8.0"
                        step="0.2"
                        value={l.intensity}
                        onChange={(e) => {
                          const updated = { ...lightingState };
                          const found = updated.lights.find((item) => item.id === l.id);
                          if (found) found.intensity = Number(e.target.value);
                          onUpdateLighting(updated);
                        }}
                        className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Studio Floor */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Reflective Studio Floor</span>
                <input
                  type="checkbox"
                  checked={lightingState.floorReflective}
                  onChange={(e) => {
                    const updated = { ...lightingState, floorReflective: e.target.checked };
                    onUpdateLighting(updated);
                  }}
                  className="rounded accent-cyan-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: CAMERA & COMPOSITION */}
        {/* ========================================================= */}
        {internalTab === 'camera' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                Camera Angles
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'front', label: 'Front View' },
                  { id: 'three_quarter', label: '3/4 Perspective' },
                  { id: 'left', label: 'Left Profile' },
                  { id: 'right', label: 'Right Profile' },
                  { id: 'back', label: 'Back View' },
                  { id: 'top', label: 'Top Down' },
                ].map((cam) => (
                  <button
                    key={cam.id}
                    onClick={() => onSetCameraView(cam.id as any)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors text-center"
                  >
                    {cam.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <button
                onClick={onFocusSelection}
                className="w-full py-2 px-3 text-xs font-medium text-slate-200 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                Focus on Selected Bone / Figure
              </button>

              <button
                onClick={() => onSetCameraView('reset')}
                className="w-full py-1.5 px-3 text-xs text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                Reset Camera Position
              </button>
            </div>

            {/* Exposure */}
            <div className="space-y-1 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Tone Mapping Exposure</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                defaultValue="1.0"
                onChange={(e) => onSetExposure(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
