import React, { useState } from 'react';
import { X, BookOpen, Camera, Trash2, Check, Sparkles, Palette, Video } from 'lucide-react';
import { BUILTIN_POSE_TEMPLATES } from '../services/poseLibrary';
import { SkeletonRig } from '../scene/SkeletonRig';
import { SavedPoseRecord } from '../types/skeleton';
import { PoseVisualCard } from './PoseVisualCard';

interface PoseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRig: SkeletonRig | null;
  figures: SkeletonRig[];
  onApplyPoseTemplate: (templateId: string) => void;
  savedPoses: SavedPoseRecord[];
  onSaveCurrentPose: (name: string) => void;
  onApplySavedPose: (record: SavedPoseRecord) => void;
  onDeleteSavedPose: (id: string) => void;
  currentPreviewThumbnail?: string;
}

export const PoseLibraryModal: React.FC<PoseLibraryModalProps> = ({
  isOpen,
  onClose,
  activeRig,
  figures,
  onApplyPoseTemplate,
  savedPoses,
  onSaveCurrentPose,
  onApplySavedPose,
  onDeleteSavedPose,
  currentPreviewThumbnail,
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'presets'>('saved');
  const [filter, setFilter] = useState<'all' | 'neutral' | 'classical' | 'action' | 'ground' | 'composition'>('all');
  const [customPoseName, setCustomPoseName] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  if (!isOpen) return null;

  const templates = Object.values(BUILTIN_POSE_TEMPLATES).filter(
    (t) => filter === 'all' || t.category === filter
  );

  const handleSave = () => {
    if (!activeRig || !customPoseName.trim()) return;
    onSaveCurrentPose(customPoseName.trim());
    setCustomPoseName('');
    setJustSaved(true);
    setActiveTab('saved');
    setTimeout(() => setJustSaved(false), 2500);
  };

  const currentColor = activeRig?.currentMaterialSettings.color || '#e2e8f0';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-[#0e121a] border border-cyan-500/20 rounded-2xl max-w-4xl w-full p-5 space-y-4 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 tracking-wide flex items-center gap-2">
                Fotoğraflı Poz Kütüphanesi & Sahne Önayarları
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  {savedPoses.length} Kayıtlı Poz
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Pozları, renkleri ve kamera açılarını fotoğraflı olarak kaydedin ve istediğiniz an tek tıkla yükleyin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Save Current Pose Bar (with live snapshot preview) */}
        {activeRig && (
          <div className="p-3 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 rounded-xl shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mevcut Pozu & Açıyı Fotoğrafla Kaydet</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Palette className="w-3 h-3 text-cyan-400" />
                  <span
                    className="w-3 h-3 rounded-full border border-white/20 inline-block"
                    style={{ backgroundColor: currentColor }}
                  />
                  {currentColor}
                </span>
                <span className="flex items-center gap-1">
                  <Video className="w-3 h-3 text-cyan-400" />
                  Kamera Açısı Aktif
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {currentPreviewThumbnail && (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-cyan-500/40 shrink-0 bg-black shadow">
                  <img
                    src={currentPreviewThumbnail}
                    alt="Canlı Önizleme"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <input
                type="text"
                value={customPoseName}
                onChange={(e) => setCustomPoseName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="Poz Başlığı Yazın (örn: Düşünür Heykeli, Altın Savaşçı, Uzanış vb.)..."
                className="flex-1 px-3 py-2 bg-black/60 border border-white/15 focus:border-cyan-400 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
              />
              <button
                onClick={handleSave}
                disabled={!customPoseName.trim()}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
              >
                {justSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-950" />
                    <span>Kaydedildi!</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Fotoğrafla Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab Selection: Saved Custom vs Builtin */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeTab === 'saved'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Fotoğraflı Kayıtlı Pozlarım</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-400/20 text-cyan-300">
                {savedPoses.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeTab === 'presets'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Hazır Anatomik Pozlar</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">
                {Object.keys(BUILTIN_POSE_TEMPLATES).length}
              </span>
            </button>
          </div>

          {activeTab === 'presets' && (
            <div className="flex items-center gap-1 text-[11px] overflow-x-auto">
              {[
                { id: 'all', label: 'Tümü' },
                { id: 'neutral', label: 'Nötr & Referans' },
                { id: 'classical', label: 'Klasik Heykel' },
                { id: 'ground', label: 'Zemin / Oturuş' },
                { id: 'action', label: 'Dinamik Aksiyon' },
                { id: 'composition', label: 'İkili Sahne' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id as any)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    filter === cat.id
                      ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                      : 'hover:bg-white/5 text-slate-400'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'saved' ? (
            savedPoses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {savedPoses.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-[#141923] border border-white/10 hover:border-cyan-500/50 rounded-xl overflow-hidden shadow-lg transition-all flex flex-col justify-between"
                  >
                    {/* Thumbnail Image */}
                    <div className="aspect-square bg-black/60 relative overflow-hidden flex items-center justify-center">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-1">
                          <Camera className="w-8 h-8 opacity-40" />
                          <span className="text-[10px]">Önizleme Yok</span>
                        </div>
                      )}
                      {/* Color Tag Badge */}
                      {item.material?.color && (
                        <div
                          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-black/75 backdrop-blur-md border border-white/20 text-white font-mono"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: item.material.color }}
                          />
                          <span>{item.material.color}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content & Action Buttons */}
                    <div className="p-3 space-y-2 bg-[#121620]">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-slate-500">
                            {item.createdAt}
                          </span>
                        </div>
                        <button
                          onClick={() => onDeleteSavedPose(item.id)}
                          title="Bu pozu kütüphaneden sil"
                          className="p-1 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          onApplySavedPose(item);
                          onClose();
                        }}
                        className="w-full py-1.5 px-3 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Pozu, Rengi & Açıyı Yükle</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Camera className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-200">
                    Henüz Kayıtlı Bir Pozunuz Yok
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    İskeletinize verdiğiniz açı, renk ve pozu yukarıdaki kutucuğa bir isim verip "Fotoğrafla Kaydet" butonuna basarak anında buraya ekleyebilirsiniz.
                  </p>
                </div>
              </div>
            )
          ) : (
            /* Built-in Presets Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
          )}
        </div>
      </div>
    </div>
  );
};
