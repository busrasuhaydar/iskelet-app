import React, { useState } from 'react';
import {
  Users,
  Plus,
  Upload,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Crosshair,
  Sliders,
} from 'lucide-react';
import { SkeletonRig } from '../scene/SkeletonRig';
import { JointKey } from '../types/skeleton';
import { ANATOMICAL_JOINTS } from '../scene/jointDefinitions';

interface LeftPanelProps {
  figures: SkeletonRig[];
  activeFigureId: string | null;
  selectedJointKey: JointKey | null;
  onSelectFigure: (id: string) => void;
  onAddFigure: () => void;
  onOpenImport?: () => void;
  onDuplicateFigure: (id: string) => void;
  onRemoveFigure: (id: string) => void;
  onSelectJoint: (key: JointKey | null) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onToggleIK: (id: string) => void;
  onToggleLimits: (id: string) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  figures,
  activeFigureId,
  selectedJointKey,
  onSelectFigure,
  onAddFigure,
  onOpenImport,
  onDuplicateFigure,
  onRemoveFigure,
  onSelectJoint,
  onToggleVisibility,
  onToggleLock,
  onToggleIK,
  onToggleLimits,
}) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    arm_R: false,
    leg_R: false,
  });

  const activeRig = figures.find((f) => f.id === activeFigureId) || figures[0];

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Group anatomical joints by body zone
  const categories: { id: string; label: string; keys: JointKey[] }[] = [
    {
      id: 'head',
      label: 'Cranium & Jaw',
      keys: ['head', 'jaw'],
    },
    {
      id: 'spine',
      label: 'Vertebral Spine & Torso',
      keys: ['spine_cervical', 'spine_thoracic', 'spine_lumbar', 'pelvis'],
    },
    {
      id: 'arm_L',
      label: 'Left Arm & Digits',
      keys: [
        'clavicle_L',
        'shoulder_L',
        'lower_arm_L',
        'wrist_L',
        'thumb_L',
        'index_L',
        'middle_L',
        'ring_L',
        'pinky_L',
      ],
    },
    {
      id: 'arm_R',
      label: 'Right Arm & Digits',
      keys: [
        'clavicle_R',
        'shoulder_R',
        'lower_arm_R',
        'wrist_R',
        'thumb_R',
        'index_R',
        'middle_R',
        'ring_R',
        'pinky_R',
      ],
    },
    {
      id: 'leg_L',
      label: 'Left Leg & Foot',
      keys: ['hip_L', 'knee_L', 'ankle_L', 'toes_L'],
    },
    {
      id: 'leg_R',
      label: 'Right Leg & Foot',
      keys: ['hip_R', 'knee_R', 'ankle_R', 'toes_R'],
    },
  ];

  return (
    <aside className="w-72 bg-[#0d0f15]/95 border-r border-white/10 flex flex-col h-full overflow-hidden select-none z-20">
      {/* 1. Scene Hierarchy & Figures Section */}
      <div className="p-3.5 border-b border-white/10">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Scene Figures ({figures.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            {onOpenImport && (
              <button
                onClick={onOpenImport}
                title="Kendi GLTF / GLB İskelet Modelinizi Yükleyin"
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 rounded border border-cyan-500/30 transition-colors"
              >
                <Upload className="w-3 h-3 text-cyan-400" />
                <span>Yükle</span>
              </button>
            )}
            <button
              onClick={onAddFigure}
              title="Add New Skeleton"
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-200 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
            >
              <Plus className="w-3 h-3 text-cyan-400" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Figures List */}
        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
          {figures.map((fig) => {
            const isActive = fig.id === activeFigureId;
            return (
              <div
                key={fig.id}
                onClick={() => onSelectFigure(fig.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/15 border border-cyan-500/30 text-white font-medium'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/30"
                    style={{ backgroundColor: `#${fig.material.color.getHexString()}` }}
                  />
                  <span className="truncate">{fig.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleVisibility(fig.id)}
                    title={fig.visible ? 'Hide figure' : 'Show figure'}
                    className="p-1 hover:text-white text-slate-400 transition-colors"
                  >
                    {fig.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-rose-400" />}
                  </button>
                  <button
                    onClick={() => onToggleLock(fig.id)}
                    title={fig.locked ? 'Unlock figure' : 'Lock figure'}
                    className="p-1 hover:text-white text-slate-400 transition-colors"
                  >
                    {fig.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => onDuplicateFigure(fig.id)}
                    title="Duplicate Figure"
                    className="p-1 hover:text-cyan-400 text-slate-400 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {figures.length > 1 && (
                    <button
                      onClick={() => onRemoveFigure(fig.id)}
                      title="Remove Figure"
                      className="p-1 hover:text-rose-400 text-slate-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Figure Quick Toggles */}
        {activeRig && (
          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <button
              onClick={() => onToggleIK(activeRig.id)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                activeRig.ikEnabled
                  ? 'bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30'
                  : 'hover:text-slate-200'
              }`}
            >
              <Crosshair className="w-3 h-3" />
              <span>IK Mode: {activeRig.ikEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => onToggleLimits(activeRig.id)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                activeRig.enforceJointLimits
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Limits: {activeRig.enforceJointLimits ? 'Enforced' : 'Free'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Hierarchical Skeleton Bone Tree */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Anatomical Bone Hierarchy
        </div>

        {categories.map((cat) => {
          const isCollapsed = collapsedCategories[cat.id];
          return (
            <div key={cat.id} className="space-y-1">
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between py-1 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span>{cat.label}</span>
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5 pl-2 border-l border-white/10">
                  {cat.keys.map((jKey) => {
                    const def = ANATOMICAL_JOINTS[jKey];
                    const isSelected = selectedJointKey === jKey;

                    return (
                      <button
                        key={jKey}
                        onClick={() => onSelectJoint(isSelected ? null : jKey)}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] truncate transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 font-medium border border-cyan-500/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">{def?.label || jKey}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
