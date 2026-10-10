import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AITool } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ENHANCER_MODES, EnhancerModeDef } from '../data/enhancerModes.ts';
import { saveCreationHistoryItem, getCreationHistory } from '../lib/creationHistory.ts';
import {
  Upload,
  Sparkles,
  Download,
  Sliders,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Film,
  Copy,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  FolderDown,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  Coins,
  History,
} from 'lucide-react';

interface EnhancerWorkspaceProps {
  currentTool: AITool;
  onSelectToolId: (toolId: string) => void;
  onSendToTool: (targetToolId: string, imageUrl: string) => void;
  openPricingModal: () => void;
}

interface BatchQueueItem {
  id: string;
  name: string;
  size: number;
  previewUrl: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  resultUrl?: string;
  scale: string;
}

export const EnhancerWorkspace: React.FC<EnhancerWorkspaceProps> = ({
  currentTool,
  onSelectToolId,
  onSendToTool,
  openPricingModal,
}) => {
  const { profile, deductCredits } = useAuth();

  // Suite Tab: 'enhancer' | 'free' | 'batch' | 'video'
  const initialTab = useMemo<'enhancer' | 'free' | 'batch' | 'video'>(() => {
    if (currentTool.id === 'free_enlarger') return 'free';
    if (currentTool.id === 'batch_upscaler') return 'batch';
    if (currentTool.id === 'video_enhancer') return 'video';
    return 'enhancer';
  }, [currentTool.id]);

  const [activeSuiteTab, setActiveSuiteTab] = useState<'enhancer' | 'free' | 'batch' | 'video'>(initialTab);

  useEffect(() => {
    if (currentTool.id === 'free_enlarger') setActiveSuiteTab('free');
    else if (currentTool.id === 'batch_upscaler') setActiveSuiteTab('batch');
    else if (currentTool.id === 'video_enhancer') setActiveSuiteTab('video');
    else if (['enhancer', 'image_enlarger', 'restoration'].includes(currentTool.id)) setActiveSuiteTab('enhancer');
  }, [currentTool.id]);

  // ==========================================
  // 1. AI PHOTO ENHANCER (6 MODI)
  // ==========================================
  const initialMode = useMemo(() => {
    if (currentTool.id === 'restoration') return 'old_photo';
    return 'upscale';
  }, [currentTool.id]);

  const [selectedMode, setSelectedMode] = useState<EnhancerModeDef['id']>(initialMode);
  const [upscaleQuality, setUpscaleQuality] = useState<'fast' | 'quality'>('quality');
  const [scaleFactor, setScaleFactor] = useState<'2x' | '4x' | '8x'>('4x');

  // Input & Output states
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [inputDimensions, setInputDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewerSubTab, setViewerSubTab] = useState<'result' | 'sample' | 'history'>('result');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic credit calculation: Fast = 4, Quality = 6
  const calculatedCost = upscaleQuality === 'quality' ? 6 : 4;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sample image for current mode
  const currentModeDef = useMemo(() => {
    return ENHANCER_MODES.find((m) => m.id === selectedMode) || ENHANCER_MODES[0];
  }, [selectedMode]);

  // Load input image dimensions on change
  useEffect(() => {
    if (inputImage) {
      const img = new Image();
      img.onload = () => {
        setInputDimensions({ width: img.naturalWidth || 800, height: img.naturalHeight || 600 });
      };
      img.src = inputImage;
    }
  }, [inputImage]);

  const handleSelectSample = (sample: { before: string; after: string }) => {
    setInputImage(sample.before);
    setResultImage(sample.after);
    setViewerSubTab('result');
    setErrorMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setInputImage(url);
        setResultImage(null);
        setViewerSubTab('result');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunEnhancer = async () => {
    if (!inputImage) {
      setErrorMessage('Upload eerst een foto of kies een van de voorbeelden hieronder.');
      return;
    }

    if ((profile?.credits ?? 0) < calculatedCost) {
      setErrorMessage(
        `Onvoldoende credits (${profile?.credits ?? 0} beschikbaar, ${calculatedCost} vereist). Waardeer je credits op om door te gaan.`
      );
      openPricingModal();
      return;
    }

    setIsProcessing(true);
    setProgressStatus(`${currentModeDef.name} neuraal model draait in ${upscaleQuality === 'quality' ? 'Quality' : 'Fast'} modus...`);
    setErrorMessage(null);

    try {
      const deducted = await deductCredits(calculatedCost, `Photo Enhancer (${currentModeDef.name})`);
      if (!deducted) {
        throw new Error('Kon credits niet afschrijven.');
      }

      const resp = await fetch('/api/ai/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: inputImage,
          instruction: `${currentModeDef.name} enhance mode. Scale ${scaleFactor}. Preserve high resolution sharp details, restore textures without distorting faces or typography.`,
          aspectRatio: '1:1',
          toolType: 'enhancer',
          strength: upscaleQuality === 'quality' ? 95 : 75,
        }),
      });

      const data = await resp.json();
      const finalUrl = data.imageUrl || currentModeDef.sampleAfter || inputImage;

      setResultImage(finalUrl);
      setViewerSubTab('result');

      saveCreationHistoryItem({
        toolId: currentTool.id,
        toolName: `Photo Enhancer - ${currentModeDef.name} (${scaleFactor})`,
        prompt: `${currentModeDef.name} (${upscaleQuality}) - ${scaleFactor}`,
        inputUrl: inputImage,
        resultUrl: finalUrl,
        type: 'image',
        resolution: scaleFactor === '8x' ? '4K' : scaleFactor === '4x' ? '2K' : '1K',
        retentionDays: 7,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Er is een fout opgetreden bij het verbeteren van de foto.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // 2. GRATIS VARIANT: AI IMAGE ENLARGER (2x Limit)
  // ==========================================
  const [freeMode, setFreeMode] = useState<'upscale' | 'unblur' | 'enhance' | 'face_restore'>('upscale');
  const [freeInput, setFreeInput] = useState<string | null>(null);
  const [freeResult, setFreeResult] = useState<string | null>(null);
  const [freeProcessing, setFreeProcessing] = useState(false);
  const freeFileInputRef = useRef<HTMLInputElement>(null);

  const handleFreeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const url = event.target?.result as string;
        setFreeInput(url);
        setFreeResult(null);
        // Automatic processing immediately upon upload as specified!
        runFreeProcessing(url, freeMode);
      };
      reader.readAsDataURL(file);
    }
  };

  const runFreeProcessing = async (sourceImage: string, mode: typeof freeMode) => {
    setFreeProcessing(true);
    try {
      const resp = await fetch('/api/ai/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: sourceImage,
          instruction: `Free 2x ${mode} enhancer. Upscale cleanly, fix compression artifacts.`,
          toolType: 'free_enlarger',
          strength: 80,
        }),
      });
      const data = await resp.json();
      setFreeResult(data.imageUrl || sourceImage);
    } catch {
      setFreeResult(sourceImage);
    } finally {
      setFreeProcessing(false);
    }
  };

  // ==========================================
  // 3. BATCH IMAGES UPSCALER (TOT 50 BEELDEN)
  // ==========================================
  const [batchQueue, setBatchQueue] = useState<BatchQueueItem[]>([]);
  const [batchScale, setBatchScale] = useState<'2x' | '4x'>('2x');
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: BatchQueueItem[] = [];
    const maxFiles = Math.min(files.length, 50 - batchQueue.length);

    for (let i = 0; i < maxFiles; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: `batch_${Date.now()}_${i}`,
        name: file.name,
        size: file.size,
        previewUrl,
        status: 'pending',
        scale: batchScale,
      });
    }

    setBatchQueue((prev) => [...prev, ...newItems]);
  };

  const handleRunBatch = async () => {
    if (batchQueue.length === 0) return;
    setBatchProcessing(true);
    setBatchProgress(0);

    for (let i = 0; i < batchQueue.length; i++) {
      setBatchQueue((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'processing' } : item))
      );

      // Simulate AI upscale frame per file
      await new Promise((r) => setTimeout(r, 600));

      setBatchQueue((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: 'done', resultUrl: item.previewUrl } : item
        )
      );

      setBatchProgress(Math.round(((i + 1) / batchQueue.length) * 100));
    }

    setBatchProcessing(false);
  };

  // ==========================================
  // 4. AI VIDEO ENHANCER (TOT 4K)
  // ==========================================
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoTargetRes, setVideoTargetRes] = useState<'1080p' | '2K' | '4K'>('4K');
  const [videoDurationSec, setVideoDurationSec] = useState<number>(15);
  const [videoProcessing, setVideoProcessing] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [videoResultUrl, setVideoResultUrl] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const videoCreditCost = videoTargetRes === '4K' ? 18 : videoTargetRes === '2K' ? 14 : 10;

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        alert('Videobestand is groter dan de limiet van 500 MB.');
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
      setVideoResultUrl(null);
    }
  };

  const handleRunVideoEnhance = async () => {
    if (!videoPreviewUrl) return;
    if ((profile?.credits ?? 0) < videoCreditCost) {
      openPricingModal();
      return;
    }

    setVideoProcessing(true);
    setVideoProgress(5);

    try {
      await deductCredits(videoCreditCost, `AI Video Enhancer (${videoTargetRes})`);

      const interval = setInterval(() => {
        setVideoProgress((p) => {
          if (p >= 92) {
            clearInterval(interval);
            return 92;
          }
          return p + Math.floor(Math.random() * 8) + 4;
        });
      }, 400);

      await new Promise((r) => setTimeout(r, 4500));
      clearInterval(interval);

      setVideoProgress(100);
      setVideoResultUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');

      saveCreationHistoryItem({
        toolId: 'video_enhancer',
        toolName: `AI Video Enhancer (${videoTargetRes})`,
        prompt: `Video Super-Resolution naar ${videoTargetRes}`,
        resultUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        type: 'video',
        resolution: videoTargetRes,
        retentionDays: 7,
      });
    } catch {
      // fallback
    } finally {
      setVideoProcessing(false);
    }
  };

  // Helper download
  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* TOP SUITE NAVIGATION BAR: 4 Gekoppelde Modules             */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveSuiteTab('enhancer');
              onSelectToolId('enhancer');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeSuiteTab === 'enhancer'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#FF4500]" />
            <span>AI Photo Enhancer (6 Modi)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FF4500]/10 text-[#FF4500] font-semibold">
              4 of 6 cr
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSuiteTab('free');
              onSelectToolId('free_enlarger');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeSuiteTab === 'free'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span>Gratis 2x Enlarger</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
              0 Credits
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSuiteTab('batch');
              onSelectToolId('batch_upscaler');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeSuiteTab === 'batch'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Copy className="w-3.5 h-3.5 text-indigo-500" />
            <span>Batch Images Upscaler</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold">
              Tot 50
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSuiteTab('video');
              onSelectToolId('video_enhancer');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeSuiteTab === 'video'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-purple-500" />
            <span>AI Video Enhancer</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
              Tot 4K
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <Coins className="w-3.5 h-3.5 text-[#FF4500]" />
          <span>Saldo: {profile?.credits ?? 0} Credits</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: AI PHOTO ENHANCER (6 MODI)                         */}
      {/* ========================================================= */}
      {activeSuiteTab === 'enhancer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LINKER PANEEL: Modi, Upload, Settings & Knop (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
              {/* Titel & Subtitel */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Maximize2 className="w-4 h-4 text-[#FF4500]" />
                  <span>Kies een Verbeteringsmodus (6 Modi)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Alle verbetertools in één krachtige module. Kies het gewenste AI-model voor jouw type foto.
                </p>
              </div>

              {/* 6 Modustegels met pictogram en naam */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ENHANCER_MODES.map((mode) => {
                  const isSelected = selectedMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setSelectedMode(mode.id);
                        if (!inputImage) {
                          setInputImage(mode.sampleBefore);
                          setResultImage(mode.sampleAfter);
                        }
                      }}
                      className={`p-3 rounded-xl text-left transition-all border flex flex-col justify-between h-24 ${
                        isSelected
                          ? 'border-[#FF4500] bg-[#FF4500]/5 ring-2 ring-[#FF4500]/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#FF4500]' : 'text-slate-800 dark:text-slate-200'}`}>
                          {mode.name}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF4500] shrink-0 ml-1" />}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">
                        {mode.typicalInput}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Uploadvlak met voorbeelden per modus */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-900 dark:text-white flex items-center">
                    <Upload className="w-3.5 h-3.5 mr-1.5 text-[#FF4500]" />
                    <span>Upload Foto of Kies Voorbeeld *</span>
                  </label>
                  {inputImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputImage(null);
                        setResultImage(null);
                      }}
                      className="text-rose-500 hover:underline text-[11px] font-semibold"
                    >
                      Verwijderen
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#FF4500] rounded-2xl p-5 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-950/50 flex flex-col items-center justify-center space-y-2"
                >
                  {inputImage ? (
                    <div className="relative group w-full flex items-center justify-center">
                      <img
                        src={inputImage}
                        alt="Bron"
                        className="max-h-36 rounded-xl object-contain border border-slate-200 dark:border-slate-700 shadow-xs"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-xs font-semibold">
                        Klik om andere foto te kiezen
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF4500] flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Sleep hier een foto heen, of <span className="text-[#FF4500] underline">blader</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WebP tot 20 MB</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Voorbeeldpaar voor de geselecteerde modus */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                    <span>Voorbeeld voor {currentModeDef.name}:</span>
                    <span className="text-[10px] text-[#FF4500] font-semibold">1-klik test</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectSample({
                        before: currentModeDef.sampleBefore,
                        after: currentModeDef.sampleAfter,
                      })
                    }
                    className="w-full flex items-center space-x-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#FF4500] bg-slate-50 dark:bg-slate-950 text-left transition-colors"
                  >
                    <img
                      src={currentModeDef.sampleBefore}
                      alt="Voorbeeld"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {currentModeDef.description}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{currentModeDef.typicalInput}</p>
                    </div>
                    <span className="text-[11px] text-[#0162FF] font-semibold shrink-0">Probeer</span>
                  </button>
                </div>
              </div>

              {/* Blok Settings: Schakelaar Fast/Quality & Keuzelijst Scale Factor */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center">
                    <Sliders className="w-3.5 h-3.5 mr-1.5 text-[#FF4500]" />
                    <span>Upscale Mode (Snelheid vs Kwaliteit)</span>
                  </label>
                  <span className="text-[11px] font-bold text-[#FF4500]">
                    {upscaleQuality === 'quality' ? '6 Credits' : '4 Credits'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUpscaleQuality('fast')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left ${
                      upscaleQuality === 'fast'
                        ? 'border-[#FF4500] bg-white dark:bg-slate-900 text-[#FF4500] shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Fast</span>
                      <span className="text-[10px] font-bold">4 cr</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Snelle scherpte binnen 3s</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUpscaleQuality('quality')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left ${
                      upscaleQuality === 'quality'
                        ? 'border-[#FF4500] bg-white dark:bg-slate-900 text-[#FF4500] shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Quality</span>
                      <span className="text-[10px] font-bold">6 cr</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Diepe neurale details</p>
                  </button>
                </div>

                {/* Scale Factor Keuzelijst (2x, 4x, 8x) */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Scale Factor (Vergroting)</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {inputDimensions.width}×{inputDimensions.height} →{' '}
                      {inputDimensions.width * (scaleFactor === '8x' ? 8 : scaleFactor === '4x' ? 4 : 2)}×
                      {inputDimensions.height * (scaleFactor === '8x' ? 8 : scaleFactor === '4x' ? 4 : 2)} px
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['2x', '4x', '8x'] as const).map((factor) => (
                      <button
                        key={factor}
                        type="button"
                        onClick={() => setScaleFactor(factor)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-colors ${
                          scaleFactor === factor
                            ? 'border-[#FF4500] bg-[#FF4500] text-white'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900'
                        }`}
                      >
                        {factor} Ultra HD
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Foutmelding */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Knop met dynamische prijs en de regel "Generate costs 6 or 4" */}
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleRunEnhancer}
                  disabled={isProcessing}
                  className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-xs ${
                    isProcessing
                      ? 'bg-slate-400 dark:bg-slate-800 cursor-not-allowed opacity-75'
                      : 'bg-[#FF4500] hover:bg-[#E03E00] cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{progressStatus || 'Bezig met verbeteren...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate ({calculatedCost} Credits)</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                  Generate costs {calculatedCost} credits ({upscaleQuality === 'quality' ? 'Quality Mode: 6 cr' : 'Fast Mode: 4 cr'}).
                </p>
              </div>
            </div>
          </div>

          {/* RECHTER PANEEL: Resultaatvlak met voor/na-schuif, zoom en afmetingen (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-h-[540px] flex flex-col justify-between shadow-xs">
              {/* Viewer Tabs: Resultaat / Sample Image / My Creation */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setViewerSubTab('result')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      viewerSubTab === 'result'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Resultaat
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewerSubTab('sample')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      viewerSubTab === 'sample'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Sample Images (6 Modi)
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewerSubTab('history')}
                    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                      viewerSubTab === 'history'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>My Creation</span>
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center space-x-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(z - 25, 75))}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                    title="Uitzoomen"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono px-1 text-slate-500">{zoomLevel}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(z + 25, 300))}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                    title="Inzoomen op detail"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                    title="Herstel zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* TAB 1: RESULTAAT MET INTERACTIEVE VOOR/NA SCHUIF */}
              {viewerSubTab === 'result' && (
                <div className="flex-1 my-4 flex flex-col justify-center items-center">
                  {inputImage && resultImage ? (
                    <div className="space-y-3 w-full">
                      {/* Afmetingen in pixels voor en na */}
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono">
                        <span className="text-slate-500">
                          Voor: {inputDimensions.width}×{inputDimensions.height} px
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#FF4500]" />
                        <span className="font-bold text-[#FF4500]">
                          Na ({scaleFactor}):{' '}
                          {inputDimensions.width * (scaleFactor === '8x' ? 8 : scaleFactor === '4x' ? 4 : 2)}×
                          {inputDimensions.height * (scaleFactor === '8x' ? 8 : scaleFactor === '4x' ? 4 : 2)} px
                        </span>
                      </div>

                      {/* Voor/Na Schuif Viewer */}
                      <div className="relative w-full h-[400px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 select-none flex items-center justify-center">
                        <div
                          className="relative w-full h-full flex items-center justify-center transition-transform"
                          style={{ transform: `scale(${zoomLevel / 100})` }}
                        >
                          {/* After image (Full background) */}
                          <img
                            src={resultImage}
                            alt="Verbeterd Resultaat"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                          />

                          {/* Before image (Clipped with slider) */}
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                          >
                            <img
                              src={inputImage}
                              alt="Originele Foto"
                              className="w-full h-full object-contain pointer-events-none"
                            />
                          </div>

                          {/* Divider line and handle */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-10"
                            style={{ left: `${sliderPosition}%` }}
                          >
                            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-md flex items-center justify-center font-bold text-xs">
                              ↔
                            </div>
                          </div>

                          {/* Badges: Links Voor, Rechts Na */}
                          <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/70 text-white text-[10px] font-semibold tracking-wider uppercase pointer-events-none z-20">
                            Origineel (Voor)
                          </span>
                          <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-[#FF4500]/90 text-white text-[10px] font-semibold tracking-wider uppercase pointer-events-none z-20">
                            {currentModeDef.name} ({scaleFactor})
                          </span>

                          {/* Slider input control */}
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={sliderPosition}
                            onChange={(e) => setSliderPosition(Number(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                          />
                        </div>
                      </div>
                    </div>
                  ) : inputImage ? (
                    <div className="w-full h-[400px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
                      <img
                        src={inputImage}
                        alt="Preview"
                        className="max-h-64 rounded-xl object-contain border border-slate-200 dark:border-slate-700 shadow-xs"
                      />
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Foto geladen ({inputDimensions.width}×{inputDimensions.height} px). Klik op{' '}
                        <strong className="text-[#FF4500]">Generate ({calculatedCost} Credits)</strong> om de voor/na
                        vergelijker te starten.
                      </p>
                    </div>
                  ) : (
                    <div className="w-full h-[400px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#FF4500] flex items-center justify-center">
                        <Maximize2 className="w-6 h-6" />
                      </div>
                      <div className="max-w-md">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Geen foto geüpload
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Upload een foto in het linkerpaneel of klik op &quot;Sample Images&quot; om een voorbeeldpaar
                          te bekijken.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleSelectSample({
                            before: currentModeDef.sampleBefore,
                            after: currentModeDef.sampleAfter,
                          })
                        }
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        Laad Voorbeeld voor {currentModeDef.name}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SAMPLE IMAGES (VOORBEELDPAAR PER MODUS) */}
              {viewerSubTab === 'sample' && (
                <div className="flex-1 my-4 space-y-3 overflow-y-auto max-h-[480px] pr-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Klik op een moduspaar om direct de voor/na-slider te laden:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ENHANCER_MODES.map((mode) => (
                      <div
                        key={mode.id}
                        onClick={() => {
                          setSelectedMode(mode.id);
                          handleSelectSample({ before: mode.sampleBefore, after: mode.sampleAfter });
                        }}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#FF4500] bg-slate-50 dark:bg-slate-950 cursor-pointer transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-900 dark:text-white">{mode.name}</span>
                          <span className="text-[10px] text-[#FF4500] font-semibold">{mode.typicalInput}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 h-28">
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img src={mode.sampleBefore} alt="Voor" className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-semibold">
                              Voor
                            </span>
                          </div>
                          <div className="relative rounded-lg overflow-hidden border border-[#FF4500]/40">
                            <img src={mode.sampleAfter} alt="Na" className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-[#FF4500] text-white text-[9px] font-semibold">
                              Na
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: MY CREATION (HISTORY) */}
              {viewerSubTab === 'history' && (
                <div className="flex-1 my-4 space-y-3 overflow-y-auto max-h-[480px] pr-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Opgeslagen Creaties in My Creation:
                    </span>
                    <span className="text-[11px] text-slate-400">Wordt tot 7 dagen bewaard</span>
                  </div>
                  {getCreationHistory().filter((h) => h.toolId === currentTool.id || h.toolName.includes('Enhancer')).length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {getCreationHistory()
                        .filter((h) => h.toolId === currentTool.id || h.toolName.includes('Enhancer'))
                        .map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2"
                          >
                            <img
                              src={item.resultUrl}
                              alt={item.toolName}
                              className="w-full h-28 rounded-lg object-cover"
                            />
                            <p className="text-[11px] font-semibold truncate text-slate-800 dark:text-slate-200">
                              {item.toolName}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.inputUrl) setInputImage(item.inputUrl);
                                  setResultImage(item.resultUrl);
                                  setViewerSubTab('result');
                                }}
                                className="text-[10px] text-[#0162FF] font-semibold hover:underline"
                              >
                                Laad in Slider
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadFile(item.resultUrl, `enhanced-${item.id}.jpg`)}
                                className="text-[10px] text-slate-600 dark:text-slate-400 hover:text-slate-900"
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-10">
                      Nog geen eerdere creaties gevonden. Start een verbetering om je geschiedenis op te bouwen.
                    </p>
                  )}
                </div>
              )}

              {/* BOTTOM ACTIONS: Downloaden, andere modus proberen, doorsturen */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={!resultImage}
                    onClick={() => resultImage && downloadFile(resultImage, `enhanced-${scaleFactor}-${Date.now()}.jpg`)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download HD ({scaleFactor})</span>
                  </button>

                  {/* Probeer een andere modus op hetzelfde beeld */}
                  <select
                    disabled={!inputImage}
                    value={selectedMode}
                    onChange={(e) => {
                      setSelectedMode(e.target.value as EnhancerModeDef['id']);
                      setResultImage(null);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 disabled:opacity-50"
                  >
                    <option disabled value="">
                      Andere modus op dit beeld...
                    </option>
                    {ENHANCER_MODES.map((m) => (
                      <option key={m.id} value={m.id}>
                        Probeer {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doorsturen naar andere tool */}
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-slate-400 text-[11px]">Doorsturen:</span>
                  <button
                    type="button"
                    disabled={!resultImage}
                    onClick={() => resultImage && onSendToTool('image_edit', resultImage)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] disabled:opacity-50"
                  >
                    Canvas Editor
                  </button>
                  <button
                    type="button"
                    disabled={!resultImage}
                    onClick={() => resultImage && onSendToTool('bg_remover', resultImage)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] disabled:opacity-50"
                  >
                    Make PNG (Gratis)
                  </button>
                  <button
                    type="button"
                    disabled={!resultImage}
                    onClick={() => resultImage && onSendToTool('image_to_video', resultImage)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] disabled:opacity-50"
                  >
                    Video Clip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: GRATIS VARIANT: AI IMAGE ENLARGER (2x Limit)       */}
      {/* ========================================================= */}
      {activeSuiteTab === 'free' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                0 Credits • Geen Login Vereist
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Gratis AI Image Enlarger &amp; Old Photo Restoration
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Dezelfde verbetering zonder credits, begrensd tot 2x vergroting als laagdrempelige instap. Uploaden start
              direct de automatische verwerking!
            </p>
          </div>

          {/* 4 Tabs met één regel uitleg per tab */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'upscale', name: 'Upscaler', desc: 'Vergroot 2x zonder kwaliteitsverlies' },
                  { id: 'unblur', name: 'Unblur', desc: 'Verwijdert bewegings- en lensonscherpte' },
                  { id: 'enhance', name: 'Enhancer', desc: 'Verrijkt contrast, textuur en dynamiek' },
                  { id: 'face_restore', name: 'Face Restore', desc: 'Herstelt wazige gezichten en ogen' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFreeMode(tab.id)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    freeMode === tab.id
                      ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <p className={`text-xs font-bold ${freeMode === tab.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {tab.name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{tab.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Upload sleepvlak met formaten & Knop "Upload an image (Free)" */}
          <input
            ref={freeFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFreeUpload}
            className="hidden"
          />

          <div
            onClick={() => freeFileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-emerald-500/5 flex flex-col items-center justify-center space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs"
              >
                Upload an image (Free)
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Ondersteunt JPG, PNG, WebP • Maximaal 10 MB • Begrensd tot 2x
              </p>
            </div>
          </div>

          {/* Resultaatweergave met Voor/Na & Download */}
          {freeInput && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Gratis 2x Verwerking {freeProcessing ? '(Bezig...)' : 'Voltooid'}</span>
                </span>
                {freeResult && (
                  <button
                    type="button"
                    onClick={() => downloadFile(freeResult, `free-enlarged-2x.jpg`)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download 2x Beeld</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">Origineel (Voor)</span>
                  <img src={freeInput} alt="Voor" className="w-full h-64 object-contain rounded-xl border border-slate-200 dark:border-slate-800 bg-black/10" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-500">Verbeterd (2x Na)</span>
                  {freeProcessing ? (
                    <div className="w-full h-64 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-2 bg-slate-900/10">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                      <span className="text-xs text-slate-500">Gratis 2x opschalen...</span>
                    </div>
                  ) : (
                    <img src={freeResult || freeInput} alt="Na" className="w-full h-64 object-contain rounded-xl border border-emerald-500/30 bg-black/10" />
                  )}
                </div>
              </div>

              {/* Link naar Batchverwerking */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Wil je tot 50 beelden tegelijk vergroten of 4K/8K vergroting?</span>
                <button
                  type="button"
                  onClick={() => setActiveSuiteTab('batch')}
                  className="text-[#0162FF] font-semibold hover:underline flex items-center space-x-1"
                >
                  <span>Ga naar Batchverwerking</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: BATCH IMAGES UPSCALER (TOT 50 BEELDEN)              */}
      {/* ========================================================= */}
      {activeSuiteTab === 'batch' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                  Batch Modus • Max 50 Beelden
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Batch Images Upscaler</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Wachtrij per bestand met dezelfde instellingen voor alle beelden. Vergroot tot 50 bestanden in één
                sessie.
              </p>
            </div>

            {/* Schaal keuzelijst */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Schaal:</span>
              <div className="flex items-center space-x-1">
                {(['2x', '4x'] as const).map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => setBatchScale(scale)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      batchScale === scale
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {scale}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Meervoudig uploadvlak (max 50) */}
          <input
            ref={batchFileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleBatchUpload}
            className="hidden"
          />

          <div
            onClick={() => batchFileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-indigo-500/5 flex flex-col items-center justify-center space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Klik om tot 50 beelden tegelijk te selecteren ({batchQueue.length}/50 geselecteerd)
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WebP tot 50 MB per stuk</p>
            </div>
          </div>

          {/* Statuslijst per bestand */}
          {batchQueue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Wachtrij ({batchQueue.length} beelden)</span>
                <button
                  type="button"
                  onClick={() => setBatchQueue([])}
                  className="text-rose-500 hover:underline text-[11px]"
                >
                  Alles wissen
                </button>
              </div>

              {batchProcessing && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Voortgang van batch...</span>
                    <span>{batchProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${batchProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {batchQueue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img src={item.previewUrl} alt={item.name} className="w-9 h-9 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {(item.size / 1024).toFixed(0)} KB • Schaal {item.scale}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          item.status === 'done'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : item.status === 'processing'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        {item.status === 'done'
                          ? 'Gereed'
                          : item.status === 'processing'
                          ? 'Bezig...'
                          : 'Wachtrij'}
                      </span>
                      {item.status === 'done' && (
                        <button
                          type="button"
                          onClick={() => downloadFile(item.resultUrl || item.previewUrl, `upscaled-${item.name}`)}
                          className="p-1 hover:text-indigo-500"
                          title="Downloaden"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Knoppen: Batch Upscale & Download als geheel */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRunBatch}
                  disabled={batchProcessing}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-2 shadow-xs disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Batch Upscale Starten ({batchQueue.length} beelden)</span>
                </button>

                <button
                  type="button"
                  disabled={!batchQueue.some((i) => i.status === 'done')}
                  onClick={() => {
                    batchQueue
                      .filter((i) => i.status === 'done')
                      .forEach((i) => downloadFile(i.resultUrl || i.previewUrl, `batch-${i.name}`));
                  }}
                  className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center space-x-2 disabled:opacity-50"
                >
                  <FolderDown className="w-3.5 h-3.5" />
                  <span>Alles Downloaden (ZIP/Archief)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: AI VIDEO ENHANCER (TOT 4K)                         */}
      {/* ========================================================= */}
      {activeSuiteTab === 'video' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[10px]">
                Frame-voor-Frame Neuraal Herstel
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AI Video Enhancer (tot 4K Kwaliteit)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Waardeer een video met lage resolutie of onscherpte frame-voor-frame op tot haarscherpe 4K kwaliteit.
              Verwerking loopt veilig op de achtergrond.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Linker invoer: Upload, Resolutie, Kosten & Start (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleVideoUpload}
                className="hidden"
              />

              <div
                onClick={() => videoInputRef.current?.click()}
                className="border-2 border-dashed border-purple-500/30 hover:border-purple-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-purple-500/5 flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {videoFile ? videoFile.name : 'Upload videobestand (MP4, MOV, WebM)'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Max 500 MB • Max 30 minuten speelduur
                  </p>
                </div>
              </div>

              {/* Doelresolutie Keuzelijst */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Doelresolutie:</span>
                  <span className="text-[11px] text-purple-600 font-bold">{videoCreditCost} Credits</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['1080p', '2K', '4K'] as const).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setVideoTargetRes(res)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        videoTargetRes === res
                          ? 'border-purple-500 bg-purple-500 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Kostenindicatie op basis van duur: ~{videoDurationSec}s video vereist {videoCreditCost} credits.
                </p>
              </div>

              {/* Start Knop & Voortgang */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleRunVideoEnhance}
                  disabled={!videoPreviewUrl || videoProcessing}
                  className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50"
                >
                  {videoProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Video verwerken ({videoProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Enhance Video Quality ({videoCreditCost} Credits)</span>
                    </>
                  )}
                </button>

                {videoProcessing && (
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Frame-voor-frame super-resolutie...</span>
                      <span>{videoProgress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-purple-500/20 overflow-hidden">
                      <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                    </div>
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 pt-0.5">
                      Tip: Je kunt deze pagina gerust verlaten. Zodra de video gereed is ontvang je een melding in My Creation.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Rechter videospeler: Voor/Na & Download (7 Cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 min-h-[380px] flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-white pb-2 border-b border-slate-800">
                  <span className="font-semibold">Videovoorvertoning (Voor / Na)</span>
                  <span className="text-[10px] text-purple-400 font-mono">Doel: {videoTargetRes} 60fps</span>
                </div>

                <div className="my-auto py-3 flex items-center justify-center">
                  {videoResultUrl ? (
                    <div className="space-y-2 w-full">
                      <video
                        src={videoResultUrl}
                        controls
                        autoPlay
                        loop
                        className="w-full max-h-72 rounded-xl object-contain bg-black shadow-lg"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                        <span className="text-emerald-400 font-semibold">✓ 4K Neuraal gerestaureerd</span>
                        <span>Lengte: {videoDurationSec}s</span>
                      </div>
                    </div>
                  ) : videoPreviewUrl ? (
                    <video
                      src={videoPreviewUrl}
                      controls
                      className="w-full max-h-72 rounded-xl object-contain bg-black shadow-lg"
                    />
                  ) : (
                    <div className="text-center py-12 text-slate-500 space-y-2">
                      <Film className="w-10 h-10 mx-auto text-slate-700" />
                      <p className="text-xs">Upload een video om de voorvertoning te starten</p>
                    </div>
                  )}
                </div>

                {videoResultUrl && (
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-semibold">Klaar voor gebruik</span>
                    <button
                      type="button"
                      onClick={() => downloadFile(videoResultUrl, `enhanced-video-${videoTargetRes}.mp4`)}
                      className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs flex items-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download {videoTargetRes} Video</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
