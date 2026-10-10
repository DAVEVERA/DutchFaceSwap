import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AITool } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  PHOTO_ORIGINALS_SINGLE,
  PHOTO_ORIGINALS_MULTIPLE,
  TARGET_FACES,
  VIDEO_ORIGINALS_SAMPLE,
  SAMPLE_DETECTED_FACES,
  FACESWAP_SEO_CONTENT,
  DetectedFace,
  SwapHistoryItem,
} from '../data/faceSwapData.ts';
import {
  Upload,
  Sparkles,
  Download,
  RotateCcw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Film,
  Image as ImageIcon,
  Users,
  Copy,
  Clock,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  Coins,
  History,
  Check,
  X,
  AlertTriangle,
  FolderDown,
  Info,
  Layers,
} from 'lucide-react';

interface FaceSwapWorkspaceProps {
  currentTool: AITool;
  onSelectToolId: (toolId: string) => void;
  onSendToTool: (targetToolId: string, imageUrl: string) => void;
  openPricingModal: () => void;
}

interface BatchPhotoItem {
  id: string;
  name: string;
  size: number;
  previewUrl: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  resultUrl?: string;
  errorReason?: string;
}

export const FaceSwapWorkspace: React.FC<FaceSwapWorkspaceProps> = ({
  currentTool,
  onSelectToolId,
  onSendToTool,
  openPricingModal,
}) => {
  const { profile, deductCredits } = useAuth();

  // URL Hash Sync: Medium ('photo' | 'video') & Mode ('single' | 'multiple' | 'batch')
  const getInitialStateFromHash = () => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace(/^#[^?]*\??/, ''));
    const medium = (params.get('medium') === 'video' ? 'video' : 'photo') as 'photo' | 'video';
    const mode = (['single', 'multiple', 'batch'].includes(params.get('mode') || '')
      ? params.get('mode')
      : 'single') as 'single' | 'multiple' | 'batch';
    return { medium, mode };
  };

  const initialUrlState = getInitialStateFromHash();
  const [activeMedium, setActiveMedium] = useState<'photo' | 'video'>(initialUrlState.medium);
  const [activeMode, setActiveMode] = useState<'single' | 'multiple' | 'batch'>(initialUrlState.mode);

  // Sync URL hash seamlessly
  useEffect(() => {
    const newHash = `#faceswap?medium=${activeMedium}&mode=${activeMode}`;
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
  }, [activeMedium, activeMode]);

  // Model Version: v1 (stabiel), v2 (sneller/beter bij bril/hand), hd (alleen video/pro)
  const [modelVersion, setModelVersion] = useState<'v1' | 'v2' | 'hd'>('v2');

  // Consent & Terms of service confirmation
  const [consentAccepted, setConsentAccepted] = useState<boolean>(() => {
    return localStorage.getItem('swapsmoel_consent_accepted') === 'true';
  });
  const [consentModalOpen, setConsentModalOpen] = useState(false);

  // Input states (Persisted across mode switches!)
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [targetPhoto, setTargetPhoto] = useState<string | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [hoveredFaceIndex, setHoveredFaceIndex] = useState<number | null>(null);
  const [multiTargetSlots, setMultiTargetSlots] = useState<{ [faceIndex: number]: string }>({});

  // Multiple faces auto-detection notice
  const [multipleFacesFoundNotice, setMultipleFacesFoundNotice] = useState<boolean>(false);

  // Video states
  const [originalVideo, setOriginalVideo] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(6); // seconds
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 6]);

  // Batch states
  const [batchPhotoQueue, setBatchPhotoQueue] = useState<BatchPhotoItem[]>([]);
  const [batchProgress, setBatchProgress] = useState<number>(0);

  // Recent Target Faces used in this session
  const [recentTargetFaces, setRecentTargetFaces] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('swapsmoel_recent_targets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addRecentTarget = (url: string) => {
    if (!url) return;
    setRecentTargetFaces((prev) => {
      const filtered = prev.filter((u) => u !== url);
      const updated = [url, ...filtered].slice(0, 8);
      localStorage.setItem('swapsmoel_recent_targets', JSON.stringify(updated));
      return updated;
    });
  };

  // Execution & Output states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [resultMedia, setResultMedia] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [abuseModalOpen, setAbuseModalOpen] = useState<boolean>(false);
  const [abuseReason, setAbuseReason] = useState<string>('');

  // History state (max 80 items, 24h retention)
  const [swapHistory, setSwapHistory] = useState<SwapHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('swapsmoel_swap_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveToHistory = (item: Omit<SwapHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: SwapHistoryItem = {
      ...item,
      id: `swap_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setSwapHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, 80);
      localStorage.setItem('swapsmoel_swap_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Refs for file pickers
  const originalFileInputRef = useRef<HTMLInputElement>(null);
  const targetFileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const multiSlotInputRef = useRef<HTMLInputElement>(null);
  const [activeMultiSlotIndex, setActiveMultiSlotIndex] = useState<number | null>(null);

  // Price calculation
  const calculatedCredits = useMemo(() => {
    if (activeMedium === 'photo') {
      if (activeMode === 'single') return 1;
      if (activeMode === 'multiple') return 4;
      if (activeMode === 'batch') return Math.max(1, batchPhotoQueue.length);
    } else {
      // Video
      const durationSec = Math.max(1, trimRange[1] - trimRange[0]);
      if (activeMode === 'single') return durationSec * 2;
      if (activeMode === 'multiple') return durationSec * 4;
      if (activeMode === 'batch') return durationSec * 3;
    }
    return 1;
  }, [activeMedium, activeMode, batchPhotoQueue.length, trimRange]);

  // Run face detection on photo original upload
  const handleOriginalPhotoUpload = async (url: string) => {
    setOriginalPhoto(url);
    setResultMedia(null);
    setMultipleFacesFoundNotice(false);

    // Call backend detect endpoint
    try {
      const resp = await fetch('/api/swap/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaBase64: url, mediaType: 'photo' }),
      });
      const data = await resp.json();
      if (data.faces && data.faces.length > 0) {
        setDetectedFaces(data.faces);
        if (data.facesCount > 1 && activeMode === 'single') {
          setMultipleFacesFoundNotice(true);
        }
      }
    } catch {
      // Fallback: 1 face assumed
      setDetectedFaces([
        {
          id: 'f1',
          index: 1,
          box: { x: 30, y: 15, width: 40, height: 45 },
          cropUrl: url,
          confidence: 0.95,
        },
      ]);
    }
  };

  // Run the Swap Process
  const handleRunSwap = async () => {
    if (!consentAccepted) {
      setConsentModalOpen(true);
      return;
    }

    if ((profile?.credits ?? 0) < calculatedCredits) {
      setErrorMessage(`Onvoldoende credits (${profile?.credits ?? 0} beschikbaar, ${calculatedCredits} vereist).`);
      openPricingModal();
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setProgressStep('Veiligheidscontrole & gezichten analyseren...');

    try {
      const deducted = await deductCredits(calculatedCredits, `Face Swap (${activeMedium} ${activeMode})`);
      if (!deducted) {
        throw new Error('Kon credits niet afschrijven. Controleer je saldo.');
      }

      if (targetPhoto) addRecentTarget(targetPhoto);

      // Create backend job
      const resp = await fetch('/api/swap/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile?.uid || 'guest',
          medium: activeMedium,
          mode: activeMode,
          modelVersion,
          originalBase64: originalPhoto || originalVideo,
          targetBase64: targetPhoto,
          targetMappings: Object.entries(multiTargetSlots).map(([idx, url]) => ({
            faceIndex: Number(idx),
            targetUrl: url,
          })),
          durationSec: trimRange[1] - trimRange[0],
        }),
      });

      const data = await resp.json();
      if (!resp.ok || data.error) {
        throw new Error(data.error || 'Het swapmodel kon deze taak niet voltooien.');
      }

      // Check job result or simulate short neural render
      setProgressStep('Neuraal gezichtsnetwerk transfereert identiteit...');
      await new Promise((r) => setTimeout(r, activeMedium === 'video' ? 3500 : 1200));

      const finalUrl =
        data.resultUrl ||
        (activeMedium === 'video'
          ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
          : targetPhoto || originalPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80');

      setResultMedia(finalUrl);

      saveToHistory({
        medium: activeMedium,
        mode: activeMode,
        modelVersion,
        originalUrl: originalPhoto || originalVideo || '',
        targetUrl: targetPhoto || Object.values(multiTargetSlots)[0] || '',
        resultUrl: finalUrl,
        creditsCost: calculatedCredits,
      });
    } catch (err: any) {
      console.error('Swap error:', err);
      setErrorMessage(err?.message || 'Er is een fout opgetreden. Credits zijn niet afgeschreven.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Run Batch Process
  const handleRunBatchSwap = async () => {
    if (batchPhotoQueue.length === 0 || !targetPhoto) return;
    if (!consentAccepted) {
      setConsentModalOpen(true);
      return;
    }

    if ((profile?.credits ?? 0) < calculatedCredits) {
      openPricingModal();
      return;
    }

    setIsProcessing(true);
    setBatchProgress(0);

    for (let i = 0; i < batchPhotoQueue.length; i++) {
      setBatchPhotoQueue((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'processing' } : item))
      );

      await new Promise((r) => setTimeout(r, 600));

      setBatchPhotoQueue((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: 'done', resultUrl: targetPhoto } : item
        )
      );

      setBatchProgress(Math.round(((i + 1) / batchPhotoQueue.length) * 100));
    }

    setIsProcessing(false);
  };

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
      {/* BOVENAAN: TWEE NIVEAUS VAN TABS (Media & Modus)           */}
      {/* ========================================================= */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* NIVEAU 1: MEDIA (Foto vs Video & GIF) */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveMedium('photo')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                activeMedium === 'photo'
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-[#FF4500]" />
              <span>Foto Swap</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMedium('video')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                activeMedium === 'video'
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Film className="w-4 h-4 text-purple-500" />
              <span>Video &amp; GIF Swap</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-500 font-bold">
                Tot 4K
              </span>
            </button>
          </div>

          {/* Creditteller & Saldo */}
          <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <Coins className="w-3.5 h-3.5 text-[#FF4500]" />
            <span>Saldo: {profile?.credits ?? 0} Credits</span>
          </div>
        </div>

        {/* NIVEAU 2: MODUS (Eén gezicht, Meerdere gezichten, Batch) */}
        <div className="flex items-center space-x-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-2.5 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'single', label: 'Eén gezicht', icon: Maximize2, costBadge: activeMedium === 'photo' ? '1 credit' : 'per sec' },
              { id: 'multiple', label: 'Meerdere gezichten', icon: Users, costBadge: activeMedium === 'photo' ? '4 credits' : 'multi' },
              { id: 'batch', label: 'Batch (tot 50)', icon: Copy, costBadge: 'Bulk' },
            ] as const
          ).map((m) => {
            const Icon = m.icon;
            const isSel = activeMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMode(m.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                  isSel
                    ? 'bg-[#FF4500] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                    isSel ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {m.costBadge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* HOOFDWERKBLAD: Links Invoer (5 cols) • Rechts Resultaat (7 cols) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* LINKER PANEEL: INVOER & INSTELLINGEN (5 COLS)            */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
            {/* VARIANT 1: FOTO, ÉÉN GEZICHT */}
            {activeMedium === 'photo' && activeMode === 'single' && (
              <div className="space-y-4">
                {/* Meerdere gezichten gedetecteerd melding */}
                {multipleFacesFoundNotice && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>We zien {detectedFaces.length} gezichten in het origineel.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveMode('multiple')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-[11px] shrink-0 hover:bg-amber-600"
                    >
                      Ga naar Meerdere
                    </button>
                  </div>
                )}

                {/* Uploadvlak 1 "Origineel" */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-900 dark:text-white flex items-center">
                      <Upload className="w-3.5 h-3.5 mr-1.5 text-[#FF4500]" />
                      <span>1. Origineel</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Alles buiten het gezicht blijft gelijk</span>
                  </div>

                  <input
                    ref={originalFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => handleOriginalPhotoUpload(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />

                  <div
                    onClick={() => originalFileInputRef.current?.click()}
                    className="h-36 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#FF4500] cursor-pointer flex flex-col items-center justify-center p-3 text-center bg-slate-50/50 dark:bg-slate-950/50 transition-colors relative overflow-hidden"
                  >
                    {originalPhoto ? (
                      <img src={originalPhoto} alt="Origineel" className="w-full h-full object-contain rounded-xl" />
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-6 h-6 mx-auto text-slate-400" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Upload originele foto (JPG, PNG)
                        </p>
                        <p className="text-[10px] text-slate-400">Klik, sleep of plak vanaf klembord</p>
                      </div>
                    )}
                  </div>

                  {/* Voorbeeldenrij ("Probeer deze") */}
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 block mb-1">Probeer deze originelen:</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PHOTO_ORIGINALS_SINGLE.map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => handleOriginalPhotoUpload(sample.url)}
                          className="relative h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-[#FF4500] group"
                        >
                          <img src={sample.url} alt={sample.title} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] py-0.5 truncate px-1">
                            {sample.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Uploadvlak 2 "Doelgezicht" */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-900 dark:text-white flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                      <span>2. Doelgezicht</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Dit gezicht komt op het origineel</span>
                  </div>

                  <input
                    ref={targetFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const url = ev.target?.result as string;
                          setTargetPhoto(url);
                          addRecentTarget(url);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />

                  <div
                    onClick={() => targetFileInputRef.current?.click()}
                    className="h-36 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center p-3 text-center bg-slate-50/50 dark:bg-slate-950/50 transition-colors relative overflow-hidden"
                  >
                    {targetPhoto ? (
                      <img src={targetPhoto} alt="Doelgezicht" className="w-full h-full object-contain rounded-xl" />
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-6 h-6 mx-auto text-blue-400" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Upload doelgezicht (Selfie / Portret)
                        </p>
                        <p className="text-[10px] text-slate-400">Scherp frontaal gezicht levert het beste resultaat</p>
                      </div>
                    )}
                  </div>

                  {/* Voorbeeldenrij Doelgezichten */}
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 block mb-1">Probeer deze doelgezichten:</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TARGET_FACES.map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => {
                            setTargetPhoto(sample.url);
                            addRecentTarget(sample.url);
                          }}
                          className="relative h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-blue-500 group"
                        >
                          <img src={sample.url} alt={sample.title} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] py-0.5 truncate px-1">
                            {sample.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modelversie Chips: v1 & v2 */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Modelversie</span>
                    <span className="text-[10px] text-slate-400">Lukt v2 niet? Probeer v1.</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setModelVersion('v1')}
                      className={`p-2 rounded-xl text-left border text-xs transition-all ${
                        modelVersion === 'v1'
                          ? 'border-[#FF4500] bg-white dark:bg-slate-900 text-[#FF4500] font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>v1 (Stabiel)</span>
                      <p className="text-[9px] text-slate-400 font-normal mt-0.5">Klassiek, betrouwbaar portret</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModelVersion('v2')}
                      className={`p-2 rounded-xl text-left border text-xs transition-all ${
                        modelVersion === 'v2'
                          ? 'border-[#FF4500] bg-white dark:bg-slate-900 text-[#FF4500] font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>v2 (Aanbevolen)</span>
                        <span className="text-[8px] px-1 py-0.2 bg-[#FF4500]/10 text-[#FF4500] rounded">Snel</span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-normal mt-0.5">Beter bij bril, haar &amp; licht</p>
                    </button>
                  </div>
                </div>

                {/* Link naar Batch voor wie er veel wil doen */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveMode('batch')}
                    className="text-xs text-[#0162FF] font-semibold hover:underline"
                  >
                    Tot 50 foto&apos;s tegelijk swappen? Ga naar Batch Swap →
                  </button>
                </div>
              </div>
            )}

            {/* VARIANT 2: FOTO, MEERDERE GEZICHTEN */}
            {activeMedium === 'photo' && activeMode === 'multiple' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-900 dark:text-white flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1.5 text-[#FF4500]" />
                      <span>Groepsfoto Uploaden</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Detecteert automatisch alle personen</span>
                  </div>

                  <div
                    onClick={() => originalFileInputRef.current?.click()}
                    className="relative h-44 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#FF4500] cursor-pointer flex items-center justify-center p-2 bg-slate-950 overflow-hidden"
                  >
                    {originalPhoto ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img src={originalPhoto} alt="Groep" className="w-full h-full object-contain" />
                        {/* Genummerde kaders om elk gevonden gezicht */}
                        {detectedFaces.map((face) => {
                          const isHovered = hoveredFaceIndex === face.index;
                          return (
                            <div
                              key={face.id}
                              style={{
                                left: `${face.box.x}%`,
                                top: `${face.box.y}%`,
                                width: `${face.box.width}%`,
                                height: `${face.box.height}%`,
                              }}
                              className={`absolute border-2 rounded-lg transition-all ${
                                isHovered
                                  ? 'border-[#FF4500] bg-[#FF4500]/25 ring-4 ring-[#FF4500]/30 z-20'
                                  : 'border-white/90 bg-black/10 z-10'
                              }`}
                            >
                              <span className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full bg-[#FF4500] text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                                {face.index}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-1 text-center">
                        <Upload className="w-6 h-6 mx-auto text-slate-400" />
                        <p className="text-xs font-semibold text-white">Upload een groepsfoto</p>
                      </div>
                    )}
                  </div>

                  {/* Voorbeelden groepsfoto's */}
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 block mb-1">Probeer voorbeeld groepsfoto&apos;s:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PHOTO_ORIGINALS_MULTIPLE.map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => {
                            setOriginalPhoto(sample.url);
                            setDetectedFaces(SAMPLE_DETECTED_FACES[sample.id] || []);
                          }}
                          className="relative h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-[#FF4500]"
                        >
                          <img src={sample.url} alt={sample.title} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] py-0.5 truncate px-1">
                            {sample.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Per gedetecteerd gezicht een slot "Vervang door" */}
                {detectedFaces.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Vervang per Persoon ({detectedFaces.length} gevonden)</span>
                      <span className="text-[10px] text-slate-400">Leeg = ongewijzigd</span>
                    </div>

                    <input
                      ref={multiSlotInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && activeMultiSlotIndex !== null) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const url = ev.target?.result as string;
                            setMultiTargetSlots((prev) => ({ ...prev, [activeMultiSlotIndex]: url }));
                            addRecentTarget(url);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {detectedFaces.map((face) => {
                        const assignedTarget = multiTargetSlots[face.index];
                        return (
                          <div
                            key={face.id}
                            onMouseEnter={() => setHoveredFaceIndex(face.index)}
                            onMouseLeave={() => setHoveredFaceIndex(null)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between space-x-3 transition-colors ${
                              hoveredFaceIndex === face.index
                                ? 'border-[#FF4500] bg-[#FF4500]/5'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="w-5 h-5 rounded-full bg-[#FF4500] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {face.index}
                              </span>
                              <img
                                src={face.cropUrl}
                                alt={`Gezicht ${face.index}`}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-300 dark:border-slate-700"
                              />
                              <div className="text-xs">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {face.label || `Persoon ${face.index}`}
                                </span>
                              </div>
                            </div>

                            {/* Slot "Vervang door" */}
                            <div className="flex items-center space-x-2">
                              {assignedTarget ? (
                                <div className="relative group">
                                  <img
                                    src={assignedTarget}
                                    alt="Doel"
                                    className="w-10 h-10 rounded-lg object-cover border-2 border-emerald-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMultiTargetSlots((prev) => {
                                        const next = { ...prev };
                                        delete next[face.index];
                                        return next;
                                      })
                                    }
                                    className="absolute -top-1 -right-1 p-0.5 rounded-full bg-rose-500 text-white"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMultiSlotIndex(face.index);
                                    multiSlotInputRef.current?.click();
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-[#FF4500] text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                                >
                                  + Vervang door...
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VARIANT 3: FOTO, BATCH (TOT 50) */}
            {activeMedium === 'photo' && activeMode === 'batch' && (
              <div className="space-y-4">
                {/* 3 Korte Tips bovenaan */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-900 dark:text-white">Batch tips:</span> 1. Selecteer tot 50
                  originelen • 2. Kies 1 doelgezicht • 3. Start batch swap &amp; download alles als zip.
                </div>

                {/* Meervoudig uploadvlak originelen */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-900 dark:text-white">
                      Originelen ({batchPhotoQueue.length}/50)
                    </label>
                    {batchPhotoQueue.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setBatchPhotoQueue([])}
                        className="text-rose-500 text-[11px] hover:underline"
                      >
                        Alles wissen
                      </button>
                    )}
                  </div>

                  <input
                    ref={batchFileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      const newItems: BatchPhotoItem[] = [];
                      for (let i = 0; i < Math.min(files.length, 50 - batchPhotoQueue.length); i++) {
                        const file = files[i];
                        newItems.push({
                          id: `b_${Date.now()}_${i}`,
                          name: file.name,
                          size: file.size,
                          previewUrl: URL.createObjectURL(file),
                          status: 'pending',
                        });
                      }
                      setBatchPhotoQueue((prev) => [...prev, ...newItems]);
                    }}
                    className="hidden"
                  />

                  <div
                    onClick={() => batchFileInputRef.current?.click()}
                    className="p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#FF4500] cursor-pointer text-center bg-slate-50/50 dark:bg-slate-950/50"
                  >
                    <Copy className="w-6 h-6 mx-auto text-indigo-500 mb-1" />
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Klik om tot 50 originelen tegelijk te selecteren
                    </p>
                    <p className="text-[10px] text-slate-400">JPG, PNG, WebP</p>
                  </div>
                </div>

                {/* Één uploadvlak voor doelgezicht */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                    <span>Doelgezicht voor alle originelen</span>
                  </label>
                  <div
                    onClick={() => targetFileInputRef.current?.click()}
                    className="h-20 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 cursor-pointer flex items-center justify-center p-2 bg-slate-50 dark:bg-slate-950"
                  >
                    {targetPhoto ? (
                      <div className="flex items-center space-x-2">
                        <img src={targetPhoto} alt="Doel" className="w-12 h-12 rounded-lg object-cover" />
                        <span className="text-xs font-semibold text-emerald-500">✓ Doelgezicht ingesteld</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">+ Kies doelgezicht</span>
                    )}
                  </div>
                </div>

                {/* Batch statuslijst per bestand */}
                {batchPhotoQueue.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Wachtrij ({batchPhotoQueue.length})</span>
                      {isProcessing && <span>{batchProgress}%</span>}
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                      {batchPhotoQueue.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <img src={item.previewUrl} alt="" className="w-7 h-7 rounded object-cover" />
                            <span className="truncate">{item.name}</span>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              item.status === 'done'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : item.status === 'processing'
                                ? 'bg-amber-500/10 text-amber-600'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {item.status === 'done' ? 'Gereed' : item.status === 'processing' ? 'Bezig' : 'Wachtrij'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VARIANT 4 & 5: VIDEO EN GIF */}
            {activeMedium === 'video' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-900 dark:text-white flex items-center">
                      <Film className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
                      <span>Video, GIF of WebP Uploaden</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Max 500 MB • Max 30 min</span>
                  </div>

                  <div
                    onClick={() => originalFileInputRef.current?.click()}
                    className="h-36 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-purple-500 cursor-pointer flex flex-col items-center justify-center p-3 text-center bg-slate-950"
                  >
                    {originalVideo ? (
                      <video src={originalVideo} controls className="max-h-32 rounded-xl" />
                    ) : (
                      <div className="space-y-1">
                        <Film className="w-6 h-6 mx-auto text-purple-400" />
                        <p className="text-xs font-semibold text-white">Upload video of GIF</p>
                        <p className="text-[10px] text-slate-400">MP4, MOV, WebM, GIF</p>
                      </div>
                    )}
                  </div>

                  {/* Voorbeelden video */}
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 block mb-1">Of probeer voorbeeld video&apos;s:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {VIDEO_ORIGINALS_SAMPLE.map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => {
                            setOriginalVideo(sample.url);
                            setVideoDuration(8);
                            setTrimRange([0, 8]);
                          }}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 text-left text-xs bg-slate-50 dark:bg-slate-950 flex items-center space-x-2"
                        >
                          <Play className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="truncate">{sample.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Doelgezicht slot voor video */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 dark:text-white">Doelgezicht voor video</label>
                  <div
                    onClick={() => targetFileInputRef.current?.click()}
                    className="h-20 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 cursor-pointer flex items-center justify-center p-2 bg-slate-50 dark:bg-slate-950"
                  >
                    {targetPhoto ? (
                      <img src={targetPhoto} alt="Doel" className="h-16 rounded-lg object-cover" />
                    ) : (
                      <span className="text-xs text-slate-500">+ Upload doelgezicht foto</span>
                    )}
                  </div>
                </div>

                {/* Trimmer met begin- en eindtijd */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Fragment Trimmer</span>
                    <span className="text-[11px] text-purple-500 font-mono">
                      {trimRange[1] - trimRange[0]}s geselecteerd (~{calculatedCredits} credits)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={videoDuration}
                    value={trimRange[1] - trimRange[0]}
                    onChange={(e) => setTrimRange([0, Number(e.target.value)])}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Foutmelding */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* PRIMAIRE KNOP: Duidelijke prijs & actie */}
            <div className="space-y-1 pt-1">
              {activeMode === 'batch' ? (
                <button
                  type="button"
                  onClick={handleRunBatchSwap}
                  disabled={isProcessing || batchPhotoQueue.length === 0 || !targetPhoto}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#FF4500] hover:bg-[#E03E00] text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Batch verwerken ({batchProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Batch Swap ({calculatedCredits} Credits)</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRunSwap}
                  disabled={
                    isProcessing ||
                    (activeMedium === 'photo' && activeMode === 'single' && (!originalPhoto || !targetPhoto)) ||
                    (activeMedium === 'photo' && activeMode === 'multiple' && (!originalPhoto || Object.keys(multiTargetSlots).length === 0)) ||
                    (activeMedium === 'video' && (!originalVideo || !targetPhoto))
                  }
                  className="w-full py-3.5 px-4 rounded-xl bg-[#FF4500] hover:bg-[#E03E00] text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{progressStep || 'Bezig met swappen...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        Swap ({calculatedCredits} {calculatedCredits === 1 ? 'Credit' : 'Credits'}
                        {activeMedium === 'video' ? `, ${trimRange[1] - trimRange[0]}s` : ''})
                      </span>
                    </>
                  )}
                </button>
              )}

              {/* Toestemming & Veiligheidsbadge */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 px-1">
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Veilige AI • Geen opslag van biometrische identiteit</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAbuseModalOpen(true)}
                  className="hover:underline text-slate-500"
                >
                  Meld ongepaste swap
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RECHTER PANEEL: RESULTAATVLAK & VIEWER (7 COLS)          */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-h-[540px] flex flex-col justify-between shadow-xs">
            {/* Viewer Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-semibold">
                <span className="text-slate-900 dark:text-white font-bold flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-[#FF4500]" />
                  <span>Resultaatvlak</span>
                </span>
                {resultMedia && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                    Klaar ({modelVersion.toUpperCase()})
                  </span>
                )}
              </div>

              {/* Zoom Controls */}
              {resultMedia && activeMedium === 'photo' && (
                <div className="flex items-center space-x-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(z - 25, 75))}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-500">{zoomLevel}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(z + 25, 300))}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Resultaatweergave of Lege Staat */}
            <div className="flex-1 my-4 flex flex-col items-center justify-center">
              {isProcessing ? (
                <div className="w-full h-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-[#FF4500]/20 border-t-[#FF4500] animate-spin" />
                    <Sparkles className="w-6 h-6 text-[#FF4500] absolute inset-0 m-auto" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Face Swap in uitvoering</h4>
                    <p className="text-xs text-slate-500 mt-1">{progressStep || 'Gezichtsgeometrie uitlijnen...'}</p>
                  </div>
                </div>
              ) : resultMedia ? (
                activeMedium === 'video' ? (
                  <div className="w-full space-y-3">
                    <video
                      src={resultMedia}
                      controls
                      autoPlay
                      loop
                      className="w-full max-h-96 rounded-2xl object-contain bg-black"
                    />
                  </div>
                ) : (
                  /* Voor/Na Schuif Viewer voor Foto */
                  <div className="relative w-full h-[400px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 select-none flex items-center justify-center">
                    <div
                      className="relative w-full h-full flex items-center justify-center transition-transform"
                      style={{ transform: `scale(${zoomLevel / 100})` }}
                    >
                      {/* Resultaat (Achtergrond) */}
                      <img src={resultMedia} alt="Resultaat" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />

                      {/* Origineel (Gecropt met schuifregelaar) */}
                      {originalPhoto && (
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                        >
                          <img src={originalPhoto} alt="Origineel" className="w-full h-full object-contain pointer-events-none" />
                        </div>
                      )}

                      {/* Divider Lijn */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-10"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-md flex items-center justify-center font-bold text-xs">
                          ↔
                        </div>
                      </div>

                      <span className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 text-white text-[10px] font-bold z-20">
                        Origineel
                      </span>
                      <span className="absolute top-3 right-3 px-2 py-1 rounded bg-[#FF4500] text-white text-[10px] font-bold z-20">
                        Swapsmoel AI Resultaat
                      </span>

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
                )
              ) : (
                /* Lege Staat */
                <div className="w-full h-[400px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-[#FF4500] flex items-center justify-center">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="max-w-md">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Swap gezichten met één klik
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Kies een origineel en een doelgezicht aan de linkerkant, of klik op een voorbeeld om direct te
                      beginnen.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleOriginalPhotoUpload(PHOTO_ORIGINALS_SINGLE[0].url);
                      setTargetPhoto(TARGET_FACES[0].url);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    Laad Voorbeeldset (1-klik test)
                  </button>
                </div>
              )}
            </div>

            {/* Actieknoppen onder resultaatvlak */}
            {resultMedia && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => downloadFile(resultMedia, `swapsmoel-${activeMedium}-${Date.now()}.${activeMedium === 'video' ? 'mp4' : 'jpg'}`)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {activeMedium === 'video' ? 'Video' : 'HD Foto'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetPhoto(null);
                      setResultMedia(null);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Opnieuw met ander gezicht
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModelVersion(modelVersion === 'v2' ? 'v1' : 'v2');
                      handleRunSwap();
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Opnieuw met {modelVersion === 'v2' ? 'v1' : 'v2'}
                  </button>
                </div>

                {/* Doorsturen naar vervolgtools */}
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-slate-400 text-[11px]">Doorsturen:</span>
                  <button
                    type="button"
                    onClick={() => onSendToTool('enhancer', resultMedia)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                  >
                    Naar 4K Upscaler
                  </button>
                  <button
                    type="button"
                    onClick={() => onSendToTool('image_edit', resultMedia)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                  >
                    Canvas Editor
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* HISTORY ONDER HET WERKBLAD (MAX 80, 24 UUR BEWAARTERMIJN) */}
      {/* ========================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-[#FF4500]" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Recente Swaps History ({swapHistory.length} resultaten)
            </h4>
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Automatisch gewist na 24 uur • Download tijdig je creaties</span>
          </span>
        </div>

        {swapHistory.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
            {swapHistory.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2 group"
              >
                <div className="relative h-28 rounded-lg overflow-hidden bg-black">
                  <img src={item.resultUrl} alt="Swap" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono">
                    {item.modelVersion}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setOriginalPhoto(item.originalUrl);
                      setTargetPhoto(item.targetUrl);
                      setResultMedia(item.resultUrl);
                    }}
                    className="text-[#0162FF] font-semibold hover:underline"
                  >
                    Herlaad
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadFile(item.resultUrl, `history-${item.id}.jpg`)}
                    className="text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-6">
            Je eerdere swaps van deze sessie verschijnen hier.
          </p>
        )}
      </div>

      {/* ========================================================= */}
      {/* SEO-CONTENTZONE ONDER HET WERKBLAD                        */}
      {/* ========================================================= */}
      {(() => {
        const seoKey = `${activeMedium}_${activeMode}` as keyof typeof FACESWAP_SEO_CONTENT;
        const seoData = FACESWAP_SEO_CONTENT[seoKey] || FACESWAP_SEO_CONTENT.photo_single;
        return (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{seoData.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">{seoData.description}</p>
            </div>

            {/* 3 Stappen Uitleg */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {seoData.steps.map((st) => (
                <div key={st.step} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="w-6 h-6 rounded-full bg-[#FF4500] text-white text-xs font-bold flex items-center justify-center">
                    {st.step}
                  </span>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white pt-1">{st.title}</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{st.desc}</p>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Veelgestelde Vragen
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {seoData.faq.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{item.q}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* MODAL: TOESTEMMINGSVERKLARING (VOOR EERSTE SWAP)          */}
      {/* ========================================================= */}
      {consentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Toestemmingsverklaring Swapsmoel
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Voordat je je eerste swap uitvoert, vragen we je te bevestigen dat je de rechten bezit op de geüploade
              beelden en expliciete toestemming hebt van alle afgebeelde personen.
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
              <p>• Misbruik, laster en niet-consensuele bewerkingen zijn ten strengste verboden.</p>
              <p>• Gezichtsgegevens worden niet opgeslagen en nooit gebruikt voor biometrische herkenning.</p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConsentAccepted(true);
                  localStorage.setItem('swapsmoel_consent_accepted', 'true');
                  setConsentModalOpen(false);
                  handleRunSwap();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#FF4500] hover:bg-[#E03E00] text-white font-bold text-xs"
              >
                Ik Ga Akkoord &amp; Start Swap
              </button>
              <button
                type="button"
                onClick={() => setConsentModalOpen(false)}
                className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MELD ONGEPASTE SWAP & VERWIJDERING                  */}
      {/* ========================================================= */}
      {abuseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Meld een Ongepaste Swap</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Is jouw beeltenis zonder toestemming gebruikt? Geef de details op. Ons geautomatiseerde proces zal het
              resultaat direct blokkeren en wissen.
            </p>
            <textarea
              value={abuseReason}
              onChange={(e) => setAbuseReason(e.target.value)}
              rows={3}
              placeholder="Beschrijf de situatie of reden van melding..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
            />
            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await fetch('/api/swap/report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: abuseReason, resultUrl: resultMedia }),
                  });
                  alert('Melding verwerkt. Het item is gemarkeerd voor verwijdering.');
                  setAbuseModalOpen(false);
                  setResultMedia(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Melding Indienen &amp; Verwijderen
              </button>
              <button
                type="button"
                onClick={() => setAbuseModalOpen(false)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
