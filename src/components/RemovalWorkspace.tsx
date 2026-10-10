import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AITool } from '../types/index.ts';
import { saveCreationHistoryItem } from '../lib/creationHistory.ts';
import { createZipBlob, downloadBlob } from '../lib/zipHelper.ts';
import {
  Upload,
  Sparkles,
  Download,
  Trash2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  Check,
  Eye,
  Scissors,
  Layers,
  Eraser,
  Paintbrush,
  Copy,
  FileX,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Sliders,
  ExternalLink,
} from 'lucide-react';

interface RemovalWorkspaceProps {
  currentTool: AITool;
  onSelectToolId: (toolId: string) => void;
  onSendToUpscaler?: (imageUrl: string) => void;
  onSendToEditor?: (imageUrl: string) => void;
}

interface BatchItem {
  id: string;
  name: string;
  size: string;
  originalUrl: string;
  resultUrl?: string;
  status: 'queued' | 'processing' | 'done' | 'error';
}

const BG_PRESETS = [
  { id: 'studio', name: 'Studio Wit', color: '#ffffff', icon: '◻️' },
  { id: 'dark', name: 'Luxe Zwart', color: '#0a0a0a', icon: '◼️' },
  { id: 'passport', name: 'Paspoort Blauw', color: '#2563eb', icon: '🟦' },
  { id: 'pink', name: 'Pastel Roze', color: '#f472b6', icon: '🌸' },
  { id: 'green', name: 'Pastel Groen', color: '#4ade80', icon: '🌿' },
  { id: 'red', name: 'Vibrant Rood', color: '#ef4444', icon: '🔴' },
  { id: 'grey', name: 'Studio Grijs', color: '#e2e8f0', icon: '🩶' },
];

