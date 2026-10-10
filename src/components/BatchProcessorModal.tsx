import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  Layers,
  Upload,
  Coins,
  CheckCircle2,
  RefreshCw,
  Copy,
  Trash2,
  Download,
  AlertCircle,
} from 'lucide-react';

interface BatchProcessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  openPricingModal: () => void;
}

interface BatchFile {
  id: string;
  name: string;
  url: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  resultUrl?: string;
}

export const BatchProcessorModal: React.FC<BatchProcessorModalProps> = ({
  isOpen,
  onClose,
  openPricingModal,
}) => {
  const { profile, deductCredits } = useAuth();

  const [batchMode, setBatchMode] = useState<'remove_bg' | 'remove_obj'>('remove_bg');
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const costPerItem = 4;
  const totalCost = files.length * costPerItem;

  const handleMultipleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList = Array.from(e.target.files);

    const newFiles: BatchFile[] = fileList.map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      url: URL.createObjectURL(file),
      status: 'pending',
    }));

    setFiles((prev) => [...prev, ...newFiles].slice(0, 20)); // Limit to 20 files
  };

  const handleRunBatch = async () => {
    if (files.length === 0) return;

    if ((profile?.credits ?? 0) < totalCost) {
      setErrorMessage(`Onvoldoende credits! Je hebt ${totalCost} credits nodig voor deze batch.`);
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    const success = await deductCredits(totalCost, `Batch ${batchMode} (${files.length} bestanden)`);
    if (!success) {
      setIsProcessing(false);
      setErrorMessage('Transactie mislukt. Probeer het opnieuw.');
      return;
    }

    // Process items in sequence
    for (let i = 0; i < files.length; i++) {
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'processing' } : f))
      );

      // Simulate AI compute per item
      await new Promise((resolve) => setTimeout(resolve, 800));

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: 'done', resultUrl: f.url } : f
        )
      );
    }

    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-[#0162FF]/10 border border-[#0162FF]/20 text-[#0162FF] dark:text-[#6495ED]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
                Batch Verwerking Studio
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verwerk meerdere afbeeldingen tegelijk • E-commerce & Fotografen
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex space-x-3">
          <button
            onClick={() => setBatchMode('remove_bg')}
            className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center space-x-2 ${
              batchMode === 'remove_bg'
                ? 'bg-[#0162FF]/20 border-[#0162FF] text-[#0162FF] dark:text-[#6495ED]'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>Batch Background Remover</span>
          </button>

          <button
            onClick={() => setBatchMode('remove_obj')}
            className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center space-x-2 ${
              batchMode === 'remove_obj'
                ? 'bg-[#0162FF]/20 border-[#0162FF] text-[#0162FF] dark:text-[#6495ED]'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Batch Object Remover</span>
          </button>
        </div>

        {/* Multi upload area */}
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-950/60 relative">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleMultipleUpload}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            Klik om meerdere foto's tegelijk te selecteren (tot 20 bestanden)
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            JPG, PNG, WebP ondersteund
          </div>
        </div>

        {/* Uploaded Queue */}
        {files.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold px-1">
              <span>Bestandswachtrij ({files.length} geselecteerd)</span>
              <button
                onClick={() => setFiles([])}
                className="text-rose-500 hover:underline"
              >
                Alles wissen
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center space-x-2 text-xs"
                >
                  <img src={file.url} alt={file.name} className="w-8 h-8 rounded object-cover" />
                  <div className="truncate flex-1 text-[11px] text-slate-700 dark:text-slate-300">{file.name}</div>
                  {file.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {file.status === 'processing' && <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#FF4500]">
            <Coins className="w-4 h-4 text-[#FF4500]" />
            <span>Totaal: {totalCost} Credits ({files.length} x 4 cr)</span>
          </div>

          <button
            onClick={handleRunBatch}
            disabled={isProcessing || files.length === 0}
            className="py-2.5 px-5 rounded-xl bg-[#FF4500] hover:bg-[#E03E00] text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Batch Bezig...</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4 text-white" />
                <span>Start Batch Verwerking</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
