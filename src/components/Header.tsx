import React from 'react';
import { Camera, ShieldCheck, Download, Sparkles, BookOpen, Upload } from 'lucide-react';

interface HeaderProps {
  activeTab: 'viewport' | 'materials' | 'scene' | 'lighting' | 'library' | 'tests';
  setActiveTab: (tab: 'viewport' | 'materials' | 'scene' | 'lighting' | 'library' | 'tests') => void;
  onOpenExport: () => void;
  onOpenLibrary: () => void;
  onOpenTests: () => void;
  onOpenImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenExport,
  onOpenLibrary,
  onOpenTests,
  onOpenImport,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3 border-b border-white/10 bg-[#0b0c10]/90 backdrop-blur-md z-30 shrink-0">
      {/* Zone 1: Brand wordmark in clean display face */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-purple-500 to-rose-400 p-[1px] flex items-center justify-center">
          <div className="w-full h-full bg-[#0b0c10] rounded-[7px] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
        </div>
        <span className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
          Chromatic Skeleton Pose Studio
        </span>
      </div>

      {/* Zone 2: Navigation tabs / tool modes */}
      <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('viewport')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'viewport' ? 'text-cyan-300 font-semibold border-b border-cyan-400 pb-0.5' : ''
          }`}
        >
          Studio Viewport
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'materials' ? 'text-cyan-300 font-semibold border-b border-cyan-400 pb-0.5' : ''
          }`}
        >
          Krom & Renkler
        </button>
        <button
          onClick={() => setActiveTab('scene')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'scene' ? 'text-cyan-300 font-semibold border-b border-cyan-400 pb-0.5' : ''
          }`}
        >
          Sahne & Gökyüzü / Deniz
        </button>
        <button
          onClick={() => setActiveTab('lighting')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'lighting' ? 'text-cyan-300 font-semibold border-b border-cyan-400 pb-0.5' : ''
          }`}
        >
          Stüdyo Işıkları
        </button>
        <button
          onClick={() => {
            setActiveTab('library');
            onOpenLibrary();
          }}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'library' ? 'text-cyan-300 font-semibold' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          Pose Library
        </button>
        <button
          onClick={onOpenImport}
          className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 text-slate-400 hover:text-cyan-300"
          title="Kendi GLTF/GLB İskelet Modelinizi Yükleyin ve İnceleyin"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          3D Model Yükle
        </button>
        <button
          onClick={onOpenTests}
          className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 text-cyan-400/90"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Acceptance Suite
        </button>
      </nav>

      {/* Zone 3: Primary action button */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
        >
          <Camera className="w-3.5 h-3.5" />
          Export Reference
        </button>
      </div>
    </header>
  );
};
