import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  Info,
  Maximize2,
  Box,
  FileCode,
  ArrowRight,
} from 'lucide-react';
import { ChromeStudio } from '../scene/ChromeStudio';
import { ModelInspectionStats, CustomModelOptions } from '../types/modelImport';
import { SkeletonRig } from '../scene/SkeletonRig';

interface ImportModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  studio: ChromeStudio | null;
  figures: SkeletonRig[];
  activeFigureId: string | null;
  onModelImported: (rig: SkeletonRig) => void;
}

export const ImportModelModal: React.FC<ImportModelModalProps> = ({
  isOpen,
  onClose,
  studio,
  figures,
  activeFigureId,
  onModelImported,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'guide'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Parsed model state
  const [parsedGltf, setParsedGltf] = useState<any | null>(null);
  const [stats, setStats] = useState<ModelInspectionStats | null>(null);

  // Configuration options
  const [options, setOptions] = useState<CustomModelOptions>({
    name: 'Custom 3D Skeleton',
    applyChromeMaterial: true,
    normalizeHeight: true,
    centerOrigin: true,
    replaceTargetId: activeFigureId || (figures[0]?.id ?? null),
    materialPresetKey: 'pure_mirror',
  });

  const [importMode, setImportMode] = useState<'new' | 'replace'>('replace');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    if (!studio) return;
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const { gltf, stats: modelStats } = await studio.loadGLTFFromArrayBuffer(
        arrayBuffer,
        file.name
      );

      // Format file size
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      modelStats.fileSizeFormatted = `${sizeMB} MB`;

      setParsedGltf(gltf);
      setStats(modelStats);
      setOptions((prev) => ({
        ...prev,
        name: file.name.replace(/\.[^/.]+$/, ''),
      }));
    } catch (err: any) {
      console.error('GLTF loading error:', err);
      setErrorMsg(
        err?.message ||
          'GLTF/GLB dosyası yüklenirken bir hata oluştu. Dosyanın geçerli bir 3D model olduğundan emin olun.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlLoad = async () => {
    if (!studio || !urlInput.trim()) return;
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const { gltf, stats: modelStats } = await studio.loadGLTFFromUrl(urlInput.trim());
      setParsedGltf(gltf);
      setStats(modelStats);
      setOptions((prev) => ({
        ...prev,
        name: modelStats.name.replace(/\.[^/.]+$/, ''),
      }));
    } catch (err: any) {
      console.error('URL load error:', err);
      setErrorMsg(
        'Belirtilen bağlantıdan model indirilemedi. URL\'nin doğrudan erişilebilir ve CORS kısıtlamasız olduğundan emin olun.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyToScene = () => {
    if (!studio || !parsedGltf) return;

    try {
      const modelGroup = parsedGltf.scene || parsedGltf.scenes?.[0];
      if (!modelGroup) {
        throw new Error('GLTF sahnesi bulunamadı.');
      }

      let rig: SkeletonRig;
      if (importMode === 'replace' && options.replaceTargetId) {
        rig = studio.replaceFigureWithCustomModel(
          options.replaceTargetId,
          modelGroup,
          options
        );
      } else {
        rig = studio.addCustomModelFigure(modelGroup, options);
      }

      onModelImported(rig);
      onClose();
    } catch (err: any) {
      console.error('Apply model error:', err);
      setErrorMsg(err?.message || 'Model sahneye aktarılırken bir hata meydana geldi.');
    }
  };

  const resetSelection = () => {
    setParsedGltf(null);
    setStats(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141721]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                3D İskelet Modeli Yükle & İncele
              </h2>
              <p className="text-xs text-slate-400">
                GLTF veya GLB formatındaki kendi 3D iskeletinizi stüdyoya aktarın ve inceleyin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 bg-[#0d0f15] px-6 gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Dosya Yükle (GLB / GLTF)</span>
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'url'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Bağlantı (URL) ile Yükle</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'guide'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Nasıl Gönderebilirsiniz?</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tab 1: File Upload */}
          {activeTab === 'upload' && !stats && (
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                    : 'border-white/15 bg-white/[0.02] hover:border-cyan-400/50 hover:bg-white/[0.04]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".gltf,.glb"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 mx-auto rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-slate-200">
                  {isLoading ? 'Model İnceleniyor ve Yükleniyor...' : 'GLTF veya GLB Dosyasını Buraya Sürükleyin'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  veya bilgisayarınızdan dosya seçmek için tıklayın
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">.glb (Önerilen)</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">.gltf</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: URL Load */}
          {activeTab === 'url' && !stats && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">
                  Doğrudan İndirme Bağlantısı (Direct GLTF / GLB URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/models/my_skeleton.glb"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleUrlLoad}
                    disabled={isLoading || !urlInput.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all"
                  >
                    {isLoading ? 'Yükleniyor...' : 'Yükle ve İncele'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Not: Bağlantının herkese açık doğrudan indirme linki olması gerekir (Google Drive doğrudan indirme, GitHub raw bağlantısı vb.).
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Instructions & Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 flex items-start gap-3">
                <Info className="w-5 h-5 shrink-0 text-cyan-400 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-100 mb-1">
                    Kendi 3D İskeletinizi Nasıl Gönderebilir ve Kullanabilirsiniz?
                  </div>
                  <span>
                    3D iskelet modelinizi inceleyebilir, sahnede kullanabilir ve üzerine tam krom/ayna yansımaları uygulayabiliriz. Bunun için aşağıdaki 3 pratik yöntemden birini seçebilirsiniz:
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-100">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Doğrudan Arayüze Bırakın (En Hızlı)</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Bilgisayarınızdaki <code>.glb</code> veya <code>.gltf</code> dosyasını doğrudan bu penceredeki <strong>Dosya Yükle</strong> sekmesine sürükleyip bırakabilirsiniz. Model anında yüklenir, poligon sayısı ve kemik yapısı incelenir ve krom stüdyosuna aktarılır.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-100">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>İndirme Bağlantısı (Link) Paylaşın</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Modelinizi Google Drive (erişimi herkese açık link), Dropbox, GitHub, HuggingFace veya WeTransfer gibi bir servise yükleyip linkini bu sohbete yazabilirsiniz. Ben dosyayı doğrudan projeye indirip kalıcı olarak entegre edebilirim.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-100">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <span>Base64 veya JSON Olarak Paylaşın</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Eğer elinizdeki model metin tabanlı küçük bir <code>.gltf</code> dosyası ise içeriğini buradaki sohbete kod bloğu içinde yapıştırabilirsiniz.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Önerilen Format: .GLB</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Tek parça <strong>.glb (Binary GLTF)</strong> dosyası geometrileri, kemik donanımını (armature) ve hiyerarşiyi tek bir pakette tuttuğu için harici dosya kayıplarını tamamen engeller.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Model Inspection & Configuration Section (When loaded) */}
          {stats && (
            <div className="space-y-5">
              {/* Inspection Summary Card */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-slate-100">
                      Model Başarıyla İncelendi: {stats.name}
                    </span>
                  </div>
                  {stats.fileSizeFormatted && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-slate-300">
                      {stats.fileSizeFormatted}
                    </span>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Toplam Poligon</div>
                    <div className="text-sm font-semibold text-slate-100 mt-0.5">
                      {stats.triangleCount.toLocaleString()} △
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Tepe Noktası (Vertices)</div>
                    <div className="text-sm font-semibold text-slate-100 mt-0.5">
                      {stats.vertexCount.toLocaleString()} pts
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Parça / Mesh Sayısı</div>
                    <div className="text-sm font-semibold text-slate-100 mt-0.5">
                      {stats.meshCount} parça
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Orijinal Boyutlar</div>
                    <div className="text-[11px] font-semibold text-slate-200 mt-1">
                      {stats.originalDimensions.x}m × {stats.originalDimensions.y}m × {stats.originalDimensions.z}m
                    </div>
                  </div>
                </div>

                {/* Detected Bones / Armature */}
                {stats.boneCount > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <div className="text-[11px] font-medium text-slate-300 flex items-center justify-between">
                      <span>Tespit Edilen İskelet Kemikleri ({stats.boneCount} Kemik)</span>
                      {stats.hasSkinnedMesh && (
                        <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                          Skinned Mesh Aktif
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                      {stats.bonesDetected.map((bName, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-white/5 border border-white/10 text-slate-400 font-mono"
                        >
                          {bName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Import Settings Form */}
              <div className="space-y-3.5">
                <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Sahneye Aktarma Tercihleri
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Mode */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">Aktarma Modu</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setImportMode('replace')}
                        className={`p-2.5 rounded-lg border text-left transition-colors ${
                          importMode === 'replace'
                            ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 font-medium'
                            : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-semibold text-xs">Mevcut İskeletin Yerine Koy</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Seçili figürü günceller</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportMode('new')}
                        className={`p-2.5 rounded-lg border text-left transition-colors ${
                          importMode === 'new'
                            ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 font-medium'
                            : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-semibold text-xs">Yeni Figür Olarak Ekle</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Sahneye 2. figür ekler</div>
                      </button>
                    </div>
                  </div>

                  {/* Figure Name */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">Figür Adı</label>
                    <input
                      type="text"
                      value={options.name}
                      onChange={(e) => setOptions((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.applyChromeMaterial}
                      onChange={(e) =>
                        setOptions((p) => ({ ...p, applyChromeMaterial: e.target.checked }))
                      }
                      className="rounded border-white/20 text-cyan-500 focus:ring-0 bg-black/40"
                    />
                    <div className="text-xs">
                      <span className="text-slate-200 font-medium">
                        Stüdyo Krom & Ayna Yansımalarını Uygula (Tavsiye Edilir)
                      </span>
                      <p className="text-[11px] text-slate-400">
                        İskelet üzerine ayna krom, gökkuşağı iridescence ve stüdyo aydınlatma yansımalarını giydirir.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.normalizeHeight}
                      onChange={(e) =>
                        setOptions((p) => ({ ...p, normalizeHeight: e.target.checked }))
                      }
                      className="rounded border-white/20 text-cyan-500 focus:ring-0 bg-black/40"
                    />
                    <div className="text-xs">
                      <span className="text-slate-200 font-medium">
                        İnsan Anatomik Boyutuna Otomatik Ölçekle (1.80 metre)
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Modelin boyutunu stüdyodaki standart insan iskeleti boyuna normalize eder.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.centerOrigin}
                      onChange={(e) =>
                        setOptions((p) => ({ ...p, centerOrigin: e.target.checked }))
                      }
                      className="rounded border-white/20 text-cyan-500 focus:ring-0 bg-black/40"
                    />
                    <div className="text-xs">
                      <span className="text-slate-200 font-medium">
                        Zemine Hizala (Ayak tabanı y = 0)
                      </span>
                      <p className="text-[11px] text-slate-400">
                        İskeleti stüdyo zeminine kusursuz şekilde oturtur.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#141721] flex items-center justify-between">
          {stats ? (
            <button
              onClick={resetSelection}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Farklı Bir Dosya Seç
            </button>
          ) : (
            <div className="text-[11px] text-slate-500">
              Desteklenen formatlar: .glb, .gltf
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              Kapat
            </button>

            {stats && (
              <button
                onClick={handleApplyToScene}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-medium rounded-lg shadow-lg shadow-cyan-500/20 transition-all"
              >
                <span>Sahneye Aktar ve Göster</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
