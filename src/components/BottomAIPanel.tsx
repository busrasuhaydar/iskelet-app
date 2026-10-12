import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  RotateCw,
  Cpu,
  Wifi,
  WifiOff,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface BottomAIPanelProps {
  onGeneratePose: (prompt: string, forceOffline: boolean) => Promise<void>;
  isLoading: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  lastAIExplanation: string | null;
  lastAISource: 'gemini-3.8-flash' | 'local_solver' | null;
}

export const BottomAIPanel: React.FC<BottomAIPanelProps> = ({
  onGeneratePose,
  isLoading,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  lastAIExplanation,
  lastAISource,
}) => {
  const [prompt, setPrompt] = useState('');
  const [forceOffline, setForceOffline] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onGeneratePose(prompt.trim(), forceOffline);
  };

  const applySuggestion = (text: string) => {
    setPrompt(text);
    onGeneratePose(text, forceOffline);
  };

  const suggestions = [
    { label: 'Birbirine Sarılan İki İskelet', text: 'birbirine sarılan iki iskelet' },
    { label: 'Dövüşen İki İskelet', text: 'dövüşen iki iskelet kılıç düellosu' },
    { label: 'Dans Eden İskeletler', text: 'vals yapan dans eden iki iskelet' },
    { label: 'Sol Kolunu Kaldır', text: 'sol kolunu biraz daha kaldır, diğer yerleri değiştirme' },
    { label: 'Yerde Oturan İskelet', text: 'yerde oturan ve sol eline yaslanan iskelet' },
    { label: 'El Ele Tutuşan İskeletler', text: 'el ele tutuşan iki iskelet' },
    { label: 'The Thinker (Düşünür)', text: 'Rodin The Thinker seated contemplative pose with elbow on knee and fist to chin.' },
  ];

  return (
    <div className="bg-[#0b0c10]/95 border-t border-white/10 px-4 py-2.5 z-20 shrink-0">
      <div className="max-w-6xl mx-auto space-y-2">
        {/* Status bar & Undo/Redo & Engine Mode */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Natural-Language AI Pose Engine</span>
            </div>

            {/* Offline vs Gemini 3.8 Flash toggle */}
            <button
              onClick={() => setForceOffline(!forceOffline)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition-colors border ${
                forceOffline
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {forceOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
              <span>{forceOffline ? 'Local Solver (Offline)' : 'Gemini 3.8 Flash (Online)'}</span>
            </button>

            {lastAISource && (
              <span className="text-[10px] text-slate-500">
                Active engine: {lastAISource === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Biomechanics Heuristic Engine'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo pose change"
              className={`p-1.5 rounded transition-colors ${
                canUndo ? 'hover:bg-white/10 text-slate-300' : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo pose change"
              className={`p-1.5 rounded transition-colors ${
                canRedo ? 'hover:bg-white/10 text-slate-300' : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='Poz tanımlayın (ör: "birbirine sarılan iki iskelet", "sol kolunu yukarı kaldır", "yerde oturan iskelet")...'
              disabled={isLoading}
              className="w-full px-3.5 py-2 bg-black/40 border border-white/15 focus:border-cyan-400 focus:outline-none rounded-lg text-xs text-slate-100 placeholder-slate-500 transition-colors pr-20"
            />
          </div>

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              !prompt.trim() || isLoading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-sm font-semibold'
            }`}
          >
            {isLoading ? (
              <>
                <Cpu className="w-3.5 h-3.5 animate-spin" />
                <span>Solving Biomechanics...</span>
              </>
            ) : (
              <>
                <span>Generate Pose</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Suggestion Chips & Explanation */}
        <div className="flex items-center justify-between gap-4 pt-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-400 py-0.5">
            <span className="text-slate-500 shrink-0">Try:</span>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applySuggestion(s.text)}
                className="hover:text-cyan-400 hover:bg-white/5 px-2 py-0.5 rounded text-slate-400 transition-colors whitespace-nowrap shrink-0"
              >
                {s.label}
              </button>
            ))}
          </div>

          {lastAIExplanation && (
            <div className="text-[11px] text-cyan-300/90 truncate max-w-sm flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">{lastAIExplanation}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
