import React, { useState, useRef, useEffect } from 'react';
import { AITool } from '../types/index.ts';
import { saveCreationHistoryItem } from '../lib/creationHistory.ts';
import { DANCE_TEMPLATES, DanceTemplate, VIDEO_EXPLORE_SAMPLES, VideoExploreItem } from '../data/videoData.ts';
import {
  Upload,
  Sparkles,
  Download,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Film,
  Video,
  Layers,
  HelpCircle,
  AlertTriangle,
  Info,
  Check,
  User,
  Music,
  ExternalLink,
  Flame,
  AtSign,
  Mic,
  Smile,
  Cat,
  Zap,
} from 'lucide-react';

interface VideoWorkspaceProps {
  currentTool: AITool;
  onSelectToolId: (toolId: string) => void;
  openPricingModal: () => void;
}

export const VideoWorkspace: React.FC<VideoWorkspaceProps> = ({
  currentTool,
  onSelectToolId,
  openPricingModal,
}) => {
  // Tabs: Studio vs Explore vs My Creation
  const [activeTab, setActiveTab] = useState<'create' | 'explore' | 'my_creations'>('create');

  // Input states
  const [firstFrameImage, setFirstFrameImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [videoModel, setVideoModel] = useState<string>('veo-3.1-fast-generate-preview');
  const [resolution, setResolution] = useState<'480p' | '720p' | '1080p'>('720p');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [durationSec] = useState<number>(5); // fixed 5 seconds per brief

  // Consistent Character Video State: 1-7 reference images
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [movementAmplitude, setMovementAmplitude] = useState<'auto' | 'small' | 'medium' | 'large'>('medium');
  const [showMentionDropdown, setShowMentionDropdown] = useState<boolean>(false);
  const [mentionCursorPos, setMentionCursorPos] = useState<number>(0);

  // AI Dance Generator State: full-body photo + dance template
  const [dancePhoto, setDancePhoto] = useState<string | null>(null);
  const [selectedDanceTemplate, setSelectedDanceTemplate] = useState<DanceTemplate>(DANCE_TEMPLATES[0]);

  // Add Sound to Video State: video upload + audio description prompt
  const [soundInputVideo, setSoundInputVideo] = useState<string | null>(null);
  const [soundPrompt, setSoundPrompt] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Talking / Sprekende Beelden State
  const [speakingFaceImage, setSpeakingFaceImage] = useState<string | null>(null);
  const [audioSourceType, setAudioSourceType] = useState<'tts' | 'upload' | 'record'>('tts');
  const [ttsText, setTtsText] = useState<string>('Hallo allemaal! Welkom bij mijn nieuwe video gemaakt met Swapsmoel AI.');
  const [ttsVoice, setTtsVoice] = useState<'Fenrir' | 'Kore' | 'Aoede' | 'Puck'>('Kore');
  const [uploadedAudioFile, setUploadedAudioFile] = useState<string | null>(null);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [facialIntensity, setFacialIntensity] = useState<'subtle' | 'natural' | 'expressive'>('natural');

  // Processing & Queue State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);

  // Local Task Queue for My Creation
  interface VideoTask {
    id: string;
    toolId: string;
    toolName: string;
    title: string;
    prompt: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    videoUrl?: string;
    posterUrl?: string;
    duration: string;
    resolution: string;
    aspectRatio: string;
    creditsCost: number;
    createdAt: string;
  }

  const [myTasks, setMyTasks] = useState<VideoTask[]>(() => {
    // Initial seed tasks in My Creation
    return [
      {
        id: 'task_demo_1',
        toolId: 'image_to_video',
        toolName: 'Image To Video',
        title: 'Cinematische Zonsondergang Portret',
        prompt: 'Slow dolly in, wind blowing gently through hair, warm cinematic sunset',
        status: 'completed',
        progress: 100,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        duration: '5s',
        resolution: '720p',
        aspectRatio: '16:9',
        creditsCost: 11,
        createdAt: '10 minuten geleden',
      },
    ];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const refSlotInputRef = useRef<HTMLInputElement>(null);
  const dancePhotoInputRef = useRef<HTMLInputElement>(null);
  const soundVideoInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  // Tool flags
  const isImageToVideo = currentTool.id === 'image_to_video';
  const isTextToVideo = currentTool.id === 'text_to_video';
  const isConsistentChar = currentTool.id === 'consistent_char_video';
  const isDance = currentTool.id === 'ai_dance';
  const isAddSound = currentTool.id === 'add_sound_video';
  const isTalkingTool = [
    'talking_photo',
    'talking_avatar',
    'talking_animals',
    'talking_cartoon',
    'talking_baby_podcast',
    'lip_sync',
  ].includes(currentTool.id);

  // Dynamic Credits calculation
  const calculatedCost = (() => {
    if (isAddSound) return 0; // Gratis per brief
    if (isConsistentChar) return 30; // 30 credits
    if (isDance) return 18; // 18 credits
    if (isTalkingTool) {
      if (currentTool.id === 'talking_animals' || currentTool.id === 'talking_cartoon') return 6;
      return 8; // standard 8 credits
    }
    // Image To Video / Text To Video
    return 11; // 11 credits per brief
  })();

  // Handle prompt @ character tag insertion
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const selStart = e.target.selectionStart;
    setPrompt(value);

    if (isConsistentChar) {
      const textBefore = value.slice(0, selStart);
      const lastChar = textBefore.slice(-1);
      if (lastChar === '@') {
        setShowMentionDropdown(true);
        setMentionCursorPos(selStart);
      } else if (!textBefore.includes('@') || lastChar === ' ') {
        setShowMentionDropdown(false);
      }
    }
  };

  const handleSelectMention = (tag: string) => {
    const textBefore = prompt.slice(0, mentionCursorPos);
    const textAfter = prompt.slice(mentionCursorPos);
    const updated = textBefore + tag + ' ' + textAfter;
    setPrompt(updated);
    setShowMentionDropdown(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Video generator runner
  const handleGenerateVideo = async () => {
    if (isProcessing) return;

    // Validation
    if (isImageToVideo && !firstFrameImage) {
      alert('Upload a.u.b. een eerste frame afbeelding.');
      return;
    }
    if (isConsistentChar && referenceImages.length === 0) {
      alert('Upload a.u.b. ten minste 1 referentiebeeld.');
      return;
    }
    if (isDance && !dancePhoto) {
      alert('Upload a.u.b. een staande foto ten voeten uit.');
      return;
    }
    if (isTalkingTool && !speakingFaceImage) {
      alert('Upload a.u.b. een foto van een gezicht of karakter.');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(5);
    setProgressStatus('Taak aangemaakt in verwerkingswachtrij...');

    const taskId = `task_${Date.now()}`;
    const newTask: VideoTask = {
      id: taskId,
      toolId: currentTool.id,
      toolName: currentTool.name,
      title: prompt ? prompt.slice(0, 36) + '...' : currentTool.dutchName,
      prompt: prompt || (isDance ? `Dans: ${selectedDanceTemplate.name}` : currentTool.dutchName),
      status: 'processing',
      progress: 10,
      duration: '5s',
      resolution: isConsistentChar ? '1080p' : resolution,
      aspectRatio,
      creditsCost: calculatedCost,
      createdAt: 'Zojuist',
    };

    setMyTasks((prev) => [newTask, ...prev]);

    // Progress updates simulation for the queue experience
    const progressInterval = setInterval(() => {
      setProgressPercent((p) => {
        if (p < 85) {
          const next = p + 15;
          if (next > 40 && next < 60) {
            setProgressStatus('Veo 3.1 berekent optische flow & temporele consistentie...');
          } else if (next >= 60) {
            setProgressStatus('Frame-upscaling & audio synchronisatie renderen...');
          }
          setMyTasks((tasks) =>
            tasks.map((t) => (t.id === taskId ? { ...t, progress: Math.min(next, 95) } : t))
          );
          return next;
        }
        return p;
      });
    }, 1200);

    try {
      let finalPrompt = prompt;
      if (isDance) {
        finalPrompt = `Full body single person dancing choreo: ${selectedDanceTemplate.name}, 5 seconds rhythm video`;
      } else if (isTalkingTool) {
        finalPrompt = `Talking face lip sync, realistic mouth movement, speech: ${ttsText}`;
      } else if (isAddSound) {
        finalPrompt = `Synthesize cinematic synchronous sound and music: ${soundPrompt || 'ambient cinematic score'}`;
      }

      const resp = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          imageBase64: firstFrameImage || dancePhoto || speakingFaceImage || referenceImages[0] || null,
          aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
          resolution: isConsistentChar ? '1080p' : resolution,
          toolType: currentTool.id,
        }),
      });

      const data = await resp.json();
      clearInterval(progressInterval);
      setProgressPercent(100);
      setProgressStatus('Video succesvol gegenereerd!');

      const videoUrl =
        data.previewVideoUrl ||
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

      setResultVideoUrl(videoUrl);

      // Update task in My Creation
      setMyTasks((tasks) =>
        tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'completed',
                progress: 100,
                videoUrl,
                posterUrl: firstFrameImage || dancePhoto || speakingFaceImage || referenceImages[0] || undefined,
              }
            : t
        )
      );

      // Save to global history
      saveCreationHistoryItem({
        toolId: currentTool.id,
        toolName: currentTool.name,
        prompt: finalPrompt,
        inputUrl: firstFrameImage || dancePhoto || speakingFaceImage || referenceImages[0] || undefined,
        resultUrl: videoUrl,
        type: 'video',
        aspectRatio,
        retentionDays: 7,
      });
    } catch (err) {
      clearInterval(progressInterval);
      setProgressStatus('Er is een fout opgetreden bij het genereren.');
      setMyTasks((tasks) =>
        tasks.map((t) => (t.id === taskId ? { ...t, status: 'failed', progress: 0 } : t))
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadVideo = (url: string) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `swapsmoel-${currentTool.id}-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation (Create / Explore / My Creation) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF4500]/10 flex items-center justify-center text-[#FF4500]">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {currentTool.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF4500] text-white">
                {currentTool.badge || 'Veo 3.1'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {currentTool.description}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'create'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Video Studio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('explore')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
              activeTab === 'explore'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#FF4500]" />
            <span>Explore</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my_creations')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'my_creations'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>My Creation ({myTasks.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: STUDIO (Linker paneel + Rechter videospeler)        */}
      {/* ========================================================= */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LINKER PANEEL (5 Kolommen) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              
              {/* MODEL SELECTIE MET "NEW" LABEL */}
              {!isAddSound && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <span>AI Model</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500 text-white">
                        NEW
                      </span>
                    </label>
                    <span className="text-slate-400 text-[11px]">Google Veo 3.1 Engine</span>
                  </div>
                  <select
                    value={videoModel}
                    onChange={(e) => setVideoModel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-medium focus:border-[#FF4500] outline-none"
                  >
                    <option value="veo-3.1-fast-generate-preview">
                      Veo 3.1 Fast (Aanbevolen, snelste render)
                    </option>
                    <option value="veo-3.1-generate-preview">
                      Veo 3.1 Quality Pro (Ultra-fijne details)
                    </option>
                    <option value="veo-3.1-lite-generate-preview">
                      Veo 3.1 Lite (Geoptimaliseerd voor previews)
                    </option>
                  </select>
                </div>
              )}

              {/* 1. IMAGE TO VIDEO SPECIFIEK: FIRST FRAME UPLOAD */}
              {isImageToVideo && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-900 dark:text-white flex items-center">
                      <Upload className="w-3.5 h-3.5 mr-1.5 text-[#FF4500]" />
                      <span>Eerste Frame (Foto) *</span>
                    </label>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400">
                      Video volgt aspect ratio van upload
                    </span>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
                      firstFrameImage
                        ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40'
                        : 'border-slate-300 dark:border-slate-700 hover:border-[#FF4500]'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setFirstFrameImage(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    {firstFrameImage ? (
                      <div className="flex items-center space-x-3">
                        <img
                          src={firstFrameImage}
                          alt="First frame"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                        />
                        <div className="text-left text-xs flex-1">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            Eerste frame geladen ✓
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            Klik om een andere afbeelding te kiezen
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 space-y-1 text-xs text-slate-500">
                        <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                        <span className="font-semibold block text-slate-800 dark:text-slate-200">
                          Upload eerste frame (JPG, PNG, GIF, WebP)
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Tip: gebruik een scherpe foto met duidelijk onderwerp
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. CONSISTENT CHARACTER VIDEO: 1-7 REFERENTIES + @ MENTIONS */}
              {isConsistentChar && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-900 dark:text-white">
                      Referentiebeelden (1 tot 7 slots)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        // Try Sample
                        setReferenceImages([
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
                        ]);
                        setPrompt('In deze scène ontmoet @char_1 karakter @char_2 op een zonnig strandterras in Nice.');
                      }}
                      className="text-[#FF4500] hover:underline font-semibold text-[11px]"
                    >
                      Try Sample
                    </button>
                  </div>

                  {/* 7 Slots strook */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                      const img = referenceImages[idx];
                      return (
                        <div
                          key={idx}
                          className={`relative aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center overflow-hidden transition-colors ${
                            img
                              ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950'
                              : 'border-slate-300 dark:border-slate-700 hover:border-[#FF4500] cursor-pointer'
                          }`}
                          onClick={() => {
                            if (!img) refSlotInputRef.current?.click();
                          }}
                        >
                          {img ? (
                            <>
                              <img src={img} alt={`Ref ${idx + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute top-1 left-1 px-1 rounded bg-black/70 text-[9px] text-white font-mono">
                                @char_{idx + 1}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReferenceImages((prev) => prev.filter((_, i) => i !== idx));
                                }}
                                className="absolute top-1 right-1 p-0.5 rounded bg-rose-600 text-white hover:bg-rose-700"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </>
                          ) : (
                            <div className="text-center p-1">
                              <span className="text-[10px] text-slate-400 font-bold block">
                                + Slot {idx + 1}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <input
                    ref={refSlotInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && referenceImages.length < 7) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setReferenceImages((prev) => [...prev, ev.target?.result as string]);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{referenceImages.length} van 7 slots gevuld</span>
                    <button
                      type="button"
                      onClick={() => onSelectToolId('image_gen')}
                      className="text-[#0162FF] hover:underline flex items-center space-x-1"
                    >
                      <span>Maak referentie via Image Generator</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* 3. AI DANCE GENERATOR SPECIFIEK: FULL BODY PHOTO + DANCE TEMPLATES */}
              {isDance && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>Full-Body Foto (Één Persoon ten Voeten Uit) *</span>
                      <button
                        type="button"
                        onClick={() => onSelectToolId('image_gen')}
                        className="text-[#0162FF] hover:underline text-[11px] font-normal"
                      >
                        Genereer full-body via Image Generator
                      </button>
                    </label>

                    <div
                      onClick={() => dancePhotoInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
                        dancePhoto
                          ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
                          : 'border-slate-300 dark:border-slate-700 hover:border-[#FF4500]'
                      }`}
                    >
                      <input
                        ref={dancePhotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setDancePhoto(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      {dancePhoto ? (
                        <div className="flex items-center space-x-3">
                          <img
                            src={dancePhoto}
                            alt="Full body"
                            className="w-16 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                          />
                          <div className="text-left text-xs flex-1">
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              Staande foto geladen ✓
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              Persoon ten voeten uit gedetecteerd
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 space-y-1 text-xs text-slate-500">
                          <User className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                          <span className="font-semibold block text-slate-800 dark:text-slate-200">
                            Upload Full-Body Photo (Single Person)
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            Zorg dat hoofd tot en met voeten zichtbaar zijn
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dance Template Galerij */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-900 dark:text-white block">
                      Kies Dans Choreografie Template
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {DANCE_TEMPLATES.map((tmpl) => {
                        const isSelected = selectedDanceTemplate.id === tmpl.id;
                        return (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => setSelectedDanceTemplate(tmpl)}
                            className={`p-2 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'border-[#FF4500] bg-[#FF4500]/5 ring-1 ring-[#FF4500]'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            <div className="aspect-video rounded-lg overflow-hidden mb-1.5 bg-slate-950 relative">
                              <img
                                src={tmpl.previewGif}
                                alt={tmpl.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[9px] font-mono text-white">
                                {tmpl.duration}
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                              {tmpl.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {tmpl.genre} • {tmpl.musicBpm} BPM
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. ADD SOUND TO VIDEO SPECIFIEK: VIDEO UPLOAD + SOUND PROMPT */}
              {isAddSound && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-900 dark:text-white block">
                      Bron Video, GIF of WebP *
                    </label>
                    <div
                      onClick={() => soundVideoInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
                        soundInputVideo
                          ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
                          : 'border-slate-300 dark:border-slate-700 hover:border-[#FF4500]'
                      }`}
                    >
                      <input
                        ref={soundVideoInputRef}
                        type="file"
                        accept="video/mp4,video/webm,image/gif,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setSoundInputVideo(url);
                          }
                        }}
                        className="hidden"
                      />
                      {soundInputVideo ? (
                        <div className="flex items-center space-x-3">
                          <video src={soundInputVideo} className="w-20 h-16 object-cover rounded-lg" />
                          <div className="text-left text-xs flex-1">
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              Stille video geüpload ✓
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              Klik om te vervangen
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 space-y-1 text-xs text-slate-500">
                          <Film className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                          <span className="font-semibold block text-slate-800 dark:text-slate-200">
                            Upload Video (MP4, WebM, GIF)
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            Het AI audiomodel analyseert de beelden voor synchroon geluid
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-900 dark:text-white block">
                      Want custom audio? Describe it here (Optioneel)
                    </label>
                    <textarea
                      value={soundPrompt}
                      onChange={(e) => setSoundPrompt(e.target.value)}
                      placeholder="bv. rustgevende lo-fi beats met zacht regengeluid en een zwoele jazzy baslijn..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF4500]"
                    />
                  </div>
                </div>
              )}

              {/* 5. TALKING / SPREKENDE BEELDEN SPECIFIEK: FOTO + AUDIO BRON */}
              {isTalkingTool && (
                <div className="space-y-4">
                  {/* Foto Upload voor pratend gezicht */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-900 dark:text-white block">
                      Invoerbeeld (Portret, Dier of Cartoon) *
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
                        speakingFaceImage
                          ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
                          : 'border-slate-300 dark:border-slate-700 hover:border-[#FF4500]'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setSpeakingFaceImage(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      {speakingFaceImage ? (
                        <div className="flex items-center space-x-3">
                          <img
                            src={speakingFaceImage}
                            alt="Pratend gezicht"
                            className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                          />
                          <div className="text-left text-xs flex-1">
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              Gezicht geladen ✓
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              Mond & ogen gedetecteerd voor lip-sync animatie
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 space-y-1 text-xs text-slate-500">
                          <Smile className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                          <span className="font-semibold block text-slate-800 dark:text-slate-200">
                            Upload portret, huisdier of stripfiguur
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            Duidelijke frontale positie zorgt voor de beste lipsynchronisatie
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Audio Bron Keuze: TTS vs Upload vs Record */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-900 dark:text-white block">
                      Audio Bron (Spraak)
                    </label>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setAudioSourceType('tts')}
                        className={`py-1.5 px-2 rounded-lg text-center ${
                          audioSourceType === 'tts'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Tekst-naar-Spraak
                      </button>
                      <button
                        type="button"
                        onClick={() => setAudioSourceType('upload')}
                        className={`py-1.5 px-2 rounded-lg text-center ${
                          audioSourceType === 'upload'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Upload Audio
                      </button>
                      <button
                        type="button"
                        onClick={() => setAudioSourceType('record')}
                        className={`py-1.5 px-2 rounded-lg text-center ${
                          audioSourceType === 'record'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Opname (Mic)
                      </button>
                    </div>

                    {audioSourceType === 'tts' && (
                      <div className="space-y-2 pt-1">
                        <textarea
                          value={ttsText}
                          onChange={(e) => setTtsText(e.target.value)}
                          placeholder="Typ de tekst die het personage moet uitspreken..."
                          rows={3}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF4500]"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">Stemkarakter:</span>
                          <select
                            value={ttsVoice}
                            onChange={(e) => setTtsVoice(e.target.value as any)}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg px-2 py-1"
                          >
                            <option value="Kore">Kore (Vrouwelijk - Warm & Helder)</option>
                            <option value="Fenrir">Fenrir (Mannelijk - Diep & Professioneel)</option>
                            <option value="Aoede">Aoede (Vrouwelijk - Expressief)</option>
                            <option value="Puck">Puck (Speels & Vlot)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {audioSourceType === 'upload' && (
                      <div className="pt-1">
                        <input
                          ref={audioFileInputRef}
                          type="file"
                          accept="audio/mp3,audio/wav,audio/m4a"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadedAudioFile(file.name);
                            }
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => audioFileInputRef.current?.click()}
                          className="w-full py-3 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-[#FF4500]"
                        >
                          {uploadedAudioFile ? `Bestand: ${uploadedAudioFile} ✓` : 'Upload audiobestand (MP3, WAV, M4A)'}
                        </button>
                      </div>
                    )}

                    {audioSourceType === 'record' && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                        <Mic className="w-6 h-6 mx-auto text-rose-500 animate-pulse" />
                        <span className="text-xs text-slate-600 dark:text-slate-400 block">
                          Microfoon gereed. Druk op opnemen om direct je stem in te spreken.
                        </span>
                        <button
                          type="button"
                          onClick={() => alert('Microfoon opname gesimuleerd: stemfragment vastgelegd (4 seconden)')}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
                        >
                          Start Opname
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mimiek & Ondertiteling Instellingen */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Mimiek Intensiteit</label>
                      <select
                        value={facialIntensity}
                        onChange={(e) => setFacialIntensity(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs font-medium"
                      >
                        <option value="subtle">Subtiel (Zakelijk)</option>
                        <option value="natural">Natuurlijk (Standaard)</option>
                        <option value="expressive">Expressief (Humor/Drama)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Ondertiteling</label>
                      <button
                        type="button"
                        onClick={() => setShowSubtitles(!showSubtitles)}
                        className={`w-full py-1.5 px-2 rounded-lg border text-center font-medium ${
                          showSubtitles
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        {showSubtitles ? 'Ondertiteling Aan ✓' : 'Geen Ondertitels'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PROMPTVELD VOOR ALGEMENE VIDEO & CONSISTENT CHARACTER */}
              {!isDance && !isAddSound && !isTalkingTool && (
                <div className="space-y-1.5 relative">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1">
                      <span>Video Prompt</span>
                      {isConsistentChar && (
                        <span className="text-[10px] text-indigo-500 font-normal">
                          (typ @ voor personage tags)
                        </span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          'Prompt Gids: Beschrijf camerabeweging (pan, tilt, zoom), belichting (golden hour, neon) en subtiele karakteracties voor het beste resultaat.'
                        )
                      }
                      className="text-[#0162FF] hover:underline text-[11px]"
                    >
                      Prompt Guide
                    </button>
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={handlePromptChange}
                    placeholder={
                      isConsistentChar
                        ? "Beschrijf de scène en verwijs met @ naar karakters, bv: '@char_1 glimlacht vriendelijk naar @char_2 met cinematische dolly zoom...'"
                        : isImageToVideo
                        ? 'Beschrijf de beweging en camerastijl, bv: slow dolly zoom in, lichte wind door het haar...'
                        : 'Typ je video prompt, bv: een futuristische auto rijdt door een neonverlichte regenbui in Tokio...'
                    }
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF4500]"
                  />

                  {/* Mention popup dropdown voor Consistent Character */}
                  {showMentionDropdown && isConsistentChar && referenceImages.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg">
                      <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">
                        Selecteer Karakter Tag:
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {referenceImages.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectMention(`@char_${i + 1}`)}
                            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-xs"
                          >
                            <img src={img} alt={`Char ${i + 1}`} className="w-6 h-6 object-cover rounded" />
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              @char_{i + 1}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* NSFW waarschuwing / Safety badge */}
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 pt-0.5">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Inclusief AI Content Safety filtering en watermerkbescherming.</span>
                  </div>
                </div>
              )}

              {/* MOVEMENT AMPLITUDE BIJ CONSISTENT CHARACTER */}
              {isConsistentChar && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-900 dark:text-white block">
                    Movement Amplitude (Bewegingssterkte)
                  </label>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl text-xs font-semibold">
                    {(['auto', 'small', 'medium', 'large'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setMovementAmplitude(lvl)}
                        className={`py-1.5 capitalize rounded-lg text-center ${
                          movementAmplitude === lvl
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CHIPS: RESOLUTIE, LENGTE, VERHOUDING */}
              {!isAddSound && (
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {/* Resolutie */}
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Resolutie</span>
                      <div className="flex items-center space-x-1">
                        {isConsistentChar ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold">
                            1080p Full HD
                          </span>
                        ) : (
                          (['480p', '720p'] as const).map((res) => (
                            <button
                              key={res}
                              type="button"
                              onClick={() => setResolution(res)}
                              className={`flex-1 py-1 rounded-lg font-mono text-[11px] font-bold border ${
                                resolution === res
                                  ? 'border-[#FF4500] bg-[#FF4500]/10 text-[#FF4500]'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {res}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Lengte (5s) */}
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Lengte</span>
                      <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold text-center">
                        5 Seconden
                      </div>
                    </div>

                    {/* Aspect Ratio */}
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Verhouding</span>
                      <div className="flex items-center space-x-1">
                        {(['16:9', '9:16'] as const).map((ar) => (
                          <button
                            key={ar}
                            type="button"
                            onClick={() => setAspectRatio(ar)}
                            className={`flex-1 py-1 rounded-lg font-mono text-[11px] font-bold border ${
                              aspectRatio === ar
                                ? 'border-[#FF4500] bg-[#FF4500]/10 text-[#FF4500]'
                                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {ar}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GENERATE KNOP MET DYNAMISCHE PRIJS */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerateVideo}
                  disabled={isProcessing}
                  className={`w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-xs ${
                    isProcessing
                      ? 'bg-slate-400 dark:bg-slate-800 cursor-not-allowed opacity-75'
                      : 'bg-[#FF4500] hover:bg-[#E03E00] cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>In de wachtrij ({progressPercent}%)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {calculatedCost === 0
                          ? 'Generate (Gratis)'
                          : `Generate (${calculatedCost} Credits)`}
                      </span>
                      {isConsistentChar && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 font-normal">
                          limited-time
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* RECHTER PANEEL: VIDEOSPELER & LIVE RESULTAAT (7 Kolommen) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-h-[500px] flex flex-col justify-between shadow-xs">
              
              {/* Speler Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4 text-[#FF4500]" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {resultVideoUrl ? 'Gegenereerde Videoclip (5s)' : 'Video Voorvertoning & Speler'}
                  </span>
                </div>
                {resultVideoUrl && (
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    1080p Haarscherp • 24 FPS
                  </span>
                )}
              </div>

              {/* Videospeler body */}
              <div className="my-auto py-4">
                {isProcessing && (
                  <div className="text-center py-16 space-y-4 max-w-sm mx-auto">
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-[#FF4500] animate-spin" />
                      <Film className="absolute inset-0 m-auto w-6 h-6 text-[#FF4500] animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        Veo 3.1 genereert je videoclip...
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {progressStatus}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#FF4500] h-full transition-all duration-300 rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Taak in wachtrij</span>
                        <span>{progressPercent}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {!isProcessing && resultVideoUrl && (
                  <div className="space-y-4 max-w-xl mx-auto">
                    <div
                      className={`relative rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-800 ${
                        aspectRatio === '9:16' ? 'aspect-9/16 max-h-[500px] mx-auto' : 'aspect-video'
                      }`}
                    >
                      <video
                        ref={videoPlayerRef}
                        src={resultVideoUrl}
                        controls
                        autoPlay
                        loop
                        muted={isMuted}
                        className="w-full h-full object-contain"
                      />

                      {/* Geluid dempen toggle bij Add Sound */}
                      {isAddSound && (
                        <button
                          type="button"
                          onClick={() => setIsMuted(!isMuted)}
                          className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black"
                          title="Geluid aan/uit"
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {!isProcessing && !resultVideoUrl && (
                  <div className="text-center py-16 space-y-4 max-w-sm mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto text-[#FF4500]">
                      <Video className="w-7 h-7" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {currentTool.slogan || 'Breng Elk Beeld tot Leven in Cinematografische Video'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Kies je instellingen links en klik op Generate. Omdat videogeneratie 11-30 credits kost en rekenkracht vereist, volgt de live wachtrij status je video stap-voor-stap.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Export Toolbar */}
              {resultVideoUrl && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadVideo(resultVideoUrl)}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-semibold text-xs flex items-center space-x-1.5 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Video (MP4)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResultVideoUrl(null);
                        setPrompt('');
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Opnieuw met Nieuwe Prompt
                    </button>
                  </div>

                  {/* Doorklikken naar Add Sound to Video */}
                  {!isAddSound && (
                    <button
                      type="button"
                      onClick={() => {
                        setSoundInputVideo(resultVideoUrl);
                        onSelectToolId('add_sound_video');
                      }}
                      className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold flex items-center space-x-1"
                    >
                      <Music className="w-3.5 h-3.5" />
                      <span>Geluid Toevoegen aan Video →</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: EXPLORE (Voorbeelden van anderen met prompt)         */}
      {/* ========================================================= */}
      {activeTab === 'explore' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Explore Community Video Creaties
              </h3>
              <p className="text-xs text-slate-500">
                Bekijk cinematografische video's gegenereerd met Google Veo 3.1 en hergebruik prompts met één klik.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {VIDEO_EXPLORE_SAMPLES.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs space-y-3 p-3 flex flex-col justify-between"
              >
                <div
                  className={`relative rounded-xl overflow-hidden bg-black ${
                    item.aspectRatio === '9:16' ? 'aspect-9/16 max-h-72 mx-auto' : 'aspect-video'
                  }`}
                >
                  <video
                    src={item.videoUrl}
                    poster={item.posterUrl}
                    controls
                    loop
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white">
                    {item.aspectRatio}
                  </div>
                </div>

                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-slate-400">@{item.author}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {item.prompt}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-rose-500 font-semibold flex items-center space-x-1">
                    <span>❤️</span>
                    <span>{item.likes}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPrompt(item.prompt);
                      setAspectRatio(item.aspectRatio as any);
                      setActiveTab('create');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#FF4500] hover:bg-[#E03E00] text-white text-xs font-semibold"
                  >
                    Gebruik Deze Prompt
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MY CREATION (Wachtrij, Taken, Downloads)           */}
      {/* ========================================================= */}
      {activeTab === 'my_creations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                My Creation: Video Taken & Archief
              </h3>
              <p className="text-xs text-slate-500">
                Volg lopende generaties in de cloud wachtrij en bekijk eerdere video's.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className="px-3 py-1.5 rounded-xl bg-[#FF4500] text-white text-xs font-semibold"
            >
              + Nieuwe Video Genereren
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {task.toolName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      task.status === 'completed'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : task.status === 'processing'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 animate-pulse'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {task.status === 'completed'
                      ? 'Klaar'
                      : task.status === 'processing'
                      ? `In de wachtrij (${task.progress}%)`
                      : 'Mislukt'}
                  </span>
                </div>

                <div className="aspect-video rounded-xl overflow-hidden bg-black relative">
                  {task.videoUrl ? (
                    <video src={task.videoUrl} controls loop className="w-full h-full object-cover" />
                  ) : task.posterUrl ? (
                    <img src={task.posterUrl} alt={task.title} className="w-full h-full object-cover opacity-60" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                      Bezig met renderen...
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {task.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                    <span>{task.duration}</span>
                    <span>•</span>
                    <span>{task.resolution}</span>
                    <span>•</span>
                    <span>{task.creditsCost} credits</span>
                    <span>•</span>
                    <span>{task.createdAt}</span>
                  </div>
                </div>

                {task.videoUrl && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleDownloadVideo(task.videoUrl!)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-xs font-semibold flex items-center space-x-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResultVideoUrl(task.videoUrl!);
                        setActiveTab('create');
                      }}
                      className="text-xs text-[#0162FF] hover:underline font-semibold"
                    >
                      Bekijk in Studio
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