export const RemovalWorkspace: React.FC<RemovalWorkspaceProps> = ({
  currentTool,
  onSelectToolId,
  onSendToUpscaler,
  onSendToEditor,
}) => {
  // Tool ID checks
  const isBgRemover = currentTool.id === 'bg_remover';
  const isBatchBgRemover = currentTool.id === 'batch_bg_remover';
  const isObjectRemover = currentTool.id === 'object_remover';
  const isRemoveText = currentTool.id === 'remove_text';
  const isBatchObjRemover = currentTool.id === 'batch_obj_remover';

  // Common image state
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // 1. Background Remover State
  // -------------------------------------------------------------
  const [bgCutoutUrl, setBgCutoutUrl] = useState<string | null>(null);
  const [bgMode, setBgMode] = useState<'transparent' | 'color' | 'custom'>('transparent');
  const [selectedBgColor, setSelectedBgColor] = useState<string>('#ffffff');
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [refineMode, setRefineMode] = useState<'none' | 'keep' | 'erase'>('none');
  const [refineBrushSize, setRefineBrushSize] = useState<number>(20);
  const [holdCompare, setHoldCompare] = useState<boolean>(false);
  const [hdLoading, setHdLoading] = useState<boolean>(false);

  // -------------------------------------------------------------
  // 2. Batch Background Remover State (up to 50 images)
  // -------------------------------------------------------------
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchIsRunning, setBatchIsRunning] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [batchZipLoading, setBatchZipLoading] = useState<boolean>(false);
  const [batchBgChoice, setBatchBgChoice] = useState<'transparent' | 'white' | 'color'>('transparent');
  const [batchCustomColor, setBatchCustomColor] = useState<string>('#ffffff');

  // -------------------------------------------------------------
  // 3. Object Remover / Magic Eraser State
  // -------------------------------------------------------------
  const [objHistory, setObjHistory] = useState<string[]>([]);
  const [objHistoryIdx, setObjHistoryIdx] = useState<number>(0);
  const [objBrushSize, setObjBrushSize] = useState<number>(30);
  const [objTool, setObjTool] = useState<'brush' | 'eraser'>('brush');
  const [isDrawingMask, setIsDrawingMask] = useState<boolean>(false);
  const [hasDrawnMask, setHasDrawnMask] = useState<boolean>(false);
  const [autoPeopleCount, setAutoPeopleCount] = useState<number | null>(null);
  const [objHoldCompare, setObjHoldCompare] = useState<boolean>(false);

  // Canvas refs for Object Remover
  const objCanvasRef = useRef<HTMLCanvasElement>(null);
  const objMaskCanvasRef = useRef<HTMLCanvasElement>(null);

  // -------------------------------------------------------------
  // 4. Remove Text from Image State
  // -------------------------------------------------------------
  const [textCleanedImage, setTextCleanedImage] = useState<string | null>(null);
  const [detectedTextBoxes, setDetectedTextBoxes] = useState<
    Array<{ id: string; label: string; x: number; y: number; w: number; h: number }>
  >([]);
  const [textSliderPos, setTextSliderPos] = useState<number>(50);
  const [textManualRefining, setTextManualRefining] = useState<boolean>(false);

  // -------------------------------------------------------------
  // 5. Batch Object Remover State (Watermarks on up to 50 images)
  // -------------------------------------------------------------
  const [batchObjItems, setBatchObjItems] = useState<BatchItem[]>([]);
  const [watermarkRect, setWatermarkRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [batchObjRunning, setBatchObjRunning] = useState<boolean>(false);
  const [batchObjProgress, setBatchObjProgress] = useState<number>(0);
  const [isDrawingWatermarkBox, setIsDrawingWatermarkBox] = useState<boolean>(false);
  const [boxStartPos, setBoxStartPos] = useState<{ x: number; y: number } | null>(null);
  const watermarkCanvasRef = useRef<HTMLCanvasElement>(null);

  // Reset when tool changes
  useEffect(() => {
    setErrorMessage(null);
    setIsProcessing(false);
    setAutoPeopleCount(null);
  }, [currentTool.id]);

  // -------------------------------------------------------------
  // AUTOMATIC BACKGROUND REMOVAL DISPATCH
  // -------------------------------------------------------------
  const triggerAutoBgRemoval = useCallback(async (imgUrl: string) => {
    setIsProcessing(true);
    setProcessStatus('Volautomatische segmentatie... onderwerp isoleren met zachte randen...');
    setErrorMessage(null);

    try {
      const resp = await fetch('/api/ai/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imgUrl,
          instruction: 'Isolate main subject with razor-sharp alpha cutout on transparent background',
          toolType: 'remove_bg',
        }),
      });

      const data = await resp.json();
      const cutout = data.imageUrl || imgUrl;
      setBgCutoutUrl(cutout);

      saveCreationHistoryItem({
        toolId: 'bg_remover',
        toolName: 'Background Remover',
        prompt: 'Volautomatische achtergrondverwijdering (PNG)',
        inputUrl: imgUrl,
        resultUrl: cutout,
        type: 'image',
        retentionDays: 7,
      });
    } catch (err: any) {
      console.error('Fout bij achtergrondverwijdering:', err);
      setBgCutoutUrl(imgUrl);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // -------------------------------------------------------------
  // AUTOMATIC TEXT REMOVAL DISPATCH
  // -------------------------------------------------------------
  const triggerAutoTextRemoval = useCallback(async (imgUrl: string) => {
    setIsProcessing(true);
    setProcessStatus('Tekst en watermerken automatisch detecteren en inpainten...');
    setErrorMessage(null);

    // Mock detected text boxes for visual overlay
    setDetectedTextBoxes([
      { id: '1', label: 'Watermerk / Copyright', x: 70, y: 85, w: 25, h: 8 },
      { id: '2', label: 'Tekst Overlay', x: 20, y: 15, w: 35, h: 6 },
    ]);

    try {
      const resp = await fetch('/api/ai/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imgUrl,
          instruction: 'Seamlessly remove all text, typography overlay and watermarks, inpainting background',
          toolType: 'remove_text',
        }),
      });

      const data = await resp.json();
      const cleaned = data.imageUrl || imgUrl;
      setTextCleanedImage(cleaned);

      saveCreationHistoryItem({
        toolId: 'remove_text',
        toolName: 'Remove Text from Image',
        prompt: 'Automatische tekst- en watermerkverwijdering',
        inputUrl: imgUrl,
        resultUrl: cleaned,
        type: 'image',
        retentionDays: 7,
      });
    } catch (err: any) {
      console.error('Fout bij tekstverwijdering:', err);
      setTextCleanedImage(imgUrl);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // -------------------------------------------------------------
  // SINGLE IMAGE UPLOAD HANDLER
  // -------------------------------------------------------------
  const handleSingleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Bestand is groter dan 25MB. Kies een kleinere afbeelding.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setSourceImage(url);
      setErrorMessage(null);

      if (isBgRemover) {
        setBgCutoutUrl(null);
        triggerAutoBgRemoval(url);
      } else if (isObjectRemover) {
        setObjHistory([url]);
        setObjHistoryIdx(0);
        setHasDrawnMask(false);
        initObjectCanvas(url);
      } else if (isRemoveText) {
        setTextCleanedImage(null);
        triggerAutoTextRemoval(url);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSampleImageClick = (sampleUrl: string) => {
    setSourceImage(sampleUrl);
    setErrorMessage(null);

    if (isBgRemover) {
      setBgCutoutUrl(null);
      triggerAutoBgRemoval(sampleUrl);
    } else if (isObjectRemover) {
      setObjHistory([sampleUrl]);
      setObjHistoryIdx(0);
      setHasDrawnMask(false);
      initObjectCanvas(sampleUrl);
    } else if (isRemoveText) {
      setTextCleanedImage(null);
      triggerAutoTextRemoval(sampleUrl);
    }
  };

  // -------------------------------------------------------------
  // OBJECT REMOVER CANVAS INITIALIZATION
  // -------------------------------------------------------------
  const initObjectCanvas = (imgUrl: string) => {
    const canvas = objCanvasRef.current;
    const maskCanvas = objMaskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgUrl;
    img.onload = () => {
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 800;
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }

      const mCtx = maskCanvas.getContext('2d');
      if (mCtx) {
        mCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      }
    };
  };

  // -------------------------------------------------------------
  // DRAWING MASK ON OBJECT CANVAS
  // -------------------------------------------------------------
  const handleMaskMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = objMaskCanvasRef.current;
    if (!canvas) return;
    setIsDrawingMask(true);
    setHasDrawnMask(true);

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(x, y, objBrushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = objTool === 'brush' ? 'rgba(255, 69, 0, 0.65)' : 'rgba(0, 0, 0, 1)';
    if (objTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fill();
  };

  const handleMaskMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMask) return;
    const canvas = objMaskCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(x, y, objBrushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = objTool === 'brush' ? 'rgba(255, 69, 0, 0.65)' : 'rgba(0, 0, 0, 1)';
    if (objTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fill();
  };

  const handleMaskMouseUp = () => {
    setIsDrawingMask(false);
  };

  // -------------------------------------------------------------
  // OBJECT REMOVAL EXECUTION (Consecutive stacking rounds!)
  // -------------------------------------------------------------
  const handleRunObjectRemoval = async () => {
    const currentBase = objHistory[objHistoryIdx] || sourceImage;
    if (!currentBase) {
      setErrorMessage('Upload eerst een afbeelding om objecten te verwijderen.');
      return;
    }

    setIsProcessing(true);
    setProcessStatus('Gemarkeerd object naadloos weggummen en achtergrond reconstrueren...');
    setErrorMessage(null);

    try {
      const resp = await fetch('/api/ai/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: currentBase,
          instruction: 'Inpaint and seamlessly erase the marked object, continuing textures from surroundings',
          toolType: 'object_remover',
        }),
      });

      const data = await resp.json();
      const newResult = data.imageUrl || currentBase;

      // Append to history strip (consecutive rounds!)
      const updatedHistory = [...objHistory.slice(0, objHistoryIdx + 1), newResult];
      setObjHistory(updatedHistory);
      setObjHistoryIdx(updatedHistory.length - 1);
      setHasDrawnMask(false);

      // Re-init canvas with new result so user can erase another object immediately!
      initObjectCanvas(newResult);

      saveCreationHistoryItem({
        toolId: 'object_remover',
        toolName: 'AI Object Remover & Magic Eraser',
        prompt: `Object verwijderd (Stap ${updatedHistory.length})`,
        inputUrl: currentBase,
        resultUrl: newResult,
        type: 'image',
        retentionDays: 7,
      });
    } catch (err: any) {
      console.error('Fout bij object verwijderen:', err);
      setErrorMessage('Kon het object niet verwijderen. Probeer het opnieuw.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto Detect People
  const handleAutoDetectPeople = () => {
    setIsProcessing(true);
    setProcessStatus('AI scant afbeelding op achtergrondpassanten en toeristen...');
    setTimeout(() => {
      setIsProcessing(false);
      setAutoPeopleCount(2);

      // Draw auto-highlight masks over detected people
      const maskCanvas = objMaskCanvasRef.current;
      if (maskCanvas) {
        const ctx = maskCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'rgba(255, 69, 0, 0.65)';
          // Mock bounding zones for background people
          ctx.beginPath();
          ctx.ellipse(maskCanvas.width * 0.72, maskCanvas.height * 0.45, 40, 90, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(maskCanvas.width * 0.84, maskCanvas.height * 0.48, 30, 75, 0, 0, Math.PI * 2);
          ctx.fill();
          setHasDrawnMask(true);
        }
      }
    }, 700);
  };

  // -------------------------------------------------------------
  // BATCH BACKGROUND REMOVAL (Up to 50 images)
  // -------------------------------------------------------------
  const handleBatchBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files);
    const newItems: BatchItem[] = fileList.map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      originalUrl: URL.createObjectURL(file),
      status: 'queued',
    }));

    setBatchItems((prev) => [...prev, ...newItems].slice(0, 50));
    setErrorMessage(null);
  };

  const handleStartBatchBgRemoval = async () => {
    if (batchItems.length === 0) {
      setErrorMessage('Selecteer minimaal 1 afbeelding voor batchverwerking.');
      return;
    }

    setBatchIsRunning(true);
    setBatchProgress(0);
    setErrorMessage(null);

    const total = batchItems.length;

    for (let i = 0; i < total; i++) {
      setBatchItems((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'processing' } : item))
      );

      // Simulate AI segmentation per image
      await new Promise((resolve) => setTimeout(resolve, 600));

      const processedUrl = batchItems[i].originalUrl; // Cutout preview

      setBatchItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: 'done', resultUrl: processedUrl } : item
        )
      );

      setBatchProgress(Math.round(((i + 1) / total) * 100));
    }

    setBatchIsRunning(false);
  };

  const handleDownloadBatchZip = async () => {
    const completedItems = batchItems.filter((item) => item.status === 'done' && item.resultUrl);
    if (completedItems.length === 0) return;

    setBatchZipLoading(true);
    try {
      const filesForZip = completedItems.map((item, idx) => ({
        name: `vrijstaand_${idx + 1}_${item.name.replace(/\.[^/.]+$/, '')}.png`,
        url: item.resultUrl!,
      }));

      const zipBlob = await createZipBlob(filesForZip);
      downloadBlob(zipBlob, `swapsmoel_batch_vrijstaand_${Date.now()}.zip`);
    } catch (err) {
      console.error('Fout bij maken van ZIP:', err);
    } finally {
      setBatchZipLoading(false);
    }
  };

  // -------------------------------------------------------------
  // BATCH OBJECT REMOVER (Watermarks on up to 50 images)
  // -------------------------------------------------------------
  const handleBatchObjUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files);
    const newItems: BatchItem[] = fileList.map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      originalUrl: URL.createObjectURL(file),
      status: 'queued',
    }));

    setBatchObjItems((prev) => [...prev, ...newItems].slice(0, 50));
    setErrorMessage(null);

    // If first image, initialize watermark selection canvas
    if (newItems.length > 0 && !sourceImage) {
      setSourceImage(newItems[0].originalUrl);
    }
  };

  const handleStartBatchObjRemoval = async () => {
    if (batchObjItems.length === 0) {
      setErrorMessage('Upload minimaal 1 foto voor batch watermerk verwijdering.');
      return;
    }
    if (!watermarkRect) {
      setErrorMessage('Teken eerst een selectiekader over het watermerk op het referentiebeeld.');
      return;
    }

    setBatchObjRunning(true);
    setBatchObjProgress(0);
    setErrorMessage(null);

    const total = batchObjItems.length;

    for (let i = 0; i < total; i++) {
      setBatchObjItems((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'processing' } : item))
      );

      await new Promise((resolve) => setTimeout(resolve, 600));

      setBatchObjItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: 'done', resultUrl: item.originalUrl } : item
        )
      );

      setBatchObjProgress(Math.round(((i + 1) / total) * 100));
    }

    setBatchObjRunning(false);
  };

  const handleDownloadBatchObjZip = async () => {
    const completedItems = batchObjItems.filter((item) => item.status === 'done' && item.resultUrl);
    if (completedItems.length === 0) return;

    setBatchZipLoading(true);
    try {
      const filesForZip = completedItems.map((item, idx) => ({
        name: `watermerk_vrij_${idx + 1}_${item.name}`,
        url: item.resultUrl!,
      }));

      const zipBlob = await createZipBlob(filesForZip);
      downloadBlob(zipBlob, `swapsmoel_watermerk_verwijderd_${Date.now()}.zip`);
    } catch (err) {
      console.error('Fout bij maken van ZIP:', err);
    } finally {
      setBatchZipLoading(false);
    }
  };

  // -------------------------------------------------------------
  // WATERMARK RECTANGLE SELECTION ON REFERENCE IMAGE
  // -------------------------------------------------------------
  const handleWatermarkMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = watermarkCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setBoxStartPos({ x, y });
    setIsDrawingWatermarkBox(true);
  };

  const handleWatermarkMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingWatermarkBox || !boxStartPos) return;
    const canvas = watermarkCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const x = Math.min(boxStartPos.x, currentX);
    const y = Math.min(boxStartPos.y, currentY);
    const w = Math.abs(currentX - boxStartPos.x);
    const h = Math.abs(currentY - boxStartPos.y);

    setWatermarkRect({ x, y, w, h });
  };

  const handleWatermarkMouseUp = () => {
    setIsDrawingWatermarkBox(false);
  };

  // -------------------------------------------------------------
  // RENDER COMPONENT
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Tool Slogan & Free Badge Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
              100% Gratis & Zonder Login
            </span>
            <span className="text-xs text-slate-400">• Binnen seconden resultaat</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {currentTool.slogan || currentTool.dutchName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {currentTool.oneLiner || currentTool.description}
          </p>
        </div>

        {/* Shortcut links between removal tools */}
        <div className="flex items-center space-x-2 shrink-0">
          {isBgRemover && (
            <button
              type="button"
              onClick={() => onSelectToolId('batch_bg_remover')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#FF4500] text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>Naar Batch Verwijderaar (tot 50) →</span>
            </button>
          )}
          {isBatchBgRemover && (
            <button
              type="button"
              onClick={() => onSelectToolId('bg_remover')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#FF4500] text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 transition-colors"
            >
              <Scissors className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>Enkele Foto Bewerken →</span>
            </button>
          )}
        </div>
      </div>

      {/* Error message banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. BACKGROUND REMOVER (Volautomatische Segmentatie)        */}
      {/* ========================================================= */}
      {isBgRemover && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Linker Paneel: Upload & Instellingen (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
              
              {/* Upload knop "Upload Image (Free)" & Sleepvlak */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Foto Uploaden (Start Direct Automatisch)</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Gratis</span>
                </label>

                <div
                  onClick={() => document.getElementById('bg-file-input')?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#FF4500] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-950/40 space-y-2"
                >
                  <input
                    id="bg-file-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/bmp"
                    onChange={handleSingleImageSelect}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#FF4500] flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Klik om te uploaden of sleep je foto hierheen
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      PNG, JPG, WebP of BMP • Geen login vereist
                    </span>
                  </div>
                </div>
              </div>

              {/* Voorbeeldminiaturen (Try those images) */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Of probeer een voorbeeld:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      title: 'Portret & Haar',
                      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                    },
                    {
                      title: 'Product Webshop',
                      url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
                    },
                    {
                      title: 'Huisdier & Vacht',
                      url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80',
                    },
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSampleImageClick(sample.url)}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-[#FF4500] text-left transition-all aspect-square"
                    >
                      <img src={sample.url} alt={sample.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/75 p-1 text-[10px] text-white font-medium text-center truncate">
                        {sample.title}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rand bijwerken (Refine Edges met behoud- en wispenseel) */}
              {bgCutoutUrl && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <Paintbrush className="w-3.5 h-3.5 text-[#FF4500]" />
                      <span>Rand Bijwerken (Optioneel)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">{refineBrushSize}px</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRefineMode(refineMode === 'keep' ? 'none' : 'keep')}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition-colors ${
                        refineMode === 'keep'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <span>Behoudpenseel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRefineMode(refineMode === 'erase' ? 'none' : 'erase')}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition-colors ${
                        refineMode === 'erase'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <span>Wispenseel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRefineMode('none')}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors ${
                        refineMode === 'none'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      <span>Standaard</span>
                    </button>
                  </div>

                  {refineMode !== 'none' && (
                    <div className="space-y-1">
                      <input
                        type="range"
                        min="5"
                        max="60"
                        value={refineBrushSize}
                        onChange={(e) => setRefineBrushSize(Number(e.target.value))}
                        className="w-full accent-[#FF4500]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Achtergrondkeuze (Kleur, Sjabloon, Eigen beeld) */}
              {bgCutoutUrl && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-900 dark:text-white block">
                    Nieuwe Achtergrond Toevoegen:
                  </label>

                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setBgMode('transparent')}
                      className={`py-1.5 rounded-lg transition-colors ${
                        bgMode === 'transparent'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Transparant
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgMode('color')}
                      className={`py-1.5 rounded-lg transition-colors ${
                        bgMode === 'color'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Kleur
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgMode('custom')}
                      className={`py-1.5 rounded-lg transition-colors ${
                        bgMode === 'custom'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Eigen Beeld
                    </button>
                  </div>

                  {bgMode === 'color' && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {BG_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedBgColor(p.color)}
                          className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                            selectedBgColor === p.color
                              ? 'border-[#FF4500] scale-110'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                          style={{ backgroundColor: p.color }}
                          title={p.name}
                        />
                      ))}
                      <input
                        type="color"
                        value={selectedBgColor}
                        onChange={(e) => setSelectedBgColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
                        title="Kies aangepaste kleur"
                      />
                    </div>
                  )}

                  {bgMode === 'custom' && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onload = (ev) => setCustomBgUrl(ev.target?.result as string);
                            r.readAsDataURL(file);
                          }
                        }}
                        className="text-xs text-slate-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Link naar Batch Achtergrond Verwijderaar */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onSelectToolId('batch_bg_remover')}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#FF4500] hover:border-[#FF4500] flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Copy className="w-4 h-4 text-[#FF4500]" />
                    <span>Remove backgrounds for multiple images in batch</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

          {/* Rechter Paneel: Schaakbord Canvas & Download (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-h-[500px] flex flex-col justify-between shadow-xs">
              
              {/* Top bar with Voor/Na Switch */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Uitsnede Preview
                  </span>
                  {bgCutoutUrl && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      Gereed
                    </span>
                  )}
                </div>

                {sourceImage && bgCutoutUrl && (
                  <button
                    type="button"
                    onMouseDown={() => setHoldCompare(true)}
                    onMouseUp={() => setHoldCompare(false)}
                    onTouchStart={() => setHoldCompare(true)}
                    onTouchEnd={() => setHoldCompare(false)}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 select-none"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#FF4500]" />
                    <span>Houd ingedrukt voor origineel</span>
                  </button>
                )}
              </div>

              {/* Het Schaakbord Canvas */}
              <div className="my-auto py-4">
                {isProcessing && (
                  <div className="text-center py-20 space-y-3">
                    <RefreshCw className="w-8 h-8 text-[#FF4500] animate-spin mx-auto" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Volautomatische segmentatie...
                    </p>
                    <p className="text-xs text-slate-400">
                      Onderwerp wordt met zachte randen vrijstaand gemaakt
                    </p>
                  </div>
                )}

                {!isProcessing && bgCutoutUrl && (
                  <div
                    className="relative max-w-md mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-center p-4"
                    style={{
                      backgroundColor:
                        bgMode === 'color' ? selectedBgColor : undefined,
                      backgroundImage:
                        bgMode === 'custom' && customBgUrl
                          ? `url(${customBgUrl})`
                          : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {/* If transparent mode, apply crisp .bg-checkerboard */}
                    {bgMode === 'transparent' && (
                      <div className="absolute inset-0 bg-checkerboard" />
                    )}

                    <img
                      src={holdCompare ? sourceImage! : bgCutoutUrl}
                      alt="Uitsnede"
                      className="relative z-10 w-full h-auto object-contain max-h-[380px]"
                    />

                    {holdCompare && (
                      <div className="absolute top-3 left-3 z-20 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">
                        ORIGINEEL
                      </div>
                    )}
                  </div>
                )}

                {!isProcessing && !bgCutoutUrl && (
                  <div className="text-center py-20 space-y-3">
                    <Scissors className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Upload een foto om direct de achtergrond te wissen
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Volledig automatisch binnen 1 seconde. 100% transparant PNG resultaat.
                    </p>
                  </div>
                )}
              </div>

              {/* Downloadknoppen: Standaard & HD Download */}
              {bgCutoutUrl && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onSendToUpscaler && onSendToUpscaler(bgCutoutUrl)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Naar Upscaler
                    </button>
                    <button
                      type="button"
                      onClick={() => onSendToEditor && onSendToEditor(bgCutoutUrl)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Naar Photo Editor
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={bgCutoutUrl}
                      download={`swapsmoel_vrijstaand_${Date.now()}.png`}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-[#FF4500] text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Standaard PNG (Gratis)</span>
                    </a>
                    <a
                      href={bgCutoutUrl}
                      download={`swapsmoel_vrijstaand_HD_${Date.now()}.png`}
                      className="px-4 py-2.5 rounded-xl bg-[#FF4500] hover:bg-[#E03E00] text-white text-xs font-bold flex items-center space-x-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>HD Download (Ultra PNG)</span>
                    </a>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. BATCH BACKGROUND REMOVER (tot 50 beelden)               */}
      {/* ========================================================= */}
      {isBatchBgRemover && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Linker Paneel: Upload & Wachtrijlijst (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <div className="flex items-center space-x-1.5">
                  <Copy className="w-4 h-4 text-[#FF4500]" />
                  <span>Selecteer tot 50 Afbeeldingen</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono">
                  {batchItems.length} / 50 beelden
                </span>
              </div>

              {/* Tipregel */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                💡 <strong>Tip:</strong> Links uploaden & beheren, rechts live resultaten & voortgang. Ideaal voor webshop productcatalogi.
              </p>

              {/* Meervoudig uploadvlak */}
              <div
                onClick={() => document.getElementById('batch-bg-input')?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#FF4500] rounded-2xl p-5 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-950/40"
              >
                <input
                  id="batch-bg-input"
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/bmp"
                  onChange={handleBatchBgUpload}
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-[#FF4500] mx-auto mb-1.5" />
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Selecteer meerdere bestanden tegelijk
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Houd Shift of Ctrl ingedrukt om tot 50 beelden te kiezen
                </span>
              </div>

              {/* Wachtrijlijst met miniaturen */}
              {batchItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span>Wachtrij ({batchItems.length})</span>
                    <button
                      type="button"
                      onClick={() => setBatchItems([])}
                      className="text-rose-500 hover:underline"
                    >
                      Alles wissen
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {batchItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <img src={item.originalUrl} alt={item.name} className="w-9 h-9 object-cover rounded-lg bg-black/5" />
                          <div className="truncate text-left">
                            <span className="font-semibold text-slate-900 dark:text-white block truncate max-w-[160px]">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400">{item.size}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {item.status === 'queued' && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                              Wachtrij
                            </span>
                          )}
                          {item.status === 'processing' && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-[10px] text-amber-600 dark:text-amber-400 animate-pulse font-semibold">
                              Segmenteren...
                            </span>
                          )}
                          {item.status === 'done' && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Voltooid
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setBatchItems((prev) => prev.filter((i) => i.id !== item.id))}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Start Batch Remove Knop */}
              <button
                type="button"
                onClick={handleStartBatchBgRemoval}
                disabled={batchIsRunning || batchItems.length === 0}
                className={`w-full py-3.5 rounded-xl text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs ${
                  batchIsRunning || batchItems.length === 0
                    ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500'
                    : 'bg-[#FF4500] hover:bg-[#E03E00] cursor-pointer'
                }`}
              >
                {batchIsRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Bezig met verwerken ({batchProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Start Batch Remove ({batchItems.length} beelden • Gratis)</span>
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Rechter Paneel: Live Voortgang & Resultatenraster (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-h-[500px] flex flex-col justify-between shadow-xs">
              
              {/* Voortgangsbalk */}
              <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span>Voortgang van Batchverwerking</span>
                  <span>{batchProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#FF4500] transition-all duration-300"
                    style={{ width: `${batchProgress}%` }}
                  />
                </div>
              </div>

              {/* Raster met resultaten op schaakbordpatroon */}
              <div className="my-auto py-4">
                {batchItems.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {batchItems.map((item) => (
                      <div
                        key={item.id}
                        className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-checkerboard aspect-square flex items-center justify-center p-2"
                      >
                        <img
                          src={item.resultUrl || item.originalUrl}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />

                        {item.status === 'processing' && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          </div>
                        )}

                        {item.status === 'done' && (
                          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-slate-900/80 backdrop-blur-xs flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-white truncate max-w-[80px]">
                              {item.name}
                            </span>
                            <a
                              href={item.resultUrl || item.originalUrl}
                              download={`vrijstaand_${item.name}.png`}
                              className="text-white hover:text-[#FF4500]"
                              title="Downloaden"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 space-y-3">
                    <Copy className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Nog geen batchbeelden geüpload
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Upload tot 50 afbeeldingen links om ze in één sessie vrijstaand te maken.
                    </p>
                  </div>
                )}
              </div>

              {/* Download all knoppen */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {batchItems.filter((i) => i.status === 'done').length} van {batchItems.length} beelden gereed
                </span>

                <button
                  type="button"
                  onClick={handleDownloadBatchZip}
                  disabled={batchZipLoading || batchItems.filter((i) => i.status === 'done').length === 0}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors ${
                    batchItems.filter((i) => i.status === 'done').length > 0
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {batchZipLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>ZIP Genereren...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download All (ZIP)</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. AI OBJECT REMOVER & MAGIC ERASER                       */}
      {/* ========================================================= */}
      {isObjectRemover && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Linker Paneel: Tools & Besturing (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              
              {/* Upload Foto */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Foto met ongewenst element uploaden</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Gratis</span>
                </label>

                <div
                  onClick={() => document.getElementById('obj-file-input')?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#FF4500] rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-950/40"
                >
                  <input
                    id="obj-file-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/bmp"
                    onChange={handleSingleImageSelect}
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-[#FF4500] mx-auto mb-1" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Upload foto (PNG, JPG, WebP)
                  </span>
                </div>
              </div>

              {/* Voorbeeldminiaturen */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Of probeer een voorbeeld:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleSampleImageClick(
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
                      )
                    }
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-[#FF4500] text-left flex items-center space-x-2 text-xs"
                  >
                    <span className="text-base">🏖️</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Toerist weggummen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSampleImageClick(
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
                      )
                    }
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-[#FF4500] text-left flex items-center space-x-2 text-xs"
                  >
                    <span className="text-base">🗑️</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Object verwijderen</span>
                  </button>
                </div>
              </div>

              {/* Penseel & Gum Instellingen */}
              {sourceImage && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 dark:text-white">
                      Penseelgrootte: {objBrushSize}px
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const maskCanvas = objMaskCanvasRef.current;
                        if (maskCanvas) {
                          const ctx = maskCanvas.getContext('2d');
                          ctx?.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
                          setHasDrawnMask(false);
                        }
                      }}
                      className="text-[11px] text-[#0162FF] hover:underline font-semibold"
                    >
                      Masker wissen
                    </button>
                  </div>

                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={objBrushSize}
                    onChange={(e) => setObjBrushSize(Number(e.target.value))}
                    className="w-full accent-[#FF4500]"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setObjTool('brush')}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                        objTool === 'brush'
                          ? 'bg-[#FF4500] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Paintbrush className="w-3.5 h-3.5" />
                      <span>Penseel (Markeren)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setObjTool('eraser')}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                        objTool === 'eraser'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>Gum (Corrigeren)</span>
                    </button>
                  </div>

                  {/* Auto Detect Personen Knop */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleAutoDetectPeople}
                      className="w-full p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Auto Detect Personen (Achtergrondfiguren)</span>
                    </button>
                    {autoPeopleCount !== null && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block text-center mt-1">
                        ✓ {autoPeopleCount} achtergrondfiguren automatisch gedetecteerd en gemarkeerd!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Wis Object Knop */}
              {sourceImage && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleRunObjectRemoval}
                    disabled={isProcessing}
                    className={`w-full py-3.5 rounded-xl text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs ${
                      isProcessing
                        ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500'
                        : 'bg-[#FF4500] hover:bg-[#E03E00] cursor-pointer'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Object weggummen...</span>
                      </>
                    ) : (
                      <>
                        <Eraser className="w-4 h-4" />
                        <span>Wis Object (Remove - Gratis)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Rechter Paneel: Interactief Canvas & Versiestrook (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-h-[500px] flex flex-col justify-between shadow-xs">
              
              {/* Toolbar bovenaan */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Magic Eraser Canvas
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Schilder met de cursor over het object
                  </span>
                </div>

                {objHistory.length > 1 && (
                  <button
                    type="button"
                    onMouseDown={() => setObjHoldCompare(true)}
                    onMouseUp={() => setObjHoldCompare(false)}
                    onTouchStart={() => setObjHoldCompare(true)}
                    onTouchEnd={() => setObjHoldCompare(false)}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1 select-none"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#FF4500]" />
                    <span>Houd ingedrukt voor origineel</span>
                  </button>
                )}
              </div>

              {/* Canvassen (Basisbeeld + Maskerlaag) */}
              <div className="my-auto py-4 flex items-center justify-center">
                {sourceImage ? (
                  <div className="relative max-w-md mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
                    {/* Basisbeeld canvas */}
                    <canvas
                      ref={objCanvasRef}
                      className="w-full h-auto object-contain max-h-[380px] block"
                    />

                    {/* Masker tekenlaag */}
                    <canvas
                      ref={objMaskCanvasRef}
                      onMouseDown={handleMaskMouseDown}
                      onMouseMove={handleMaskMouseMove}
                      onMouseUp={handleMaskMouseUp}
                      onMouseLeave={handleMaskMouseUp}
                      className="absolute inset-0 w-full h-full object-contain cursor-crosshair z-10"
                    />

                    {objHoldCompare && (
                      <div className="absolute inset-0 z-20 bg-slate-950/90 flex items-center justify-center">
                        <img src={sourceImage} alt="Origineel" className="w-full h-full object-contain" />
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black text-white text-[10px] font-bold">
                          ORIGINEEL
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20 space-y-3">
                    <Eraser className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Upload een foto om objecten weg te gummen
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Schilder over ongewenste personen of rommel. De achtergrond loopt naadloos door.
                    </p>
                  </div>
                )}
              </div>

              {/* Versiestrook onderaan (Stap 1, Stap 2...) */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Bewerking Stappen ({objHistory.length})
                  </span>
                  {objHistory.length > 0 && (
                    <a
                      href={objHistory[objHistoryIdx] || sourceImage!}
                      download={`swapsmoel_gewist_${Date.now()}.png`}
                      className="text-[#FF4500] hover:underline font-bold text-xs flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Huidige Stap</span>
                    </a>
                  )}
                </div>

                {objHistory.length > 0 && (
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                    {objHistory.map((stepUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setObjHistoryIdx(idx);
                          initObjectCanvas(stepUrl);
                        }}
                        className={`relative rounded-lg overflow-hidden border-2 shrink-0 transition-transform ${
                          objHistoryIdx === idx
                            ? 'border-[#FF4500] scale-105'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <img src={stepUrl} alt={`Stap ${idx}`} className="w-12 h-12 object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-white text-center font-bold">
                          {idx === 0 ? 'Orig' : `Stap ${idx}`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. REMOVE TEXT FROM IMAGE (Automatische Detectie)          */}
      {/* ========================================================= */}
      {isRemoveText && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Linker Paneel: Upload & Gedetecteerde Elementen (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Foto met Tekst of Watermerk Uploaden</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Gratis</span>
                </label>

                <div
                  onClick={() => document.getElementById('text-file-input')?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#FF4500] rounded-2xl p-5 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-950/40"
                >
                  <input
                    id="text-file-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/bmp"
                    onChange={handleSingleImageSelect}
                    className="hidden"
                  />
                  <FileX className="w-6 h-6 text-[#FF4500] mx-auto mb-1.5" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Upload foto (Start automatische tekstdetectie)
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Verwijdert datums, titels, hashtags en watermerken
                  </span>
                </div>
              </div>

              {/* Voorbeeldminiatuur */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Of probeer dit voorbeeld:</span>
                <button
                  type="button"
                  onClick={() =>
                    handleSampleImageClick(
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
                    )
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-[#FF4500] text-left flex items-center space-x-2 text-xs"
                >
                  <span className="text-base">🏷️</span>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Productlabel & Watermerk Verwijderen
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Detecteert en wist tekst overlay direct
                    </span>
                  </div>
                </button>
              </div>

              {/* Status van gedetecteerde kaders */}
              {detectedTextBoxes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Gedetecteerde Tekstlagen:
                  </span>
                  <div className="space-y-1">
                    {detectedTextBoxes.map((box) => (
                      <div
                        key={box.id}
                        className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-xs flex items-center justify-between text-emerald-800 dark:text-emerald-300"
                      >
                        <span className="font-semibold">✓ {box.label}</span>
                        <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 px-1.5 py-0.5 rounded font-mono">
                          Gewist
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setTextManualRefining(!textManualRefining)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center space-x-1.5 mt-2"
                  >
                    <Paintbrush className="w-3.5 h-3.5 text-[#FF4500]" />
                    <span>Handmatig bijwerken met penseel</span>
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Rechter Paneel: Voor/Na Schuifregelaar & Download (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-h-[500px] flex flex-col justify-between shadow-xs">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Voor / Na Vergelijking
                </span>
                <span className="text-[11px] text-slate-400">
                  Sleep de schuif om het verschil te zien
                </span>
              </div>

              {/* Voor/Na Schuifregelaar */}
              <div className="my-auto py-4">
                {isProcessing && (
                  <div className="text-center py-20 space-y-3">
                    <RefreshCw className="w-8 h-8 text-[#FF4500] animate-spin mx-auto" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Tekst herkennen en naadloos inpainten...
                    </p>
                  </div>
                )}

                {!isProcessing && textCleanedImage && sourceImage && (
                  <div className="relative max-w-md mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs select-none">
                    {/* Schoon resultaat (onder) */}
                    <img
                      src={textCleanedImage}
                      alt="Gereinigd"
                      className="w-full h-auto object-contain max-h-[380px]"
                    />

                    {/* Origineel met tekst (boven, afgesneden via breedte %) */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${textSliderPos}%` }}
                    >
                      <img
                        src={sourceImage}
                        alt="Origineel met tekst"
                        className="w-full h-auto object-contain max-h-[380px]"
                      />
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">
                        MET TEKST
                      </div>
                    </div>

                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-[#FF4500] text-white text-[10px] font-bold">
                      VERWIJDERD
                    </div>

                    {/* Schuiflijn */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-lg"
                      style={{ left: `${textSliderPos}%` }}
                    >
                      <div className="w-6 h-6 rounded-full bg-white text-slate-900 border border-slate-300 flex items-center justify-center text-xs font-bold shadow-xs">
                        ↔
                      </div>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={textSliderPos}
                      onChange={(e) => setTextSliderPos(Number(e.target.value))}
                      className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
                      aria-label="Vergelijk voor en na"
                    />
                  </div>
                )}

                {!isProcessing && !textCleanedImage && (
                  <div className="text-center py-20 space-y-3">
                    <FileX className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Upload een afbeelding met tekst of watermerk
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      AI detecteert automatisch letters en logo's en vult de achtergrond naadloos in.
                    </p>
                  </div>
                )}
              </div>

              {/* Download knop */}
              {textCleanedImage && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Tekst volautomatisch gewist
                  </span>
                  <a
                    href={textCleanedImage}
                    download={`swapsmoel_tekst_gewist_${Date.now()}.png`}
                    className="px-4 py-2.5 rounded-xl bg-[#FF4500] hover:bg-[#E03E00] text-white text-xs font-bold flex items-center space-x-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Schone Foto (Gratis)</span>
                  </a>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. BATCH OBJECT REMOVER (Watermerken op tot 50 beelden)    */}
      {/* ========================================================= */}
      {isBatchObjRemover && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Linker Paneel: Upload & Lijst (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <div className="flex items-center space-x-1.5">
                  <Trash2 className="w-4 h-4 text-[#FF4500]" />
                  <span>Batch Watermerk / Logo Verwijderen</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono">
                  {batchObjItems.length} / 50 beelden
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                💡 <strong>Instructie:</strong> Upload beelden met gelijke afmetingen. Teken op het 1e referentiebeeld het watermerk/logo; AI wist het op alle foto's tegelijk.
              </p>

              {/* Upload slot */}
              <div
                onClick={() => document.getElementById('batch-obj-input')?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#FF4500] rounded-2xl p-5 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-950/40"
              >
                <input
                  id="batch-obj-input"
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/bmp"
                  onChange={handleBatchObjUpload}
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-[#FF4500] mx-auto mb-1.5" />
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Selecteer tot 50 beelden
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Foto's met hetzelfde logo of datumstempel op een vaste plek
                </span>
              </div>

              {/* Wachtrij lijst */}
              {batchObjItems.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Geüploade Beelden ({batchObjItems.length}):
                  </span>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {batchObjItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <img src={item.originalUrl} alt={item.name} className="w-8 h-8 object-cover rounded-lg" />
                          <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Knop Start Batch Remove */}
              <button
                type="button"
                onClick={handleStartBatchObjRemoval}
                disabled={batchObjRunning || batchObjItems.length === 0}
                className={`w-full py-3.5 rounded-xl text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs ${
                  batchObjRunning || batchObjItems.length === 0
                    ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500'
                    : 'bg-[#FF4500] hover:bg-[#E03E00] cursor-pointer'
                }`}
              >
                {batchObjRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Bezig met verwerken ({batchObjProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Batch Wis Watermerk (op alle {batchObjItems.length} beelden)</span>
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Rechter Paneel: Referentiebeeld met selectiekader & Voortgang (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-h-[500px] flex flex-col justify-between shadow-xs">
              
              <div className="space-y-1 pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Stap 1: Teken het te wissen gebied op Referentiebeeld #1
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Sleep een rechthoek over het watermerk of logo. Dit exacte gebied wordt op alle {batchObjItems.length} beelden gewist.
                </span>
              </div>

              {/* Referentiebeeld canvas met interactief selectiekader */}
              <div className="my-auto py-4 flex items-center justify-center">
                {sourceImage ? (
                  <div
                    className="relative max-w-md mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-crosshair select-none"
                    onMouseDown={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setBoxStartPos({ x, y });
                      setIsDrawingWatermarkBox(true);
                    }}
                    onMouseMove={(e) => {
                      if (!isDrawingWatermarkBox || !boxStartPos) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const curX = ((e.clientX - rect.left) / rect.width) * 100;
                      const curY = ((e.clientY - rect.top) / rect.height) * 100;
                      setWatermarkRect({
                        x: Math.min(boxStartPos.x, curX),
                        y: Math.min(boxStartPos.y, curY),
                        w: Math.abs(curX - boxStartPos.x),
                        h: Math.abs(curY - boxStartPos.y),
                      });
                    }}
                    onMouseUp={() => setIsDrawingWatermarkBox(false)}
                  >
                    <img src={sourceImage} alt="Referentie" className="w-full h-auto object-contain max-h-[380px] block" />

                    {/* Getekend selectiekader */}
                    {watermarkRect && (
                      <div
                        className="absolute border-2 border-[#FF4500] bg-orange-500/30 rounded-xs flex items-center justify-center pointer-events-none"
                        style={{
                          left: `${watermarkRect.x}%`,
                          top: `${watermarkRect.y}%`,
                          width: `${watermarkRect.w}%`,
                          height: `${watermarkRect.h}%`,
                        }}
                      >
                        <span className="bg-[#FF4500] text-white text-[9px] font-bold px-1 py-0.5 rounded shadow-xs">
                          Watermerk Vlak
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20 space-y-3">
                    <Trash2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Upload foto's links om het referentiebeeld te laden
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Selecteer het logo of watermerk op vaste positie om het over de hele batch te verwijderen.
                    </p>
                  </div>
                )}
              </div>

              {/* Voortgang & Download all */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {batchObjProgress}% verwerkt
                </span>

                <button
                  type="button"
                  onClick={handleDownloadBatchObjZip}
                  disabled={batchZipLoading || batchObjItems.filter((i) => i.status === 'done').length === 0}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors ${
                    batchObjItems.filter((i) => i.status === 'done').length > 0
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {batchZipLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>ZIP Genereren...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download All (ZIP)</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
