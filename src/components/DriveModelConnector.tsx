import React, { useState, useEffect } from 'react';
import {
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { ChromeStudio } from '../scene/ChromeStudio';
import { SkeletonRig } from '../scene/SkeletonRig';

interface DriveModelConnectorProps {
  studio: ChromeStudio | null;
  onModelLoaded: (rig: SkeletonRig) => void;
}

export const DriveModelConnector: React.FC<DriveModelConnectorProps> = ({
  studio,
  onModelLoaded,
}) => {
  const [driveUrl, setDriveUrl] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [hasCachedModel, setHasCachedModel] = useState(false);
  const [fileSizeFormatted, setFileSizeFormatted] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Check drive config and auto-load on boot
  useEffect(() => {
    checkAndAutoLoad();
  }, [studio]);

  const checkAndAutoLoad = async () => {
    try {
      const res = await fetch('/api/drive-config');
      if (!res.ok) return;
      const data = await res.json();

      setIsConfigured(Boolean(data.configured));
      setHasCachedModel(Boolean(data.hasCachedModel));
      setFileSizeFormatted(data.fileSizeFormatted || null);
      if (data.driveUrl) setDriveUrl(data.driveUrl);

      // Check config status
      if (data.hasCachedModel) {
        setIsConfigured(true);
      }
    } catch (err) {
      console.warn('Failed to check drive config:', err);
    }
  };

  const loadModelFromApi = async () => {
    if (!studio) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/drive-model');
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Drive modeli yüklenemedi');
      }

      const arrayBuffer = await response.arrayBuffer();
      const { gltf } = await studio.loadGLTFFromArrayBuffer(
        arrayBuffer,
        'Diego_Lujan_Skeleton.glb'
      );

      const modelGroup = gltf.scene || gltf.scenes?.[0];
      if (!modelGroup) {
        throw new Error('GLTF sahnesi ayrıştırılamadı.');
      }

      // Replace active figure or add as main figure
      const activeFig = studio.getActiveFigure();
      let rig: SkeletonRig;
      if (activeFig) {
        rig = studio.replaceFigureWithCustomModel(activeFig.id, modelGroup, {
          name: 'Skeleton (Diego Luján García)',
          applyChromeMaterial: true,
          normalizeHeight: true,
          centerOrigin: true,
        });
      } else {
        rig = studio.addCustomModelFigure(modelGroup, {
          name: 'Skeleton (Diego Luján García)',
          applyChromeMaterial: true,
          normalizeHeight: true,
          centerOrigin: true,
        });
      }

      onModelLoaded(rig);
      setSuccessMsg('Diego Luján García iskelet modeli Drive\'dan yüklendi ve tüm kemikleri pozlamaya hazır!');
      setIsConfigured(true);
      setHasCachedModel(true);
    } catch (err: any) {
      console.error('Error auto-loading drive model:', err);
      setErrorMsg(err.message || 'Model Drive\'dan çekilirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrl.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/drive-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driveUrl: driveUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google Drive indirme hatası');
      }

      // Now load the downloaded binary model into studio
      await loadModelFromApi();
      setIsExpanded(false);
    } catch (err: any) {
      console.error('Failed to connect Google Drive link:', err);
      setErrorMsg(err.message || 'Google Drive bağlantısı kurulamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#12151f]/95 border-b border-cyan-500/20 px-4 py-2 z-20 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status Pill */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <HardDrive className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-200">
              Ana İskelet:
            </span>
            {hasCachedModel ? (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Diego Luján García İskeleti Aktif (Drive Önbelleği {fileSizeFormatted ? `· ${fileSizeFormatted}` : ''})</span>
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Google Drive GLTF Bağlantısı Bekleniyor</span>
              </span>
            )}
          </div>

          {/* Model Attribution link */}
          <a
            href="https://sketchfab.com/3d-models/skeleton-4de7b96a351a4a35b1b6e5415277ff07"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-slate-500 hover:text-cyan-400 flex items-center gap-0.5 ml-1 transition-colors"
            title="Sketchfab CC-BY 4.0: Diego Luján García"
          >
            <span>[Model Bilgisi]</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {hasCachedModel && (
            <button
              onClick={loadModelFromApi}
              disabled={isLoading}
              title="Drive'dan Yeniden Çek"
              className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-[11px] text-slate-300 flex items-center gap-1 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
              ) : (
                <RefreshCw className="w-3 h-3 text-cyan-400" />
              )}
              <span>Yenile</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
          >
            <LinkIcon className="w-3 h-3 text-cyan-400" />
            <span>{hasCachedModel ? 'Drive Linkini Değiştir' : 'Google Drive Linki Gir'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Drive URL Input Panel */}
      {isExpanded && (
        <form onSubmit={handleConnectDrive} className="mt-2.5 pt-2 border-t border-white/10 space-y-2">
          <div className="text-[11px] text-slate-300">
            Google Drive'daki <strong>.glb</strong> veya <strong>.gltf</strong> iskelet dosyanızın paylaşım bağlantısını yapıştırın. Dosya indirilir ve her açılışta <strong>tek ana iskelet</strong> olarak otomatik yüklenir:
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/1XyZ.../view?usp=sharing"
              className="flex-1 px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={isLoading || !driveUrl.trim()}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>İndiriliyor & Bağlanıyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bağla & Ana İskelet Yap</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="text-[11px] text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
