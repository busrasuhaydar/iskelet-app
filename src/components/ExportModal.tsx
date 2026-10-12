import React, { useState } from 'react';
import { X, Download, FileJson, Upload, Check } from 'lucide-react';
import { ChromeStudio } from '../scene/ChromeStudio';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studio: ChromeStudio | null;
  onLoadProject: (projectJson: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  studio,
  onLoadProject,
}) => {
  const [resolutionMult, setResolutionMult] = useState(2);
  const [transparentBg, setTransparentBg] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen || !studio) return null;

  const handleCapturePNG = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const dataUrl = studio.exportImage({
          resolutionMultiplier: resolutionMult,
          transparentBackground: transparentBg,
        });

        // Trigger browser download
        const link = document.createElement('a');
        link.download = `chromatic_skeleton_reference_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();

        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 2000);
      } catch (err) {
        console.error('Export failed:', err);
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  const handleExportProjectJSON = () => {
    const figures = Array.from(studio.figures.values()).map((rig) => ({
      id: rig.id,
      name: rig.name,
      visible: rig.visible,
      locked: rig.locked,
      ikEnabled: rig.ikEnabled,
      enforceJointLimits: rig.enforceJointLimits,
      material: {
        name: 'Custom',
        metalness: rig.material.metalness,
        roughness: rig.material.roughness,
        color: `#${rig.material.color.getHexString()}`,
        envMapIntensity: rig.material.envMapIntensity,
        clearcoat: rig.material.clearcoat,
        clearcoatRoughness: rig.material.clearcoatRoughness,
        iridescence: rig.material.iridescence,
        iridescenceIOR: rig.material.iridescenceIOR,
        iridescenceThicknessMin: rig.material.iridescenceThicknessRange[0],
        iridescenceThicknessMax: rig.material.iridescenceThicknessRange[1],
      },
      pose: JSON.parse(JSON.stringify(rig.currentPose)),
    }));

    const project = {
      version: '1.0.0',
      title: 'Chromatic Skeleton Pose Composition',
      date: new Date().toISOString(),
      figures,
      lighting: studio.lightingState,
    };

    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `skeleton_project_${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProjectJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onLoadProject(content);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#10131b] border border-white/10 rounded-xl max-w-md w-full p-5 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
            Export Artwork & Project
          </h2>
          <button onClick={onClose} className="p-1 hover:text-white text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Image Export Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-200">High-Resolution Reference Image</h3>

          <div className="space-y-2">
            <div className="text-[11px] text-slate-400">Resolution Multiplier</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mult: 1, label: '1x (Screen)' },
                { mult: 2, label: '2x (Print)' },
                { mult: 4, label: '4x (Ultra HD)' },
              ].map((res) => (
                <button
                  key={res.mult}
                  onClick={() => setResolutionMult(res.mult)}
                  className={`py-2 text-xs rounded-lg border transition-colors ${
                    resolutionMult === res.mult
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {res.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-300">Transparent Background (Alpha)</span>
            <input
              type="checkbox"
              checked={transparentBg}
              onChange={(e) => setTransparentBg(e.target.checked)}
              className="accent-cyan-400 rounded cursor-pointer"
            />
          </div>

          <button
            onClick={handleCapturePNG}
            disabled={isExporting}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {exportSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Reference Saved!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Rendering Image...' : 'Download Reference Image (PNG)'}</span>
              </>
            )}
          </button>
        </div>

        {/* 2. Scene Project Persistence */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <h3 className="text-xs font-semibold text-slate-200">Scene Project Files</h3>
          <p className="text-[11px] text-slate-400">
            Save all figures, articulated joint poses, custom metallic materials, and studio lights to a reusable JSON project.
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={handleExportProjectJSON}
              className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileJson className="w-3.5 h-3.5 text-cyan-400" />
              <span>Save Project JSON</span>
            </button>

            <label className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>Load Project JSON</span>
              <input type="file" accept=".json" onChange={handleImportProjectJSON} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
