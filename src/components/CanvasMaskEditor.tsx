import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Paintbrush,
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';

interface CanvasMaskEditorProps {
  imageSrc: string;
  onApplyMask: (maskBase64: string | null) => void;
  onClose: () => void;
}

export const CanvasMaskEditor: React.FC<CanvasMaskEditorProps> = ({
  imageSrc,
  onApplyMask,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState<number>(25);
  const [zoom, setZoom] = useState<number>(1);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Initialize canvas with image dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 800;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initial]);
      setHistoryIndex(0);
    };
  }, [imageSrc]);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, current];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const targetIndex = historyIndex - 1;
      ctx.putImageData(history[targetIndex], 0, 0);
      setHistoryIndex(targetIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const targetIndex = historyIndex + 1;
      ctx.putImageData(history[targetIndex], 0, 0);
      setHistoryIndex(targetIndex);
    }
  };

  const handleReset = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255, 69, 0, 0.45)';
      ctx.strokeStyle = 'rgba(255, 69, 0, 0.45)';
    } else {
      ctx.globalCompositeOperation = 'destination-out';
    }
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const handleFinish = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      onApplyMask(null);
      return;
    }
    onApplyMask(canvas.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-between p-3 sm:p-5">
      {/* Top Toolbar */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTool('brush')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              tool === 'brush'
                ? 'bg-[#FF4500] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>Penseel</span>
          </button>

          <button
            onClick={() => setTool('eraser')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              tool === 'eraser'
                ? 'bg-[#FF4500] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Gum</span>
          </button>

          {/* Brush size slider */}
          <div className="hidden sm:flex items-center space-x-2 pl-3 border-l border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 text-[11px]">Dikte:</span>
            <input
              type="range"
              min="5"
              max="80"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 accent-[#FF4500] cursor-pointer"
            />
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 w-8">
              {brushSize}px
            </span>
          </div>
        </div>

        {/* Undo, Redo, Zoom, Reset */}
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            title="Ongedaan maken"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            title="Opnieuw"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex items-center space-x-1 px-1 border-l border-r border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Zoom uit"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Reset masker"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Annuleren"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="relative my-auto max-w-4xl max-h-[70vh] flex items-center justify-center overflow-auto rounded-xl select-none"
      >
        <div
          className="relative inline-block"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          <img
            src={imageSrc}
            alt="Source"
            className="max-h-[60vh] max-w-full block pointer-events-none rounded-lg"
          />
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none rounded-lg"
          />
        </div>
      </div>

      {/* Bottom Save Action */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs shadow-sm">
        <span className="text-slate-500 dark:text-slate-400">
          Kleur het gebied in dat je wilt aanpassen of verwijderen.
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
          >
            Annuleren
          </button>
          <button
            onClick={handleFinish}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-[#FF4500] hover:bg-[#E03E00] text-white font-semibold transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Masker Toepassen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
