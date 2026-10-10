import React, { useState } from 'react';
import { ProjectItem } from '../types/index.ts';
import {
  Share2,
  Copy,
  Check,
  Download,
  Sparkles,
  ExternalLink,
  X,
  Smartphone,
  Instagram,
} from 'lucide-react';

interface SocialShareModalProps {
  project: ProjectItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [caption, setCaption] = useState(
    project
      ? `Gemaakt met Swapsmoel.com AI Studio! ✨ "${project.prompt}" #Swapsmoel #AIart #FaceSwap #Creatief`
      : 'Gemaakt met Swapsmoel.com AI Studio!'
  );
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  if (!isOpen || !project) return null;

  const shareUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 3000);
  };

  const handleDownloadForPlatform = (platform: string) => {
    const link = document.createElement('a');
    link.href = project.resultUrl;
    link.download = `swapsmoel-${platform.toLowerCase()}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setActionFeedback(`Afbeelding gedownload voor ${platform}! Caption is gekopieerd.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project.title,
          text: caption,
          url: shareUrl,
        });
      } catch (e) {
        console.warn('Native share error:', e);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleGenerateViralCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const resp = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Genereer een pakkende, virale Nederlandse social media caption voor Instagram en TikTok over dit AI-kunstwerk: "${project.prompt}". Voeg relevante hashtags toe zoals #Swapsmoel #AI #Creatief.`,
          taskType: 'fast',
        }),
      });
      const data = await resp.json();
      if (data.text) {
        setCaption(data.text.trim());
      }
    } catch {
      setCaption(`Verbluffende transformatie met Swapsmoel.com! 🔥 Bekijk het resultaat van "${project.prompt}" #Swapsmoel #AIStudio #Nederland`);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                Deel op Social Media
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Direct delen naar Instagram, TikTok, Facebook & Twitter</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action feedback toast */}
        {actionFeedback && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in zoom-in-95">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Media Preview Thumbnail */}
        <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <img
            src={project.resultUrl}
            alt={project.title}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{project.title}</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">"{project.prompt}"</p>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mt-0.5 inline-block">
              {project.aspectRatio} Formaat
            </span>
          </div>
        </div>

        {/* Social Platforms Grid */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Kies Platform:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            
            {/* Instagram */}
            <button
              onClick={() => {
                handleDownloadForPlatform('Instagram');
                handleCopyCaption();
              }}
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs flex flex-col items-center justify-center space-y-1 transition-colors"
            >
              <Instagram className="w-4 h-4 text-pink-600" />
              <span>Instagram</span>
              <span className="text-[10px] text-slate-500">Post & Story</span>
            </button>

            {/* TikTok */}
            <button
              onClick={() => {
                handleDownloadForPlatform('TikTok');
                handleCopyCaption();
              }}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all"
            >
              <span className="text-base">🎵</span>
              <span>TikTok</span>
              <span className="text-[9px] text-cyan-600 dark:text-cyan-400">9:16 Video/Post</span>
            </button>

            {/* Twitter / X */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-800 dark:text-sky-200 font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all text-center"
            >
              <span className="text-base">𝕏</span>
              <span>Twitter / X</span>
              <span className="text-[9px] text-sky-600 dark:text-sky-300">Tweet openen</span>
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-800 dark:text-blue-200 font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all text-center"
            >
              <span className="text-base">👥</span>
              <span>Facebook</span>
              <span className="text-[9px] text-blue-600 dark:text-blue-300">Post delen</span>
            </a>

          </div>

          {/* Mobile Native Share Sheet */}
          <div className="mt-2.5">
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors"
            >
              <Smartphone className="w-4 h-4 text-amber-500" />
              <span>Deel via mobiel deelscherm (WhatsApp, Stories, etc.)</span>
            </button>
          </div>
        </div>

        {/* Caption & Hashtag Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Social Media Caption & Hashtags
            </label>
            <button
              onClick={handleGenerateViralCaption}
              disabled={isGeneratingCaption}
              className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-1 hover:underline"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isGeneratingCaption ? 'AI genereert...' : 'Genereer AI Caption'}</span>
            </button>
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 outline-none focus:ring-1 focus:ring-amber-400"
          />

          <div className="flex justify-between items-center text-xs">
            <button
              onClick={handleCopyCaption}
              className="text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center space-x-1"
            >
              {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCaption ? 'Gekopieerd!' : 'Kopieer Caption & Hashtags'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center space-x-1"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Gekopieerd' : 'Kopieer Swapsmoel Link'}</span>
            </button>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs"
          >
            Sluiten
          </button>
        </div>

      </div>
    </div>
  );
};
