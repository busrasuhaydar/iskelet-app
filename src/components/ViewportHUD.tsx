import React from 'react';
import {
  RotateCcw,
  Move,
  Crosshair,
  Compass,
  Crop,
  HelpCircle,
} from 'lucide-react';
import { GizmoMode, TransformSpace, JointKey } from '../types/skeleton';
import { ANATOMICAL_JOINTS } from '../scene/jointDefinitions';

interface ViewportHUDProps {
  gizmoMode: GizmoMode;
  transformSpace: TransformSpace;
  selectedJointKey: JointKey | null;
  activeFigureName: string | null;
  framingRatio: 'none' | '1:1' | '4:3' | '16:9' | '9:16';
  onSetGizmoMode: (mode: GizmoMode) => void;
  onSetTransformSpace: (space: TransformSpace) => void;
  onSetFramingRatio: (ratio: 'none' | '1:1' | '4:3' | '16:9' | '9:16') => void;
  onOpenLibraryModal?: () => void;
  onQuickSavePose?: () => void;
  onSelectJoint?: (key: JointKey) => void;
}

export const ViewportHUD: React.FC<ViewportHUDProps> = ({
  gizmoMode,
  transformSpace,
  selectedJointKey,
  activeFigureName,
  framingRatio,
  onSetGizmoMode,
  onSetTransformSpace,
  onSetFramingRatio,
  onOpenLibraryModal,
  onQuickSavePose,
  onSelectJoint,
}) => {
  const jointDef = selectedJointKey ? ANATOMICAL_JOINTS[selectedJointKey] : null;

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-10">
      {/* Top Floating Bar: Active Selection & Transform Tools */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pointer-events-auto">
        {/* Selection breadcrumb + Quick Bone Shortcuts */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="px-3 py-1.5 bg-black/75 backdrop-blur-md rounded-lg border border-white/10 text-xs text-slate-300 flex items-center gap-2">
            <span className="font-semibold text-slate-100">{activeFigureName || 'No Figure'}</span>
            {jointDef && (
              <>
                <span className="text-slate-500">·</span>
                <span className="text-cyan-400 font-medium">{jointDef.label}</span>
              </>
            )}
          </div>

          {/* Quick 1-Click Bone Buttons */}
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/10 text-[11px]">
            <button
              onClick={() => onSelectJoint?.('lower_arm_L')}
              title="Sol Dirseği Seç (Left Elbow)"
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                selectedJointKey === 'lower_arm_L'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              💪 Sol Dirsek
            </button>
            <button
              onClick={() => onSelectJoint?.('lower_arm_R')}
              title="Sağ Dirseği Seç (Right Elbow)"
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                selectedJointKey === 'lower_arm_R'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              💪 Sağ Dirsek
            </button>
            <button
              onClick={() => onSelectJoint?.('head')}
              title="Kafa / Kuru Kafa Seç (Skull)"
              className={`px-1.5 py-0.5 rounded transition-all ${
                selectedJointKey === 'head'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              💀 Kafa
            </button>
            <button
              onClick={() => onSelectJoint?.('spine_thoracic')}
              title="Omurga Seç (Spine)"
              className={`px-1.5 py-0.5 rounded transition-all ${
                selectedJointKey === 'spine_thoracic'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              🦴 Omurga
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2">
          {onOpenLibraryModal && (
            <button
              onClick={onOpenLibraryModal}
              title="Pozu Fotoğraflı Kaydet / Kütüphane"
              className="px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-xs font-semibold text-cyan-300 flex items-center gap-1.5 shadow backdrop-blur-md transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 hidden" />
              <span>📸 Pozu Kaydet</span>
            </button>
          )}

          {/* Gizmo Controls Toolbar */}
          <div className="flex items-center gap-1 p-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-xs">
          <button
            onClick={() => onSetGizmoMode('rotate')}
            title="Rotate Joint (FK)"
            className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
              gizmoMode === 'rotate'
                ? 'bg-cyan-500/25 text-cyan-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Rotate (FK)</span>
          </button>

          <button
            onClick={() => onSetGizmoMode('translate')}
            title="Move Figure / Joint Position"
            className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
              gizmoMode === 'translate'
                ? 'bg-cyan-500/25 text-cyan-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Move</span>
          </button>

          <button
            onClick={() => onSetGizmoMode('ik_target')}
            title="Inverse Kinematics Handles"
            className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
              gizmoMode === 'ik_target'
                ? 'bg-purple-500/25 text-purple-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">IK Handles</span>
          </button>

          <div className="h-4 w-[1px] bg-white/10 mx-1" />

          {/* Coordinate Space */}
          <button
            onClick={() => onSetTransformSpace(transformSpace === 'local' ? 'world' : 'local')}
            title={`Switch to ${transformSpace === 'local' ? 'World' : 'Local'} space`}
            className="px-2 py-1 text-[11px] text-slate-300 hover:text-white uppercase font-mono"
          >
            {transformSpace}
          </button>
        </div>
      </div>

        {/* Framing Guides Selector */}
        <div className="hidden md:flex items-center gap-1 p-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[11px]">
          <Crop className="w-3 h-3 text-slate-500 ml-1.5 mr-0.5" />
          {(['none', '1:1', '4:3', '16:9'] as const).map((r) => (
            <button
              key={r}
              onClick={() => onSetFramingRatio(r)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                framingRatio === r
                  ? 'bg-white/15 text-slate-100 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r === 'none' ? 'Full' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio Guide Box (when enabled) */}
      {framingRatio !== 'none' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`border border-cyan-400/30 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] rounded-sm ${
              framingRatio === '1:1'
                ? 'w-[70vh] h-[70vh]'
                : framingRatio === '4:3'
                ? 'w-[80vh] h-[60vh]'
                : framingRatio === '16:9'
                ? 'w-[85vw] max-w-[90vh] aspect-[16/9]'
                : 'w-[50vh] h-[85vh]'
            }`}
          />
        </div>
      )}

      {/* Bottom Hint */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pointer-events-auto">
        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
          <HelpCircle className="w-3 h-3" />
          <span>Left-click: Select bone · Right-click/drag: Orbit · Two-finger/scroll: Zoom</span>
        </div>
      </div>
    </div>
  );
};
