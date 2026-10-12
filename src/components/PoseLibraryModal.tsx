import React, { useState } from 'react';
import { X, Sparkles, BookOpen, BookmarkPlus, Check } from 'lucide-react';
import { BUILTIN_POSE_TEMPLATES, PoseTemplate, getCustomPoses, saveCustomPose } from '../services/poseLibrary';
import { SkeletonRig } from '../scene/SkeletonRig';
import { PoseVisualCard } from './PoseVisualCard';

interface PoseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRig: SkeletonRig | null;
  figures: SkeletonRig[];
  onApplyPoseTemplate: (templateId: string) => void;
}

export const PoseLibraryModal: React.FC<PoseLibraryModalProps> = ({
  isOpen,
  onClose,
  activeRig,
  figures,
  onApplyPoseTemplate,
}) => {
  const [filter, setFilter] = useState<'all' | 'neutral' | 'classical' | 'action' | 'ground' | 'composition'>('all');
  const [customPoseName, setCustomPoseName] = useState('');
  const [customSaved, setCustomSaved] = useState(false);

  if (!isOpen) return null;

  const templates = Object.values(BUILTIN_POSE_TEMPLATES).filter(
    (t) => filter === 'all' || t.category === filter
  );

  const customPoses = getCustomPoses();

  const handleSaveCurrentPose = () => {
    if (!activeRig || !customPoseName.trim()) return;
    saveCustomPose(customPoseName.trim(), activeRig.currentPose);
    setCustomPoseName('');
    setCustomSaved(true);
    setTimeout(() => setCustomSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#10131b] border border-white/10 rounded-xl max-w-4xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
              Anatomical Pose Library & Visual Previews
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 text-xs">
          {[
            { id: 'all', label: 'All Poses' },
            { id: 'neutral', label: 'Neutral & Reference' },
            { id: 'classical', label: 'Classical Sculptural' },
            { id: 'ground', label: 'Floor & Seated' },
            { id: 'action', label: 'Dynamic & Action' },
            { id: 'composition', label: 'Two-Figure Compositions' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                filter === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 font-medium border border-cyan-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Pose Templates Grid with Visual Silhouettes */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {templates.map((tpl) => (
            <PoseVisualCard
              key={tpl.id}
              id={tpl.id}
              name={tpl.name}
              category={tpl.category}
              description={tpl.description}
              onApply={() => {
                onApplyPoseTemplate(tpl.id);
                onClose();
              }}
            />
          ))}
        </div>

        {/* Save Current Pose to Custom Presets */}
        {activeRig && (
          <div className="pt-3 border-t border-white/10 shrink-0">
            <div className="text-xs font-semibold text-slate-300 mb-2">
              Save Current Pose to My Library
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customPoseName}
                onChange={(e) => setCustomPoseName(e.target.value)}
                placeholder="Custom Pose Name (e.g. My Hero Pose)..."
                className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 focus:border-cyan-400 rounded-lg text-xs text-slate-200"
              />
              <button
                onClick={handleSaveCurrentPose}
                disabled={!customPoseName.trim()}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {customSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{customSaved ? 'Saved!' : 'Save Pose'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
