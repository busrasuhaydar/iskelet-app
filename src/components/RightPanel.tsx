import React, { useState, useEffect, useRef } from 'react';
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
  Image as ImageIcon,
  Palette,
  CloudSun,
  Upload,
  Trash2,
  Layers,
} from 'lucide-react';
import { SkeletonRig } from '../scene/SkeletonRig';
import {
  JointKey,
  EulerDegrees,
  MaterialSettings,
  LightingStudioState,
  SavedPoseRecord,
  MultiColorMode,
} from '../types/skeleton';
import { ANATOMICAL_JOINTS, CHROME_MATERIAL_PRESETS } from '../scene/jointDefinitions';
import { BUILTIN_POSE_TEMPLATES } from '../services/poseLibrary';
import { PoseVisualCard } from './PoseVisualCard';

interface RightPanelProps {
  activeRig: SkeletonRig | null;
  selectedJointKey: JointKey | null;
  lightingState: LightingStudioState;
  activeTab: 'viewport' | 'materials' | 'scene' | 'lighting' | 'library' | 'tests';
  savedPoses?: SavedPoseRecord[];
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
  onSaveCurrentPose?: (name: string) => void;
  onApplySavedPose?: (record: SavedPoseRecord) => void;
  onDeleteSavedPose?: (id: string) => void;
  onOpenLibraryModal?: () => void;
  onSelectJoint?: (key: JointKey | null) => void;
  onSetBackgroundImage?: (dataUrl: string | null) => void;
  onSetBackgroundColor?: (color: string) => void;
  onSetFloorTexture?: (dataUrl: string | null, repeat?: number) => void;
  onSetFloorRepeat?: (repeat: number) => void;
  onSetFloorVisible?: (visible: boolean) => void;
  onSetFloorColor?: (color: string) => void;
  onSetFloorReflective?: (reflective: boolean) => void;
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
  savedPoses = [],
  onSaveCurrentPose,
  onApplySavedPose,
  onDeleteSavedPose,
  onOpenLibraryModal,
  onSelectJoint,
  onSetBackgroundImage,
  onSetBackgroundColor,
  onSetFloorTexture,
  onSetFloorRepeat,
  onSetFloorVisible,
  onSetFloorColor,
  onSetFloorReflective,
}) => {
  const [internalTab, setInternalTab] = useState<'joint' | 'poses' | 'material' | 'scene' | 'lighting' | 'camera'>(
    activeTab === 'materials'
      ? 'material'
      : activeTab === 'scene'
      ? 'scene'
      : activeTab === 'lighting'
      ? 'lighting'
      : activeTab === 'library'
      ? 'poses'
      : 'joint'
  );

  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const floorFileInputRef = useRef<HTMLInputElement>(null);

  // Sync tab with external header navigation
  useEffect(() => {
    if (activeTab === 'materials') setInternalTab('material');
    if (activeTab === 'scene') setInternalTab('scene');
    if (activeTab === 'lighting') setInternalTab('lighting');
    if (activeTab === 'library') setInternalTab('poses');
    if (activeTab === 'viewport' && !selectedJointKey) setInternalTab('joint');
  }, [activeTab]);

  // When a joint is clicked in 3D viewport, immediately activate Joint Inspector tab
  useEffect(() => {
    if (selectedJointKey) {
      setInternalTab('joint');
    }
  }, [selectedJointKey]);

  const [poseFilter, setPoseFilter] = useState<'all' | 'neutral' | 'classical' | 'action' | 'ground' | 'composition'>('all');
  const [copiedRotation, setCopiedRotation] = useState<EulerDegrees | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Material state
  const currentMaterial: MaterialSettings = activeRig
    ? {
        name: activeRig.currentMaterialSettings?.name || 'Custom Chrome',
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
        multiColorMode: activeRig.currentMaterialSettings?.multiColorMode || 'rainbow_iridescent',
        secondaryColor: activeRig.currentMaterialSettings?.secondaryColor || '#ec4899',
        accentColor: activeRig.currentMaterialSettings?.accentColor || '#8b5cf6',
        zoneColors: activeRig.currentMaterialSettings?.zoneColors || {
          head: '#38bdf8',
          spine: '#f43f5e',
          pelvis: '#a855f7',
          arms: '#06b6d4',
          legs: '#10b981',
        },
      }
    : CHROME_MATERIAL_PRESETS.rainbow_chrome;

  const currentRotation =
    activeRig && selectedJointKey ? activeRig.getJointRotation(selectedJointKey) : { x: 0, y: 0, z: 0 };

  const jointDef = selectedJointKey ? ANATOMICAL_JOINTS[selectedJointKey] : null;

  const handleAxisChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedJointKey || !activeRig) return;
    const updated = { ...currentRotation, [axis]: value };
    onUpdateJointRotation(selectedJointKey, updated);
  };

  const handleNudge = (axis: 'x' | 'y' | 'z', deltaDeg: number) => {
    if (!selectedJointKey || !activeRig) return;
    const updated = { ...currentRotation, [axis]: Math.round(currentRotation[axis] + deltaDeg) };
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

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onSetBackgroundImage?.(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFloorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onSetFloorTexture?.(dataUrl, lightingState.floorRepeat || 4);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const QUICK_BONES: Array<{ key: JointKey; label: string; icon: string }> = [
    { key: 'lower_arm_L', label: 'Sol Dirsek', icon: '💪' },
    { key: 'lower_arm_R', label: 'Sağ Dirsek', icon: '💪' },
    { key: 'shoulder_L', label: 'Sol Kol', icon: '🦾' },
    { key: 'shoulder_R', label: 'Sağ Kol', icon: '🦾' },
    { key: 'head', label: 'Kafa (Skull)', icon: '💀' },
    { key: 'spine_thoracic', label: 'Göğüs / Omurga', icon: '🦴' },
    { key: 'spine_lumbar', label: 'Bel (Lumbar)', icon: '🧍' },
    { key: 'knee_L', label: 'Sol Diz', icon: '🦵' },
    { key: 'knee_R', label: 'Sağ Diz', icon: '🦵' },
    { key: 'wrist_L', label: 'Sol El', icon: '✋' },
    { key: 'wrist_R', label: 'Sağ El', icon: '✋' },
  ];

  return (
    <aside className="w-84 md:w-96 bg-[#0d0f15]/95 border-l border-white/10 flex flex-col h-full overflow-hidden select-none z-20">
      {/* Tab Switcher */}
      <div className="grid grid-cols-6 border-b border-white/10 bg-black/40 p-1 gap-0.5 text-center">
        <button
          onClick={() => setInternalTab('joint')}
          title="Eklem & Kemik Rotasyonu (FK)"
          className={`py-1.5 px-0.5 text-[10px] rounded transition-all truncate ${
            internalTab === 'joint'
              ? 'bg-cyan-500/25 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Eklem
        </button>
        <button
          onClick={() => setInternalTab('poses')}
          title="21 Hazır Anatomik Poz & Kütüphane"
          className={`py-1.5 px-0.5 text-[10px] rounded transition-all truncate ${
            internalTab === 'poses'
              ? 'bg-cyan-500/25 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Pozlar
        </button>
        <button
          onClick={() => setInternalTab('material')}
          title="Krom Kaplama & Rengarenk Çoklu Renk"
          className={`py-1.5 px-0.5 text-[10px] rounded transition-all truncate ${
            internalTab === 'material'
              ? 'bg-cyan-500/25 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Krom
        </button>
        <button
          onClick={() => setInternalTab('scene')}
          title="Sahne, Gökyüzü, Deniz, Arka Plan & Zemin"
          className={`py-1.5 px-0.5 text-[10px] rounded transition-all truncate ${
            internalTab === 'scene'
              ? 'bg-cyan-500/25 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sahne
        </button>
        <button
          onClick={() => setInternalTab('lighting')}
          title="Stüdyo Işıkları & Gölgeler"
          className={`py-1.5 px-0.5 text-[10px] rounded transition-all truncate ${
            internalTab === 'lighting'
              ? 'bg-cyan-500/25 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Işıklar
        </button>
        <button
          onClick={() => setInternalTab('camera')}
          title="Kamera Açıları & Kadraj"
          className={`py-1.5 px-0.5 text-[10px] rounded transition-all truncate ${
            internalTab === 'camera'
              ? 'bg-cyan-500/25 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Kamera
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ========================================================= */}
        {/* TAB 1: JOINT ROTATION & QUICK BONE PICKER */}
        {/* ========================================================= */}
        {internalTab === 'joint' && (
          <div className="space-y-4">
            {/* Quick 1-Click Bone Shortcuts (Solve "cannot select elbow" immediately) */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Hızlı Kemik Seçimi</span>
                <span className="text-[10px] text-cyan-400 font-normal">Doğrudan Seç</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_BONES.map((qb) => {
                  const isSel = selectedJointKey === qb.key;
                  return (
                    <button
                      key={qb.key}
                      onClick={() => onSelectJoint?.(qb.key)}
                      className={`px-2 py-1.5 text-xs rounded-lg border text-left flex items-center gap-1.5 transition-all ${
                        isSel
                          ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 font-semibold shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 hover:border-cyan-500/30'
                      }`}
                    >
                      <span className="text-sm shrink-0">{qb.icon}</span>
                      <span className="truncate">{qb.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedJointKey && jointDef ? (
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div>
                    <h3 className="text-xs font-semibold text-cyan-300">{jointDef.label}</h3>
                    <div className="text-[10px] text-slate-400">
                      Kategori: {jointDef.category} · Bağlantı: {jointDef.parentKey || 'Pelvis (Kök)'}
                    </div>
                  </div>
                  <button
                    onClick={() => onResetJoint(selectedJointKey)}
                    title="Nötr Açıya Sıfırla"
                    className="p-1 hover:text-rose-400 text-slate-400 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Numerical Sliders (X, Y, Z) with Angle Step Buttons */}
                <div className="space-y-3.5">
                  {(['x', 'y', 'z'] as const).map((axis) => {
                    const val = Math.round(currentRotation[axis]);
                    const min = jointDef.limits?.min[axis] ?? -180;
                    const max = jointDef.limits?.max[axis] ?? 180;

                    return (
                      <div key={axis} className="space-y-1.5 bg-black/30 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono uppercase text-slate-400 flex items-center gap-1">
                            <span
                              className={`w-2 h-2 rounded-full inline-block ${
                                axis === 'x' ? 'bg-rose-500' : axis === 'y' ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                            />
                            {axis === 'x' ? 'Pitch (X)' : axis === 'y' ? 'Yaw (Y)' : 'Roll (Z)'}
                          </span>
                          <span className="font-mono text-cyan-400 font-semibold tabular-nums text-xs">
                            {val}°
                          </span>
                        </div>

                        <input
                          type="range"
                          min={min}
                          max={max}
                          step={1}
                          value={val}
                          onChange={(e) => handleAxisChange(axis, Number(e.target.value))}
                          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                        />

                        {/* Step Buttons */}
                        <div className="flex items-center justify-between gap-1 pt-0.5 text-[10px]">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleNudge(axis, -15)}
                              className="px-1.5 py-0.5 bg-white/5 hover:bg-white/15 rounded text-slate-300 font-mono"
                              title="-15°"
                            >
                              -15°
                            </button>
                            <button
                              onClick={() => handleNudge(axis, -5)}
                              className="px-1.5 py-0.5 bg-white/5 hover:bg-white/15 rounded text-slate-300 font-mono"
                              title="-5°"
                            >
                              -5°
                            </button>
                          </div>
                          <button
                            onClick={() => handleAxisChange(axis, 0)}
                            className="px-2 py-0.5 bg-white/5 hover:bg-white/15 rounded text-cyan-300 font-mono"
                            title="0° Sıfırla"
                          >
                            0°
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleNudge(axis, 5)}
                              className="px-1.5 py-0.5 bg-white/5 hover:bg-white/15 rounded text-slate-300 font-mono"
                              title="+5°"
                            >
                              +5°
                            </button>
                            <button
                              onClick={() => handleNudge(axis, 15)}
                              className="px-1.5 py-0.5 bg-white/5 hover:bg-white/15 rounded text-slate-300 font-mono"
                              title="+15°"
                            >
                              +15°
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Copy / Paste Rotations */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                  <button
                    onClick={handleCopyRotation}
                    className="flex-1 py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300 flex items-center justify-center gap-1.5 transition-colors border border-white/10"
                  >
                    {copiedNotification ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Açıyı Kopyala</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handlePasteRotation}
                    disabled={!copiedRotation}
                    className="flex-1 py-1.5 px-2 bg-white/5 hover:bg-white/10 disabled:opacity-40 rounded-lg text-xs text-slate-300 flex items-center justify-center gap-1.5 transition-colors border border-white/10"
                  >
                    <span>Yapıştır</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  3D ekranda herhangi bir kemiğe veya yukarıdaki hızlı butonlara (örn. <strong className="text-cyan-300">Sol Dirsek</strong>) tıklayarak eklemi seçin ve döndürün.
                </p>
                <button
                  onClick={() => onSelectJoint?.('lower_arm_L')}
                  className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-500/30 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>💪 Sol Dirseği Seç</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: VISUAL POSE LIBRARY (21 NATURAL HUMAN POSES) */}
        {/* ========================================================= */}
        {internalTab === 'poses' && (
          <div className="space-y-4">
            {/* Custom Saved Poses Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                  <CameraIcon className="w-3.5 h-3.5" />
                  Kayıtlı Pozlarım ({savedPoses.length})
                </span>
                <button
                  onClick={onOpenLibraryModal}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium underline cursor-pointer"
                >
                  Tümünü Yönet
                </button>
              </div>

              {savedPoses.length > 0 ? (
                <div className="space-y-2">
                  {savedPoses.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-2 bg-[#121620] hover:bg-[#161c28] border border-white/10 hover:border-cyan-500/40 rounded-xl transition-all flex items-center gap-2.5 group"
                    >
                      <div className="w-11 h-11 rounded-lg bg-black overflow-hidden shrink-0 border border-white/10">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <CameraIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-100 truncate group-hover:text-cyan-300">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>{item.createdAt}</span>
                          {item.material?.color && (
                            <span className="flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: item.material.color }}
                              />
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onApplySavedPose?.(item)}
                        title="Pozu, Rengi ve Açıyı Uygula"
                        className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-medium rounded-lg border border-cyan-500/30 transition-colors shrink-0"
                      >
                        Uygula
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <p className="text-[11px] text-slate-400">Henüz kayıtlı pozunuz yok.</p>
                  <button
                    onClick={onOpenLibraryModal}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    + Mevcut Pozu Fotoğrafla Kaydet
                  </button>
                </div>
              )}
            </div>

            {/* Built-in Presets */}
            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                  21 Doğal İnsan Pozu
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {Object.keys(BUILTIN_POSE_TEMPLATES).length} Presets
                </span>
              </div>

              <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
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
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CHROME & MULTI-COLOR CHROMATIC MATERIAL FINISHES */}
        {/* ========================================================= */}
        {internalTab === 'material' && (
          <div className="space-y-4">
            {/* Color Mode Selector (Single, Rainbow Iridescent, Two-Tone, Gradient Ombre, Zone Custom) */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                İskelet Renk Modu
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { id: 'rainbow_iridescent', label: '🌈 Gökkuşağı İridesans' },
                  { id: 'gradient_ombre', label: '🌌 Degrade Ombre (Tüm Tonlar)' },
                  { id: 'rainbow_ribs', label: '🍖 Gökkuşağı Göğüs Kafesi' },
                  { id: 'individual_bones', label: '🧩 Kemikleri Ayrı Boya' },
                  { id: 'zone_custom', label: '🎨 5 Bölge Renkleri' },
                  { id: 'two_tone_flip', label: '🎭 İki Tonlu Krom' },
                  { id: 'solid', label: '🪞 Tek Renk Ayna Krom' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      const updated: MaterialSettings = {
                        ...currentMaterial,
                        multiColorMode: m.id as MultiColorMode,
                      };
                      if (m.id === 'gradient_ombre' && (!updated.ombreStops || updated.ombreStops.length === 0)) {
                        updated.ombreStops = [
                          { id: 'skull', label: '💀 Kuru Kafa & Çene', position: 1.0, color: '#ffd700' },
                          { id: 'neck', label: '🧣 Boyun & Omuzlar', position: 0.85, color: '#ff6600' },
                          { id: 'ribs', label: '🦴 Göğüs Kafesi', position: 0.72, color: '#ff0055' },
                          { id: 'waist', label: '🧬 Bel Omurları', position: 0.58, color: '#a855f7' },
                          { id: 'pelvis', label: '🧍 Pelvis & Kalça', position: 0.45, color: '#00f0ff' },
                          { id: 'knees', label: '🦵 Dizler & Baldır', position: 0.25, color: '#0088ff' },
                          { id: 'feet', label: '🦶 Ayaklar & Parmaklar', position: 0.05, color: '#00ff88' },
                        ];
                      }
                      onUpdateMaterial(updated);
                    }}
                    className={`p-2 rounded-lg border text-left text-[11px] font-medium transition-all ${
                      currentMaterial.multiColorMode === m.id
                        ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-sm ring-1 ring-cyan-400/40'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. DEGRADE OMBRE CONTROLS (TÜM TONLAR VE RASTGELE OMBRE ÜRETİMİ) */}
            {currentMaterial.multiColorMode === 'gradient_ombre' && (
              <div className="p-3 bg-black/40 rounded-xl border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Çok Tonlu Degrade Ombre Krom</span>
                  </div>
                  <button
                    onClick={() => {
                      // Generate vivid harmonious random ombre stops
                      const PALETTES = [
                        ['#ff0055', '#ff5500', '#ffd700', '#00f0ff', '#7928ca'],
                        ['#00f0ff', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'],
                        ['#ccff00', '#00ffaa', '#00f0ff', '#6366f1', '#a855f7'],
                        ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee'],
                        ['#e11d48', '#9333ea', '#3b82f6', '#06b6d4', '#10b981'],
                        ['#ffd700', '#ff8800', '#ff0033', '#660099', '#00ccff'],
                      ];
                      const chosen = PALETTES[Math.floor(Math.random() * PALETTES.length)];
                      const newStops = [
                        { id: 'skull', label: '💀 Kuru Kafa & Çene', position: 1.0, color: chosen[0] },
                        { id: 'neck', label: '🧣 Boyun & Omuzlar', position: 0.85, color: chosen[1] },
                        { id: 'ribs', label: '🦴 Göğüs Kafesi', position: 0.72, color: chosen[2] },
                        { id: 'waist', label: '🧬 Bel Omurları', position: 0.58, color: chosen[3] },
                        { id: 'pelvis', label: '🧍 Pelvis & Kalça', position: 0.45, color: chosen[4] },
                        { id: 'knees', label: '🦵 Dizler & Baldır', position: 0.25, color: chosen[1] },
                        { id: 'feet', label: '🦶 Ayaklar & Parmaklar', position: 0.05, color: chosen[0] },
                      ];
                      onUpdateMaterial({ ...currentMaterial, ombreStops: newStops });
                    }}
                    className="px-2 py-1 bg-gradient-to-r from-pink-500/20 to-cyan-500/20 hover:from-pink-500/30 hover:to-cyan-500/30 text-cyan-200 border border-cyan-400/30 rounded text-[11px] font-medium flex items-center gap-1 transition-all"
                  >
                    <span>🎲 Rastgele Ombre Üret</span>
                  </button>
                </div>

                {/* Ombre Gradient Visual Ribbon Preview */}
                <div
                  className="h-3 rounded-full w-full shadow-inner border border-white/20"
                  style={{
                    background: `linear-gradient(to right, ${
                      (currentMaterial.ombreStops || [
                        { color: '#ffd700' },
                        { color: '#ff0055' },
                        { color: '#a855f7' },
                        { color: '#00f0ff' },
                      ])
                        .map((s) => s.color)
                        .join(', ')
                    })`,
                  }}
                />

                {/* Individual Stop Tone Pickers */}
                <div className="space-y-1.5 text-xs max-h-56 overflow-y-auto pr-1">
                  {(
                    currentMaterial.ombreStops || [
                      { id: 'skull', label: '💀 Kuru Kafa & Çene', position: 1.0, color: '#ffd700' },
                      { id: 'neck', label: '🧣 Boyun & Omuzlar', position: 0.85, color: '#ff6600' },
                      { id: 'ribs', label: '🦴 Göğüs Kafesi', position: 0.72, color: '#ff0055' },
                      { id: 'waist', label: '🧬 Bel Omurları', position: 0.58, color: '#a855f7' },
                      { id: 'pelvis', label: '🧍 Pelvis & Kalça', position: 0.45, color: '#00f0ff' },
                      { id: 'knees', label: '🦵 Dizler & Baldır', position: 0.25, color: '#0088ff' },
                      { id: 'feet', label: '🦶 Ayaklar & Parmaklar', position: 0.05, color: '#00ff88' },
                    ]
                  ).map((stop, idx) => (
                    <div
                      key={stop.id || idx}
                      className="flex items-center justify-between p-1.5 bg-white/5 rounded-lg border border-white/10"
                    >
                      <span className="text-slate-300 font-medium text-[11px]">{stop.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400 uppercase">
                          {stop.color}
                        </span>
                        <input
                          type="color"
                          value={stop.color}
                          onChange={(e) => {
                            const stops = [
                              ...(currentMaterial.ombreStops || [
                                { id: 'skull', label: '💀 Kuru Kafa & Çene', position: 1.0, color: '#ffd700' },
                                { id: 'neck', label: '🧣 Boyun & Omuzlar', position: 0.85, color: '#ff6600' },
                                { id: 'ribs', label: '🦴 Göğüs Kafesi', position: 0.72, color: '#ff0055' },
                                { id: 'waist', label: '🧬 Bel Omurları', position: 0.58, color: '#a855f7' },
                                { id: 'pelvis', label: '🧍 Pelvis & Kalça', position: 0.45, color: '#00f0ff' },
                                { id: 'knees', label: '🦵 Dizler & Baldır', position: 0.25, color: '#0088ff' },
                                { id: 'feet', label: '🦶 Ayaklar & Parmaklar', position: 0.05, color: '#00ff88' },
                              ]),
                            ];
                            stops[idx] = { ...stops[idx], color: e.target.value };
                            onUpdateMaterial({ ...currentMaterial, ombreStops: stops });
                          }}
                          className="w-6 h-6 rounded border border-white/20 cursor-pointer bg-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ready Ombre Palettes */}
                <div className="pt-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Hazır Ombre Temaları
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {[
                      {
                        name: '🌅 Gün Batımı Alevi',
                        colors: ['#ff0055', '#ff5500', '#ffd700', '#7928ca', '#00f0ff'],
                      },
                      {
                        name: '🌆 Siberpunk Neon',
                        colors: ['#00f0ff', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981'],
                      },
                      {
                        name: '🌌 Kutup Işıkları',
                        colors: ['#00ffaa', '#00f0ff', '#3b82f6', '#a855f7', '#ff00aa'],
                      },
                      {
                        name: '🧪 Asit & Toksik',
                        colors: ['#ccff00', '#00ffaa', '#00f0ff', '#7000ff', '#ff0077'],
                      },
                      {
                        name: '🛸 Titanyum Isı Yanığı',
                        colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#ffd700', '#e2e8f0'],
                      },
                      {
                        name: '🌊 Derin Okyanus',
                        colors: ['#00f0ff', '#0284c7', '#1e1b4b', '#0f766e', '#38bdf8'],
                      },
                    ].map((pal) => (
                      <button
                        key={pal.name}
                        onClick={() => {
                          const newStops = [
                            { id: 'skull', label: '💀 Kuru Kafa & Çene', position: 1.0, color: pal.colors[0] },
                            { id: 'neck', label: '🧣 Boyun & Omuzlar', position: 0.85, color: pal.colors[1] },
                            { id: 'ribs', label: '🦴 Göğüs Kafesi', position: 0.72, color: pal.colors[2] },
                            { id: 'waist', label: '🧬 Bel Omurları', position: 0.58, color: pal.colors[3] },
                            { id: 'pelvis', label: '🧍 Pelvis & Kalça', position: 0.45, color: pal.colors[4] },
                            { id: 'knees', label: '🦵 Dizler & Baldır', position: 0.25, color: pal.colors[1] },
                            { id: 'feet', label: '🦶 Ayaklar & Parmaklar', position: 0.05, color: pal.colors[0] },
                          ];
                          onUpdateMaterial({ ...currentMaterial, ombreStops: newStops });
                        }}
                        className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-left truncate text-slate-300 hover:text-cyan-200 transition-colors"
                      >
                        {pal.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. RAINBOW RIBS CONTROLS (TÜM GÖĞÜS KAFESİ KEMİKLERİ FARKLI RENK) */}
            {currentMaterial.multiColorMode === 'rainbow_ribs' && (
              <div className="p-3 bg-black/40 rounded-xl border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>Prizmatik Gökkuşağı Göğüs Kafesi</span>
                  </div>
                  <span className="text-[10px] text-pink-300 font-mono">12 Kaburga Çifti</span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Göğüs kafesindeki her bir kaburga katmanı ve kemiği 12 farklı canlı prizmatik krom
                  tonuyla parıldar. Sternum (göğüs kemiği) ise yüksek kontrastlı neon kaplamaya sahiptir.
                </p>

                {/* 12 Spectrum Tone Visual Swatches */}
                <div className="flex items-center gap-1">
                  {[
                    '#ff0055', '#ff2a00', '#ff6600', '#ff9900', '#ffd700', '#b8e900',
                    '#00f088', '#00f0ff', '#0088ff', '#7928ca', '#a855f7', '#ff00aa',
                  ].map((hex, i) => (
                    <div
                      key={hex}
                      title={`Kaburga Katmanı ${i + 1}`}
                      className="flex-1 h-5 rounded-sm shadow-sm"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-300">Sternum (Göğüs Kemiği) Rengi</span>
                  <input
                    type="color"
                    value="#00f0ff"
                    onChange={(e) => {
                      const boneColors = { ...(currentMaterial.boneColors || {}), Sternum: e.target.value };
                      onUpdateMaterial({ ...currentMaterial, boneColors });
                    }}
                    className="w-6 h-6 rounded border border-white/20 cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            )}

            {/* 3. INDIVIDUAL BONES COLOR CONTROLS (TÜM KEMİKLERİ AYRI RENKLENDİR) */}
            {currentMaterial.multiColorMode === 'individual_bones' && (
              <div className="p-3 bg-black/40 rounded-xl border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                    <Palette className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Kemik Kemik Özel Krom Rengi</span>
                  </div>
                  <button
                    onClick={() => {
                      // Randomize each bone independently with vibrant prismatic metal tones
                      const RANDOM_HUES = [
                        '#ff0055', '#ff3300', '#ff7700', '#ffaa00', '#ffd700',
                        '#b8e900', '#00ff88', '#00f0ff', '#0088ff', '#6366f1',
                        '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#10b981',
                      ];
                      const BONE_KEYS = [
                        'Cranium_Skull', 'Mandible_Jaw', 'Maxilla_Upper_Teeth',
                        'Cervical_Vertebrae_Skinned', 'Rib_Cage', 'Sternum',
                        'Object_5', 'Pelvis_Sacrum',
                        'Clavicle_L', 'Clavicle_R', 'Scapula_L', 'Scapula_R',
                        'Humerus_Upper_L', 'Humerus_Upper_R',
                        'Ulna_Forearm_L', 'Ulna_Forearm_R',
                        'Radius_Forearm_L', 'Radius_Forearm_R',
                        'Femur_Upper_L', 'Femur_Upper_R',
                        'Patella_L', 'Patella_R',
                        'Tibia_Lower_L', 'Tibia_Lower_R',
                        'Fibula_Lower_L', 'Fibula_Lower_R',
                      ];
                      const newBoneColors: Record<string, string> = {};
                      BONE_KEYS.forEach((k) => {
                        newBoneColors[k] = RANDOM_HUES[Math.floor(Math.random() * RANDOM_HUES.length)];
                      });
                      onUpdateMaterial({ ...currentMaterial, boneColors: newBoneColors });
                    }}
                    className="px-2 py-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-purple-200 border border-purple-400/30 rounded text-[11px] font-medium flex items-center gap-1 transition-all"
                  >
                    <span>🎲 Tüm Kemikleri Rastgele Boya</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-300">
                  Her kemiği (veya 3D sahnede tıkladığınız kemiği) bağımsız krom rengiyle boyayabilirsiniz.
                </p>

                {/* Quick list of anatomically distinct bones */}
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 text-xs">
                  {[
                    { id: 'Cranium_Skull', label: '💀 Kafatası (Skull)' },
                    { id: 'Mandible_Jaw', label: '🗣️ Alt Çene (Mandible)' },
                    { id: 'Maxilla_Upper_Teeth', label: '🦷 Üst Çene & Dişler' },
                    { id: 'Rib_Cage', label: '🦴 Göğüs Kafesi (Ribs)' },
                    { id: 'Sternum', label: '🛡️ Göğüs Kemiği (Sternum)' },
                    { id: 'Pelvis_Sacrum', label: '🧍 Pelvis & Kalça' },
                    { id: 'Cervical_Vertebrae_Skinned', label: '🧣 Boyun Omurları' },
                    { id: 'Clavicle_L', label: 'Sol Köprücük Kemiği' },
                    { id: 'Clavicle_R', label: 'Sağ Köprücük Kemiği' },
                    { id: 'Humerus_Upper_L', label: '💪 Sol Üst Kol (Humerus)' },
                    { id: 'Humerus_Upper_R', label: '💪 Sağ Üst Kol (Humerus)' },
                    { id: 'Ulna_Forearm_L', label: 'Sol Ön Kol (Ulna)' },
                    { id: 'Ulna_Forearm_R', label: 'Sağ Ön Kol (Ulna)' },
                    { id: 'Femur_Upper_L', label: '🦵 Sol Uyluk Kemiği (Femur)' },
                    { id: 'Femur_Upper_R', label: '🦵 Sağ Uyluk Kemiği (Femur)' },
                    { id: 'Tibia_Lower_L', label: 'Sol Kaval Kemiği (Tibia)' },
                    { id: 'Tibia_Lower_R', label: 'Sağ Kaval Kemiği (Tibia)' },
                  ].map((bone) => {
                    const color = currentMaterial.boneColors?.[bone.id] || currentMaterial.color;
                    return (
                      <div
                        key={bone.id}
                        className="flex items-center justify-between p-1.5 bg-white/5 rounded-lg border border-white/10"
                      >
                        <span className="text-slate-300 text-[11px] font-medium">{bone.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400 uppercase">{color}</span>
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => {
                              const updatedBoneColors = {
                                ...(currentMaterial.boneColors || {}),
                                [bone.id]: e.target.value,
                              };
                              onUpdateMaterial({ ...currentMaterial, boneColors: updatedBoneColors });
                            }}
                            className="w-6 h-6 rounded border border-white/20 cursor-pointer bg-transparent"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Zone-Based Custom Color Pickers */}
            {currentMaterial.multiColorMode === 'zone_custom' && (
              <div className="p-3 bg-black/40 rounded-xl border border-cyan-500/30 space-y-2.5">
                <div className="text-xs font-semibold text-cyan-300 flex items-center justify-between">
                  <span>Bölge Renklerini Özelleştir</span>
                  <span className="text-[10px] text-slate-400">5 Bölge</span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Skull & Jaw */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">💀 Kafa & Kuru Kafa</span>
                    <input
                      type="color"
                      value={currentMaterial.zoneColors?.head || '#38bdf8'}
                      onChange={(e) =>
                        onUpdateMaterial({
                          ...currentMaterial,
                          zoneColors: { ...currentMaterial.zoneColors, head: e.target.value },
                        })
                      }
                      className="w-6 h-6 rounded border border-white/20 cursor-pointer bg-transparent"
                    />
                  </div>

                  {/* Spine & Ribs */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">🦴 Omurga & Göğüs Kafesi</span>
                    <input
                      type="color"
                      value={currentMaterial.zoneColors?.spine || '#f43f5e'}
                      onChange={(e) =>
                        onUpdateMaterial({
                          ...currentMaterial,
                          zoneColors: { ...currentMaterial.zoneColors, spine: e.target.value },
                        })
                      }
                      className="w-6 h-6 rounded border border-white/20 cursor-pointer bg-transparent"
                    />
                  </div>

                  {/* Pelvis */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">🧍 Pelvis & Kalça</span>
                    <input
                      type="color"
                      value={currentMaterial.zoneColors?.pelvis || '#a855f7'}
                      onChange={(e) =>
                        onUpdateMaterial({
                          ...currentMaterial,
                          zoneColors: { ...currentMaterial.zoneColors, pelvis: e.target.value },
                        })
                      }
                      className="w-6 h-6 rounded border border-white/20 cursor-pointer bg-transparent"
                    />
                  </div>

                  {/* Arms & Elbows */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">💪 Kollar & Dirsekler</span>
                    <input
                      type="color"
                      value={currentMaterial.zoneColors?.arms || '#06b6d4'}
                      onChange={(e) =>
                        onUpdateMaterial({
                          ...currentMaterial,
                          zoneColors: { ...currentMaterial.zoneColors, arms: e.target.value },
                        })
                      }
                      className="w-6 h-6 rounded border border-white/20 cursor-pointer bg-transparent"
                    />
                  </div>

                  {/* Legs & Knees */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">🦵 Bacaklar & Dizler</span>
                    <input
                      type="color"
                      value={currentMaterial.zoneColors?.legs || '#10b981'}
                      onChange={(e) =>
                        onUpdateMaterial({
                          ...currentMaterial,
                          zoneColors: { ...currentMaterial.zoneColors, legs: e.target.value },
                        })
                      }
                      className="w-6 h-6 rounded border border-white/20 cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Two-Tone Color Pickers */}
            {currentMaterial.multiColorMode === 'two_tone_flip' && (
              <div className="p-3 bg-black/40 rounded-xl border border-cyan-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Ana Gövde Rengi</span>
                  <input
                    type="color"
                    value={currentMaterial.color}
                    onChange={(e) =>
                      onUpdateMaterial({ ...currentMaterial, color: e.target.value })
                    }
                    className="w-6 h-6 rounded border border-white/20 cursor-pointer bg-transparent"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Uzuv & Kenar Rengi</span>
                  <input
                    type="color"
                    value={currentMaterial.secondaryColor || '#ec4899'}
                    onChange={(e) =>
                      onUpdateMaterial({ ...currentMaterial, secondaryColor: e.target.value })
                    }
                    className="w-6 h-6 rounded border border-white/20 cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            )}

            {/* Standard Color Picker */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Temel Krom Ton Rengi</span>
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

            {/* Chrome Presets */}
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                Hazır Krom Kaplamalar
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
                      {p.iridescence > 0.5 && <Sparkles className="w-3 h-3 text-cyan-400" />}
                    </div>
                    <span className="text-[11px] font-medium text-slate-200 truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed PBR & Iridescence Sliders */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Fiziksel Krom Parametreleri
              </h4>

              {/* Metalness */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Metaliklik (Metalness)</span>
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
                  <span className="text-slate-300">Pürüzsüzlük / Cila (Roughness)</span>
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

              {/* Clearcoat */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Ayna Vernik Katmanı (Clearcoat)</span>
                  <span className="font-mono text-cyan-400 tabular-nums text-[11px]">
                    {currentMaterial.clearcoat.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.05"
                  value={currentMaterial.clearcoat}
                  onChange={(e) =>
                    onUpdateMaterial({ ...currentMaterial, clearcoat: Number(e.target.value) })
                  }
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Iridescence (Thin Film Rainbow) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Gökkuşağı İridesans Gücü</span>
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
                  <span className="text-slate-300">Stüdyo Çevre Yansıması</span>
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
        {/* TAB 4: SCENE, SKY, OCEAN, CUSTOM IMAGE BACKGROUND & FLOOR */}
        {/* ========================================================= */}
        {internalTab === 'scene' && (
          <div className="space-y-4">
            {/* Environment Presets (Sky, Sea, Sunset, Cyberpunk, Space, Gallery) */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <CloudSun className="w-3.5 h-3.5 text-cyan-400" />
                Sahne & Çevre Temaları
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'sky_clouds', label: '☁️ Mavi Gökyüzü' },
                  { id: 'ocean_sea', label: '🌊 Turkuaz Deniz' },
                  { id: 'sunset', label: '🌅 Gün Batımı' },
                  { id: 'cyberpunk', label: '⚡ Cyberpunk Neon' },
                  { id: 'space_deep', label: '🌌 Derin Uzay' },
                  { id: 'black_gallery', label: '🏛️ Siyah Galeri' },
                  { id: 'warm_gold', label: '✨ Altın Stüdyo' },
                  { id: 'high_key', label: '⚪ Yüksek Beyaz' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onApplyLightingPreset(item.id)}
                    className={`px-2.5 py-2 text-xs font-medium text-left rounded-lg transition-all border ${
                      lightingState.preset === item.id
                        ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Background Image (JPEG / PNG Upload) */}
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                Arka Plan Görseli (JPEG / PNG)
              </h4>

              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleBgImageUpload}
                className="hidden"
              />

              {lightingState.backgroundImage ? (
                <div className="p-2.5 bg-black/40 border border-cyan-500/30 rounded-xl space-y-2">
                  <div className="relative h-24 w-full rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={lightingState.backgroundImage}
                      alt="Custom Background"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-cyan-300 font-medium">Özel Görsel Aktif</span>
                    <button
                      onClick={() => onSetBackgroundImage?.(null)}
                      className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Görseli Kaldır</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => bgFileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 bg-white/5 hover:bg-cyan-500/15 border border-dashed border-white/20 hover:border-cyan-400/60 rounded-xl text-xs text-slate-300 hover:text-cyan-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Arka Plana JPEG / PNG Yükle</span>
                </button>
              )}

              {/* Background Color Picker */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-300">Arka Plan Katı Rengi</span>
                <input
                  type="color"
                  value={lightingState.backgroundColor || '#0b0c10'}
                  onChange={(e) => onSetBackgroundColor?.(e.target.value)}
                  className="w-6 h-6 rounded border border-white/20 cursor-pointer bg-transparent"
                />
              </div>
            </div>

            {/* Custom Floor Texture (JPEG / PNG Upload & Repeat) */}
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Zemin Kaplama Görseli & Ayarları
              </h4>

              <input
                ref={floorFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFloorImageUpload}
                className="hidden"
              />

              {lightingState.floorTexture ? (
                <div className="p-2.5 bg-black/40 border border-cyan-500/30 rounded-xl space-y-2">
                  <div className="relative h-20 w-full rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={lightingState.floorTexture}
                      alt="Floor Texture"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-cyan-300 font-medium">Zemin Kaplaması Aktif</span>
                    <button
                      onClick={() => onSetFloorTexture?.(null)}
                      className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Dokuyu Kaldır</span>
                    </button>
                  </div>

                  {/* Floor Repeat Slider */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Doku Tekrarı (UV Repeat)</span>
                      <span className="font-mono text-cyan-400">{lightingState.floorRepeat || 4}x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="16"
                      step="1"
                      value={lightingState.floorRepeat || 4}
                      onChange={(e) => onSetFloorRepeat?.(Number(e.target.value))}
                      className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => floorFileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 bg-white/5 hover:bg-cyan-500/15 border border-dashed border-white/20 hover:border-cyan-400/60 rounded-xl text-xs text-slate-300 hover:text-cyan-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Zemine JPEG / PNG Doku Kapla</span>
                </button>
              )}

              {/* Floor Color */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Zemin Rengi</span>
                <input
                  type="color"
                  value={lightingState.floorColor || '#0f1117'}
                  onChange={(e) => onSetFloorColor?.(e.target.value)}
                  className="w-6 h-6 rounded border border-white/20 cursor-pointer bg-transparent"
                />
              </div>

              {/* Floor Reflective & Visibility Toggles */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Yansıtıcı Ayna Zemin</span>
                <input
                  type="checkbox"
                  checked={lightingState.floorReflective}
                  onChange={(e) => onSetFloorReflective?.(e.target.checked)}
                  className="rounded accent-cyan-400"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Zemini Göster</span>
                <input
                  type="checkbox"
                  checked={lightingState.floorVisible !== false}
                  onChange={(e) => onSetFloorVisible?.(e.target.checked)}
                  className="rounded accent-cyan-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: STUDIO LIGHTING & SHADOWS */}
        {/* ========================================================= */}
        {internalTab === 'lighting' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
              Aktif Stüdyo Işıkları
            </h3>

            {/* Individual Lights Configuration */}
            <div className="space-y-3">
              {lightingState.lights.map((l) => (
                <div key={l.id} className="p-2.5 bg-white/5 rounded-lg border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{l.name}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={l.color}
                        onChange={(e) => {
                          const updated = { ...lightingState };
                          const found = updated.lights.find((item) => item.id === l.id);
                          if (found) found.color = e.target.value;
                          onUpdateLighting(updated);
                        }}
                        className="w-5 h-5 rounded border border-white/20 cursor-pointer bg-transparent"
                      />
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
                        {l.enabled ? 'AÇIK' : 'KAPALI'}
                      </button>
                    </div>
                  </div>

                  {l.enabled && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Işık Gücü (Intensity)</span>
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
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: CAMERA & COMPOSITION */}
        {/* ========================================================= */}
        {internalTab === 'camera' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                Kamera Açıları
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'front', label: 'Ön Görünüm' },
                  { id: 'three_quarter', label: '3/4 Perspektif' },
                  { id: 'left', label: 'Sol Profil' },
                  { id: 'right', label: 'Sağ Profil' },
                  { id: 'back', label: 'Arka Görünüm' },
                  { id: 'top', label: 'Üstten Bakış' },
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
                Seçili Kemik veya İskelete Odaklan
              </button>

              <button
                onClick={() => onSetCameraView('reset')}
                className="w-full py-1.5 px-3 text-xs text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                Kamera Konumunu Sıfırla
              </button>
            </div>

            {/* Exposure */}
            <div className="space-y-1 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Pozlama (Tone Mapping Exposure)</span>
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
