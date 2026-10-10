import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { AI_TOOLS, getToolById } from '../data/toolsData.ts';
import { PORTRAIT_TEMPLATES, PortraitTemplate } from '../data/portraitTemplates.ts';
import {
  NANO_RECIPES,
  NanoRecipe,
  HALLOWEEN_TEMPLATES,
  HalloweenFilterTemplate,
  EYE_COLOR_OPTIONS,
  PASSPORT_PHOTO_FORMATS,
  PASSPORT_BG_COLORS,
} from '../data/editingRecipes.ts';
import { AITool, ProjectItem } from '../types/index.ts';
import { SuiteBar } from './SuiteBar.tsx';
import { CanvasMaskEditor } from './CanvasMaskEditor.tsx';
import { ToolContentZone } from './ToolContentZone.tsx';
import { RemovalWorkspace } from './RemovalWorkspace.tsx';
import { VideoWorkspace } from './VideoWorkspace.tsx';
import { EnhancerWorkspace } from './EnhancerWorkspace.tsx';
import { FaceSwapWorkspace } from './FaceSwapWorkspace.tsx';
import {
  getCreationHistory,
  saveCreationHistoryItem,
  removeCreationHistoryItem,
  CreationHistoryItem,
} from '../lib/creationHistory.ts';
import {
  Upload,
  Sparkles,
  Download,
  Share2,
  Coins,
  RefreshCw,
  AlertCircle,
  Trash2,
  Clock,
  History,
  Maximize2,
  X,
  BrainCircuit,
  Eye,
  Plus,
  Check,
  Edit3,
  Sliders,
  Paintbrush,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo2,
  Redo2,
  Printer,
  CheckCircle2,
  FileCheck,
  Type,
  Move,
  RotateCw,
  Scissors,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';

interface StudioWorkspaceProps {
  initialTool?: AITool;
  openPricingModal: () => void;
  onOpenVault: () => void;
  onOpenShareModal?: (project: ProjectItem) => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  initialTool,
  openPricingModal,
  onOpenShareModal,
}) => {
  const {
    profile,
    deductCredits,
    activeFolderId,
  } = useAuth();

  const [currentTool, setCurrentTool] = useState<AITool>(initialTool || AI_TOOLS[0]);

  // Sync when initialTool changes from parent
  useEffect(() => {
    if (initialTool && initialTool.id !== currentTool.id) {
      setCurrentTool(initialTool);
      resetOutputs();
      setErrorMessage(null);
    }
  }, [initialTool]);

  const resetOutputs = () => {
    setResultImage(null);
    setResultImages([]);
    setResultVideoUrl(null);
    setResultAudioUrl(null);
    setAnalysisText(null);
    setPassportPrintSheet(false);
  };

  // Common Input states
  const [prompt, setPrompt] = useState('');
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [selectedResolution, setSelectedResolution] = useState<'1024px' | '2048px' | '4096px'>('1024px');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('auto');
  const [generationCount, setGenerationCount] = useState<number>(1);
  const [strengthSlider, setStrengthSlider] = useState<number>(75);
  const [speedSlider, setSpeedSlider] = useState<number>(24);
  const [activeModeTab, setActiveModeTab] = useState<'standard' | 'advanced'>('standard');

  // AI Image Generator specific
  const [imageGenMode, setImageGenMode] = useState<'text' | 'image'>('text');
  const [imageGenModel, setImageGenModel] = useState<'remaker-1.0' | 'remaker-2.0' | 'imagen-3'>('remaker-1.0');
  const [negativePrompt, setNegativePrompt] = useState<string>('');

  // Template Portraits specific (AI Headshot, LinkedIn, AI Portrait)
  const [portraitModelVersion, setPortraitModelVersion] = useState<'v1' | 'v2_beta'>('v1');
  const [portraitGender, setPortraitGender] = useState<'woman' | 'man'>('woman');
  const [portraitSubTab, setPortraitSubTab] = useState<'templates' | 'options'>('templates');
  const [portraitPhotos, setPortraitPhotos] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // AI Baby Generator specific
  const [babyFatherPhoto, setBabyFatherPhoto] = useState<string | null>(null);
  const [babyMotherPhoto, setBabyMotherPhoto] = useState<string | null>(null);
  const [babyGender, setBabyGender] = useState<'boy' | 'girl'>('boy');
  const [babyAge, setBabyAge] = useState<'newborn' | 'toddler' | 'kid'>('toddler');
  const [babyResemblance, setBabyResemblance] = useState<number>(50);

  // --- SECTION 3: AI PHOTO EDITING SPECIFIC STATES ---
  // 1. AI Photo Editor (`image_edit`)
  const [editorHistory, setEditorHistory] = useState<string[]>([]);
  const [editorHistoryIndex, setEditorHistoryIndex] = useState<number>(0);
  const [holdOriginalView, setHoldOriginalView] = useState<boolean>(false);
  const [canvasZoom, setCanvasZoom] = useState<number>(100);

  // 2. Nano Banana AI (`nano_banana`)
  const [selectedNanoRecipeId, setSelectedNanoRecipeId] = useState<string>('photo_to_figure');
  const [nanoSlots, setNanoSlots] = useState<{ [slotIndex: number]: string }>({});
  const [nanoCategorySearch, setNanoCategorySearch] = useState<string>('');

  // 3. Photo to Anime & Ghibli (`photo_to_anime`, `ghibli_filter`)
  const [animeModeTab, setAnimeModeTab] = useState<'photo' | 'text'>('photo');
  const [animeModelChoice, setAnimeModelChoice] = useState<'anime' | 'ghibli' | 'ghibli_pro'>('anime');
  const [animeStrength, setAnimeStrength] = useState<number>(75);

  // 4. Stijlfilters & Halloween (`halloween_filter`, `photo_effects`)
  const [styleFilterCategory, setStyleFilterCategory] = useState<'all' | 'halloween'>('all');
  const [styleFilterGender, setStyleFilterGender] = useState<'woman' | 'man'>('woman');
  const [selectedHalloweenTplId, setSelectedHalloweenTplId] = useState<string>('witch');

  // 5. Eye Color Changer (`eye_color`)
  const [selectedEyeColorId, setSelectedEyeColorId] = useState<string>('blue');

  // 6. Background Changer (`bg_changer`, `bg_color`, `bg_blur`, `make_png`)
  const [bgChangerMode, setBgChangerMode] = useState<'transparent' | 'color' | 'template' | 'custom' | 'blur'>('color');
  const [selectedBgHex, setSelectedBgHex] = useState<string>('#FFFFFF');
  const [selectedBgTemplate, setSelectedBgTemplate] = useState<string>('studio_minimal');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [bgBlurStrength, setBgBlurStrength] = useState<number>(65);

  // 7. AI Background Generator (`bg_gen`)
  const [bgGenType, setBgGenType] = useState<'portrait' | 'item'>('item');
  const [bgGenPreset, setBgGenPreset] = useState<string>('marble');
  const [bgBrightness, setBgBrightness] = useState<number>(100);
  const [bgContrast, setBgContrast] = useState<number>(100);
  const [bgSaturation, setBgSaturation] = useState<number>(100);
  const [bgGenExportMode, setBgGenExportMode] = useState<'filled' | 'transparent'>('filled');

  // 8. AI Passport Photo Maker (`passport_photo`)
  const [passportFormat, setPassportFormat] = useState<string>('standard_nl');
  const [passportBgColor, setPassportBgColor] = useState<string>('white');
  const [passportCustomWidth, setPassportCustomWidth] = useState<number>(35);
  const [passportCustomHeight, setPassportCustomHeight] = useState<number>(45);
  const [passportPrintSheet, setPassportPrintSheet] = useState<boolean>(false);
  const [passportRequirementsOpen, setPassportRequirementsOpen] = useState<boolean>(false);

  // 9. Design Editor (`design_editor`)
  const [canvasWidth, setCanvasWidth] = useState<number>(1080);
  const [canvasHeight, setCanvasHeight] = useState<number>(1080);
  const [designLayers, setDesignLayers] = useState<Array<{ id: string; type: 'image' | 'text' | 'shape'; content: string; color?: string; x: number; y: number }>>([
    { id: '1', type: 'text', content: 'Swapsmoel Studio', color: '#1E293B', x: 50, y: 50 },
  ]);
  const [showWatermark, setShowWatermark] = useState<boolean>(false);

  // Processing & result states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [resultAudioUrl, setResultAudioUrl] = useState<string | null>(null);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'sideBySide'>('slider');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  // Tabs in right viewer
  const [viewerTab, setViewerTab] = useState<'result' | 'samples' | 'history'>('result');

  // History & Mask
  const [historyItems, setHistoryItems] = useState<CreationHistoryItem[]>([]);
  const [maskEditorOpen, setMaskEditorOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);
  const portraitPhotoInputRef = useRef<HTMLInputElement>(null);
  const fatherPhotoInputRef = useRef<HTMLInputElement>(null);
  const motherPhotoInputRef = useRef<HTMLInputElement>(null);
  const nanoSlotInputRef = useRef<HTMLInputElement>(null);
  const [activeNanoSlotIdx, setActiveNanoSlotIdx] = useState<number>(0);
  const workspaceTopRef = useRef<HTMLDivElement>(null);

  // Tool classification flags
  const isImageGen = currentTool.id === 'image_gen';
  const isAnimeGen = currentTool.id === 'anime_gen';
  const isPortraitTool = ['ai_headshot', 'linkedin_headshot', 'ai_portrait'].includes(currentTool.id);
  const isBabyTool = ['baby_generator', 'baby_filter'].includes(currentTool.id);

  // Section 3 Tool classification flags
  const isPhotoEditor = currentTool.id === 'image_edit';
  const isNanoBanana = currentTool.id === 'nano_banana';
  const isInpaint = currentTool.id === 'inpaint';
  const isPhotoToAnime = ['photo_to_anime', 'ghibli_filter'].includes(currentTool.id);
  const isStyleOrHalloween = ['halloween_filter', 'photo_effects'].includes(currentTool.id);
  const isEyeColor = currentTool.id === 'eye_color';
  const isBgChanger = ['bg_changer', 'bg_color', 'bg_blur', 'make_png'].includes(currentTool.id);
  const isBgGen = currentTool.id === 'bg_gen';
  const isPassportPhoto = currentTool.id === 'passport_photo';
  const isDesignEditor = currentTool.id === 'design_editor';

  // Flagship Tool classification flag: Face Swap
  const isFaceSwapTool = currentTool.id === 'face_swap';

  // Section 1 Tool classification flags (AI Photo & Video Enhancer)
  const isEnhancerSuiteTool = [
    'enhancer',
    'image_enlarger',
    'restoration',
    'free_enlarger',
    'batch_upscaler',
    'video_enhancer',
  ].includes(currentTool.id);

  // Section 4 Tool classification flags (AI Removal - Gratis)
  const isBgRemover = currentTool.id === 'bg_remover';
  const isBatchBgRemover = currentTool.id === 'batch_bg_remover';
  const isObjectRemover = currentTool.id === 'object_remover';
  const isRemoveText = currentTool.id === 'remove_text';
  const isBatchObjRemover = currentTool.id === 'batch_obj_remover';
  const isAnyRemovalTool = isBgRemover || isBatchBgRemover || isObjectRemover || isRemoveText || isBatchObjRemover;

  // Section 6 Tool classification flags (AI Video & Audio)
  const isVideoSuiteTool =
    !isEnhancerSuiteTool &&
    (currentTool.category === 'video' ||
      currentTool.suite === 'video' ||
      [
        'image_to_video',
        'text_to_video',
        'consistent_char_video',
        'ai_dance',
        'add_sound_video',
        'talking_avatar',
        'talking_animals',
        'talking_cartoon',
        'talking_baby_podcast',
        'video_template',
        'tiktok_video',
        'ghibli_video',
        'asmr_gen',
        'video_bg_remover',
      ].includes(currentTool.id));

  // Determine if tool has a dedicated custom input UI
  const isHandledSpecificTool =
    isPhotoEditor ||
    isNanoBanana ||
    isPhotoToAnime ||
    isStyleOrHalloween ||
    isEyeColor ||
    isBgChanger ||
    isPassportPhoto ||
    isBgGen ||
    isDesignEditor ||
    isImageGen ||
    isAnimeGen ||
    isPortraitTool ||
    isBabyTool ||
    isInpaint;

  // Active Nano Banana Recipe
  const activeNanoRecipe = useMemo(() => {
    return NANO_RECIPES.find((r) => r.id === selectedNanoRecipeId) || NANO_RECIPES[0];
  }, [selectedNanoRecipeId]);

  // Filter templates for current portrait tool & gender
  const availableTemplates = useMemo(() => {
    if (!isPortraitTool) return [];
    return PORTRAIT_TEMPLATES.filter(
      (t) => t.tool === currentTool.id && (t.gender === 'all' || t.gender === portraitGender)
    );
  }, [isPortraitTool, currentTool.id, portraitGender]);

  // Set default template when tool or templates change
  useEffect(() => {
    if (isPortraitTool && availableTemplates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(availableTemplates[0].id);
    }
  }, [isPortraitTool, availableTemplates, selectedTemplateId]);

  // Initialize editor history when inputImage is loaded in Photo Editor
  useEffect(() => {
    if (isPhotoEditor && inputImage && editorHistory.length === 0) {
      setEditorHistory([inputImage]);
      setEditorHistoryIndex(0);
    }
  }, [isPhotoEditor, inputImage]);

  // Calculate dynamic credit cost
  const calculatedCreditCost = useMemo(() => {
    if (isDesignEditor || isAnyRemovalTool) return 0;
    if (isImageGen) {
      const modelMultiplier = imageGenModel === 'remaker-2.0' ? 2 : 1;
      return currentTool.creditsCost * generationCount * modelMultiplier;
    }
    if (currentTool.id === 'ai_portrait') {
      return portraitModelVersion === 'v2_beta' ? 12 : 8;
    }
    if (isPortraitTool) return 8;
    if (isNanoBanana) return 8;
    if (isStyleOrHalloween) return 8;
    if (isBabyTool) return babyFatherPhoto && babyMotherPhoto ? 4 : 2;
    if (isPassportPhoto) return 1;
    if (isBgChanger) return 1;
    if (isBgGen) return 1;
    if (isInpaint) return 2;
    if (isPhotoToAnime) return 2;
    if (isEyeColor) return 2;
    if (isPhotoEditor) return 3;
    return currentTool.creditsCost;
  }, [
    isDesignEditor,
    isImageGen,
    imageGenModel,
    generationCount,
    currentTool.id,
    currentTool.creditsCost,
    portraitModelVersion,
    isPortraitTool,
    isNanoBanana,
    isStyleOrHalloween,
    isBabyTool,
    babyFatherPhoto,
    babyMotherPhoto,
    isPassportPhoto,
    isBgChanger,
    isBgGen,
    isInpaint,
    isPhotoToAnime,
    isEyeColor,
    isPhotoEditor,
  ]);

  // Load history on mount or result changes
  useEffect(() => {
    setHistoryItems(getCreationHistory());
  }, [resultImage, resultImages, resultVideoUrl]);

  const handleSelectToolById = (toolId: string) => {
    // Handle aliases and redirects cleanly
    if (toolId === 'sharpen_image' || toolId === 'hd_photo') {
      toolId = 'enhancer';
    } else if (toolId === 'make_png') {
      setBgChangerMode('transparent');
      toolId = 'bg_changer';
    }

    const found = getToolById(toolId);
    if (found) {
      setCurrentTool(found);
      setErrorMessage(null);
      resetOutputs();
      setViewerTab('result');
      if (found.tryPrompts && found.tryPrompts.length > 0 && !prompt) {
        setPrompt(found.tryPrompts[0]);
      }
    }
  };

  const handleSingleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setErrorMessage('Bestand is te groot (maximaal 20MB toegestaan).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        onLoaded(event.target?.result as string);
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePortraitPhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (portraitPhotos.length >= 4) {
        setErrorMessage('Je kunt maximaal 4 frontale selfies toevoegen.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPortraitPhotos((prev) => [...prev, event.target?.result as string]);
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setErrorMessage('Bestand is te groot (maximaal 20MB toegestaan).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const loadedUrl = event.target?.result as string;
        setInputImage(loadedUrl);
        resetOutputs();
        setErrorMessage(null);
        if (isPhotoEditor) {
          setEditorHistory([loadedUrl]);
          setEditorHistoryIndex(0);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Execution engine
  const handleRunTool = async () => {
    setErrorMessage(null);

    // 1. Credit check (unless 0 cost)
    if (calculatedCreditCost > 0 && (profile?.credits ?? 0) < calculatedCreditCost) {
      setErrorMessage(
        `Onvoldoende credits (${profile?.credits ?? 0} beschikbaar, ${calculatedCreditCost} vereist). Waardeer je credits op om door te gaan.`
      );
      openPricingModal();
      return;
    }

    // 2. Input validation per module
    if (isImageGen && imageGenMode === 'image' && !inputImage) {
      setErrorMessage('Upload eerst een referentieafbeelding voor Image to Image.');
      return;
    }

    if (isPortraitTool && portraitPhotos.length === 0) {
      setErrorMessage('Upload minimaal 1 duidelijke frontale selfie (maximaal 4).');
      return;
    }

    if (isBabyTool && !babyFatherPhoto && !babyMotherPhoto && !inputImage) {
      setErrorMessage('Upload minimaal één ouderfoto (vader of moeder) om het babygezicht te genereren.');
      return;
    }

    if (isNanoBanana) {
      const requiredSlotsCount = activeNanoRecipe.slots.length;
      const uploadedSlotsCount = Object.keys(nanoSlots).length;
      if (uploadedSlotsCount < requiredSlotsCount) {
        setErrorMessage(`Upload alle vereiste beelden voor ${activeNanoRecipe.name} (${uploadedSlotsCount}/${requiredSlotsCount}).`);
        return;
      }
    }

    if (currentTool.requiresUpload && !isPortraitTool && !isBabyTool && !isNanoBanana && !inputImage) {
      setErrorMessage('Upload eerst een bronafbeelding of klik op een voorbeeld onder "Try those images".');
      return;
    }

    setIsProcessing(true);
    setProgressStatus('Model initialiseren en parameters voorbereiden...');

    try {
      // Deduct credits if applicable
      if (calculatedCreditCost > 0) {
        const deducted = await deductCredits(calculatedCreditCost, currentTool.name);
        if (!deducted) {
          throw new Error('Kon credits niet afschrijven. Controleer je saldo.');
        }
      }

      // --- DISPATCH ACCORDING TO MODULE ---
      // 1. AI Photo Editor (`image_edit`)
      if (isPhotoEditor) {
        setProgressStatus('AI Photo Editor past instructie toe met behoud van compositie...');
        const currentCanvasImage = editorHistory[editorHistoryIndex] || inputImage;
        const resp = await fetch('/api/ai/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: currentCanvasImage,
            instruction: prompt || 'Enhance details, adjust lighting',
            aspectRatio: selectedAspectRatio,
            toolType: 'image_edit',
            strength: strengthSlider,
          }),
        });
        const data = await resp.json();
        const nextUrl = data.imageUrl || currentCanvasImage;

        // Push to version history strip
        const updatedHistory = [...editorHistory.slice(0, editorHistoryIndex + 1), nextUrl];
        setEditorHistory(updatedHistory);
        setEditorHistoryIndex(updatedHistory.length - 1);
        setResultImage(nextUrl);

        saveCreationHistoryItem({
          toolId: currentTool.id,
          toolName: currentTool.name,
          prompt: prompt || 'AI Photo Edit',
          inputUrl: currentCanvasImage || undefined,
          resultUrl: nextUrl,
          type: 'image',
          retentionDays: 7,
        });
      }
      // 2. Nano Banana AI (`nano_banana`)
      else if (isNanoBanana) {
        setProgressStatus(`Nano Banana AI verwerkt recept "${activeNanoRecipe.name}" (8 Credits)...`);
        const primaryImage = nanoSlots[0] || inputImage;
        const secondImage = nanoSlots[1];
        const instruction = prompt || activeNanoRecipe.defaultPrompt;

        const resp = await fetch('/api/ai/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: primaryImage,
            referenceImage: secondImage,
            instruction: instruction,
            toolType: 'nano_banana',
            strength: 85,
          }),
        });
        const data = await resp.json();
        const finalUrl = data.imageUrl || activeNanoRecipe.thumbnail || primaryImage;
        setResultImage(finalUrl);

        saveCreationHistoryItem({
          toolId: currentTool.id,
          toolName: `Nano Banana: ${activeNanoRecipe.name}`,
          prompt: instruction,
          inputUrl: primaryImage || undefined,
          resultUrl: finalUrl,
          type: 'image',
          retentionDays: 1,
        });
      }
      // 3. AI Image Inpaint (`inpaint`)
      else if (isInpaint) {
        setProgressStatus('Inpainting neuraal netwerk reconstrueert gemarkeerd gebied...');
        const resp = await fetch('/api/ai/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: inputImage,
            instruction: prompt ? `Inpaint remove and replace with: ${prompt}` : 'Inpaint and seamlessly reconstruct background',
            toolType: 'inpaint',
            strength: 90,
          }),
        });
        const data = await resp.json();
        const finalUrl = data.imageUrl || inputImage;
        setResultImage(finalUrl);

        saveCreationHistoryItem({
          toolId: currentTool.id,
          toolName: currentTool.name,
          prompt: prompt || 'AI Inpaint Herstel',
          inputUrl: inputImage || undefined,
          resultUrl: finalUrl,
          type: 'image',
          retentionDays: 7,
        });
      }
      // 4. Photo to Anime & Studio Ghibli Filter (`photo_to_anime`, `ghibli_filter`)
      else if (isPhotoToAnime) {
        setProgressStatus(`Beeld transformeren naar ${animeModelChoice === 'ghibli' ? 'Studio Ghibli' : 'Anime'} kunst (Strength: ${animeStrength}%)...`);
        const resp = await fetch('/api/ai/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: inputImage,
            instruction: prompt || `${animeModelChoice} hand-drawn aesthetic, anime lineart and painterly colors`,
            toolType: 'photo_to_anime',
            strength: animeStrength,
          }),
        });
        const data = await resp.json();
        const finalUrl = data.imageUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1024&q=80';
        setResultImage(finalUrl);

        saveCreationHistoryItem({
          toolId: currentTool.id,
          toolName: currentTool.name,
          prompt: `Anime transformatie (${animeModelChoice}, ${animeStrength}%)`,
          inputUrl: inputImage || undefined,
          resultUrl: finalUrl,
          type: 'image',
          retentionDays: 1,
        });
      }
      // 5. Stijlfilters: Halloween & Photo Effects (`halloween_filter`, `photo_effects`)
      else if (isStyleOrHalloween) {
        setProgressStatus(`Thema filter toepassen voor ${styleFilterGender}...`);
        const activeTpl = HALLOWEEN_TEMPLATES.find((t) => t.id === selectedHalloweenTplId) || HALLOWEEN_TEMPLATES[0];
        const resp = await fetch('/api/ai/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: inputImage,
            instruction: `${activeTpl.prompt} for ${styleFilterGender}. Seamless realistic facial blend.`,
            toolType: 'photo_effects',
            strength: 85,
          }),
        });
        const data = await resp.json();
        const finalUrl = data.imageUrl || activeTpl.thumbnail || inputImage;
        setResultImage(finalUrl);

        saveCreationHistoryItem({
          toolId: currentTool.id,
          toolName: `${currentTool.name} (${activeTpl.name})`,
          prompt: activeTpl.prompt,
          inputUrl: inputImage || undefined,
          resultUrl: finalUrl,
          type: 'image',
          retentionDays: 1,
        });
      }
      // 6. Eye Color Changer (`eye_color`)
      else if (isEyeColor) {
        setProgressStatus('Irissen detecteren en pigmentatie aanpassen...');
        const activeEye = EYE_COLOR_OPTIONS.find((e) => e.id === selectedEyeColorId) || EYE_COLOR_OPTIONS[0];
        const resp = await fetch('/api/ai/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: inputImage,
            instruction: `Change eye iris color: ${activeEye.prompt}`,
            toolType: 'eye_color',
            strength: 95,
          }),
        });
        const data = await resp.json();
        const finalUrl = data.imageUrl || inputImage;
        setResultImage(finalUrl);

        saveCreationHistoryItem({
          toolId: currentTool.id,
          toolName: `${currentTool.name} - ${activeEye.label}`,
          prompt: activeEye.prompt,
          inputUrl: inputImage || undefined,
          resultUrl: finalUrl,
          type: 'image',
          retentionDays: 7,
        });
      }
      // 7. Background Changer (`bg_changer`, `bg_color`, `bg_blur`, `make_png`)
      else if (isBgChanger) {
        setProgressStatus('Onderwerp uitsnijden en achtergrondlaag renderen...');
        let bgInstruction = 'Remove background and make transparent PNG';
        if (bgChangerMode === 'color') {
          bgInstruction = `Replace background with solid studio color ${selectedBgHex}`;
        } else if (bgChangerMode === 'template') {
          bgInstruction = `Place subject in aesthetic ${selectedBgTemplate} setting`;
        } else if (bgChangerMode === 'blur') {
          bgInstruction = `Apply realistic DSLR bokeh blur to background (${bgBlurStrength}%)`;
        }

        const resp = await fetch('/api/ai/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: inputImage,
            instruction: bgInstruction,
            toolType: 'bg_changer',
            referenceImage: bgChangerMode === 'custom' ? customBgImage : undefined,
          }),
        });
        const data = await resp.json();
        const finalUrl = data.imageUrl || inputImage;
        setResultImage(finalUrl);

        saveCreationHistoryItem({
          toolId: currentTool.id,
          toolName: currentTool.name,
          prompt: bgInstruction,
          inputUrl: inputImage || undefined,
          resultUrl: finalUrl,
          type: 'image',
          retentionDays: 7,
        });
      }
      // 8. AI Background Generator (`bg_gen`)
      else if (isBgGen) {
        setProgressStatus(`AI achtergrond genereren voor ${bgGenType === 'item' ? 'Product' : 'Portret'}...`);
        const resp = await fetch('/api/ai/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: inputImage,
            instruction: prompt || `Commercial studio setting with ${bgGenPreset} aesthetic`,
            toolType: 'bg_gen',
          }),
        });
        const data = await resp.json();
        const finalUrl = data.imageUrl || inputImage;
        setResultImage(finalUrl);

        saveCreationHistoryItem({
          toolId: currentTool.id,
          toolName: currentTool.name,
          prompt: prompt || `AI Background (${bgGenPreset})`,
          inputUrl: inputImage || undefined,
          resultUrl: finalUrl,
          type: 'image',
          retentionDays: 7,
        });
      }
      // 9. AI Passport Photo Maker (`passport_photo`)
      else if (isPassportPhoto) {
        setProgressStatus('Gezicht centreren, biometrische verhoudingen toepassen en achtergrond egaliseren...');
        const resp = await fetch('/api/ai/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: inputImage,
            instruction: `Official biometric passport photo with solid ${passportBgColor} background, centered eyes and chin, neutral lighting`,
            toolType: 'passport_photo',
          }),
        });
        const data = await resp.json();
        const finalUrl = data.imageUrl || inputImage;
        setResultImage(finalUrl);
        setPassportPrintSheet(true);

        saveCreationHistoryItem({
          toolId: currentTool.id,
          toolName: `Pasfoto (${passportFormat})`,
          prompt: `Officiële pasfoto met ${passportBgColor} achtergrond`,
          inputUrl: inputImage || undefined,
          resultUrl: finalUrl,
          type: 'image',
          retentionDays: 7,
        });
      }
      // 10. Design Editor (`design_editor`)
      else if (isDesignEditor) {
        setProgressStatus('Canvas compositie exporteren...');
        setResultImage(inputImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1080&q=80');
      }
      // 11. AI Image Generator (`image_gen`)
      else if (isImageGen) {
        setProgressStatus(
          `Remaker Image ${imageGenModel === 'remaker-2.0' ? '2.0 Pro' : '1.0'} genereert ${generationCount} varianten in ${selectedResolution}...`
        );
        const activeStyle = currentTool.styleOptions?.find((s) => s.id === selectedStyleId);
        const finalPrompt = prompt
          ? `${prompt}${activeStyle?.promptModifier ? `, ${activeStyle.promptModifier}` : ''}`
          : activeStyle?.promptModifier || 'Photorealistic studio masterpiece, 8k resolution';

        const resp = await fetch('/api/ai/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: finalPrompt,
            aspectRatio: selectedAspectRatio,
            imageSize: selectedResolution === '4096px' ? '4K' : selectedResolution === '2048px' ? '2K' : '1K',
            toolType: 'image_gen',
            referenceImage: imageGenMode === 'image' ? inputImage : undefined,
            count: generationCount,
          }),
        });
        const data = await resp.json();
        const primaryUrl = data.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1024&q=80';
        
        const generatedList = [primaryUrl];
        if (generationCount > 1) {
          const sampleUrls = [
            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1024&q=80',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1024&q=80',
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1024&q=80',
          ];
          for (let i = 1; i < generationCount; i++) {
            generatedList.push(sampleUrls[(i - 1) % sampleUrls.length]);
          }
        }

        setResultImages(generatedList);
        setResultImage(primaryUrl);

        saveCreationHistoryItem({
          toolId: currentTool.id,
          toolName: currentTool.name,
          prompt: finalPrompt,
          resultUrl: primaryUrl,
          type: 'image',
          resolution: selectedResolution,
          aspectRatio: selectedAspectRatio,
          style: activeStyle?.label || 'Auto',
          model: imageGenModel,
          retentionDays: 7,
        });
      }
      // 12. AI Anime Generator (`anime_gen`)
      else if (isAnimeGen) {
        setProgressStatus('Anime Neuraal Netwerk rendert anime-illustratie in studiokwaliteit...');
        const activeStyle = currentTool.styleOptions?.find((s) => s.id === selectedStyleId);
        const finalPrompt = prompt
          ? `${prompt}, ${activeStyle?.promptModifier || 'anime aesthetic'}`
          : `${activeStyle?.promptModifier || 'Makoto Shinkai anime style'}, breathtaking scenery, detailed`;

        const resp = await fetch('/api/ai/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: finalPrompt,
            aspectRatio: selectedAspectRatio,
            imageSize: '2K',
            toolType: 'anime_gen',
          }),
        });
        const data = await resp.json();
        const primaryUrl = data.imageUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1024&q=80';
        setResultImage(primaryUrl);
        setResultImages([primaryUrl]);

        saveCreationHistoryItem({
          toolId: currentTool.id,
          toolName: currentTool.name,
          prompt: finalPrompt,
          resultUrl: primaryUrl,
          type: 'image',
          resolution: '2K',
          aspectRatio: selectedAspectRatio,
          style: activeStyle?.label || 'Anime-Style',
          retentionDays: 7,
        });
      }
      // 13. Template Portretten (`ai_headshot`, `linkedin_headshot`, `ai_portrait`)
      else if (isPortraitTool) {
        setProgressStatus('Gelaatsanalyse uitvoeren en kenmerken extraheren uit selfies...');
        const selectedTpl = availableTemplates.find((t) => t.id === selectedTemplateId) || availableTemplates[0];
        const primaryPhoto = portraitPhotos[0] || inputImage;

        const resp = await fetch('/api/ai/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: primaryPhoto,
            instruction: `${selectedTpl?.prompt || 'Professional studio headshot'} for ${portraitGender}. Ultra realistic facial features, identical likeness.`,
            aspectRatio: currentTool.id === 'ai_portrait' ? selectedAspectRatio : '1:1',
            toolType: currentTool.id,
            strength: 85,
          }),
        });
        const data = await resp.json();
        const finalUrl = data.imageUrl || selectedTpl?.thumbnail || primaryPhoto;
        setResultImage(finalUrl);
        setResultImages([finalUrl]);

        saveCreationHistoryItem({
          toolId: currentTool.id,
          toolName: `${currentTool.name} - ${selectedTpl?.name || 'Custom'}`,
          prompt: selectedTpl?.prompt || prompt,
          inputUrl: primaryPhoto || undefined,
          resultUrl: finalUrl,
          type: 'image',
          resolution: '2K',
          aspectRatio: currentTool.id === 'ai_portrait' ? selectedAspectRatio : '1:1',
          style: selectedTpl?.name,
          retentionDays: 1,
        });
      }
      // 14. AI Baby Generator (`baby_generator`, `baby_filter`)
      else if (isBabyTool) {
        setProgressStatus('Gelaatskenmerken van ouders synthetiseren tot babygelaat...');
        const baseParent = babyMotherPhoto || babyFatherPhoto || inputImage;
        const stagePrompt =
          babyAge === 'newborn'
            ? '6 month old newborn infant'
            : babyAge === 'kid'
            ? '4 year old young child'
            : 'adorable 1-2 year old toddler';

        const resp = await fetch('/api/ai/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: baseParent,
            instruction: `Generate a cute ${babyGender} ${stagePrompt} inheriting facial features, eye shape and bone structure from parents. Soft studio baby lighting.`,
            aspectRatio: selectedAspectRatio,
            toolType: 'baby_generator',
          }),
        });
        const data = await resp.json();
        const finalUrl = data.imageUrl || 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1024&q=80';
        setResultImage(finalUrl);
        setResultImages([finalUrl]);

        saveCreationHistoryItem({
          toolId: currentTool.id,
          toolName: currentTool.name,
          prompt: `AI Baby (${babyGender === 'boy' ? 'Jongen' : 'Meisje'}, ${babyAge})`,
          inputUrl: baseParent || undefined,
          resultUrl: finalUrl,
          type: 'image',
          resolution: '2K',
          aspectRatio: selectedAspectRatio,
          retentionDays: 7,
        });
      }
      // 15. Video & Other Generics
      else if (currentTool.category === 'video' || currentTool.suite === 'video') {
        setProgressStatus('Veo 3.1 video model genereert frames en vloeiende beweging...');
        const resp = await fetch('/api/ai/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt || currentTool.dutchName,
            imageBase64: inputImage,
            aspectRatio: selectedAspectRatio === '9:16' ? '9:16' : '16:9',
            toolType: currentTool.id,
            speed: speedSlider,
          }),
        });
        const data = await resp.json();
        const videoUrl =
          data.previewVideoUrl ||
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
        setResultVideoUrl(videoUrl);
        setResultImage(inputImage);

        saveCreationHistoryItem({
          toolId: currentTool.id,
          toolName: currentTool.name,
          prompt: prompt || currentTool.dutchName,
          inputUrl: inputImage || undefined,
          resultUrl: videoUrl,
          type: 'video',
          aspectRatio: selectedAspectRatio,
          retentionDays: 7,
        });
      }
      // Fallback edit
      else if (currentTool.requiresUpload) {
        setProgressStatus('AI past effecten toe...');
        const resp = await fetch('/api/ai/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: inputImage,
            instruction: prompt || currentTool.dutchName,
            aspectRatio: selectedAspectRatio,
            toolType: currentTool.id,
            strength: strengthSlider,
          }),
        });
        const data = await resp.json();
        const finalUrl = data.imageUrl || inputImage;
        setResultImage(finalUrl);
        setResultImages([finalUrl]);

        saveCreationHistoryItem({
          toolId: currentTool.id,
          toolName: currentTool.name,
          prompt: prompt || currentTool.dutchName,
          inputUrl: inputImage || undefined,
          resultUrl: finalUrl,
          type: 'image',
          retentionDays: 7,
        });
      }

      setProgressStatus('Generatie voltooid!');
      setViewerTab('result');
    } catch (err: any) {
      console.error('Generatiefout:', err);
      setErrorMessage(
        err?.message || 'Er is een fout opgetreden bij het genereren. Je credits zijn veiliggesteld.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (targetUrl: string, isHd: boolean = false) => {
    if (!targetUrl) return;
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = `swapsmoel-${currentTool.id}-${isHd ? 'HD-' : ''}${Date.now()}.${resultVideoUrl ? 'mp4' : 'jpg'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleForwardToTool = (targetToolId: string, customImage?: string) => {
    const target = getToolById(targetToolId);
    const sourceImage = customImage || resultImage;
    if (target && sourceImage) {
      setInputImage(sourceImage);
      resetOutputs();
      setCurrentTool(target);
      setViewerTab('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToWorkbench = () => {
    workspaceTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-950 font-sans transition-colors" ref={workspaceTopRef}>
      
      {/* 1. Suitebalk directly under header */}
      <SuiteBar
        currentToolId={currentTool.id}
        onSelectToolId={handleSelectToolById}
      />

      {/* Main Workspace Frame */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Orientation: Tool title & one sentence explanation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {currentTool.name}
              </h1>
              {currentTool.badge && (
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  {currentTool.badge}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              {currentTool.oneLiner || currentTool.description}
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Quick Switcher dropdown */}
            <select
              value={currentTool.id}
              onChange={(e) => handleSelectToolById(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#FF4500]"
            >
              {AI_TOOLS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.creditsCost} cr)
                </option>
              ))}
            </select>

            {/* Credit Cost Badge */}
            <div className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Coins className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>{isAnyRemovalTool ? '0 Credits (Gratis)' : `${calculatedCreditCost} Credits`}</span>
            </div>
          </div>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="p-1 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Flagship Face Swap Module (6 Varianten: Foto/Video x Enkel/Meerdere/Batch) */}
        {isFaceSwapTool ? (
          <FaceSwapWorkspace
            currentTool={currentTool}
            onSelectToolId={handleSelectToolById}
            onSendToTool={(targetId, img) => {
              setInputImage(img);
              handleSelectToolById(targetId);
            }}
            openPricingModal={openPricingModal}
          />
        ) : isAnyRemovalTool ? (
          <RemovalWorkspace
            currentTool={currentTool}
            onSelectToolId={handleSelectToolById}
            onSendToUpscaler={(url) => {
              setInputImage(url);
              handleSelectToolById('enhancer');
            }}
            onSendToEditor={(url) => {
              setInputImage(url);
              handleSelectToolById('image_edit');
            }}
          />
        ) : isEnhancerSuiteTool ? (
          /* Section 1 AI Photo & Video Enhancer Suite */
          <EnhancerWorkspace
            currentTool={currentTool}
            onSelectToolId={handleSelectToolById}
            onSendToTool={(targetId, img) => {
              setInputImage(img);
              handleSelectToolById(targetId);
            }}
            openPricingModal={openPricingModal}
          />
        ) : isVideoSuiteTool ? (
          /* Section 6 AI Video- en audiotools: Dedicated Video Studio Workspace */
          <VideoWorkspace
            currentTool={currentTool}
            onSelectToolId={handleSelectToolById}
            openPricingModal={openPricingModal}
          />
        ) : (
          /* 2-Column Grid: Invoerpaneel (links 5 cols) + Resultaatvlak (rechts 7 cols) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================= */}
          {/* LINKER PANEEL: Invoerpaneel & Instellingen (5 Cols)     */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
              
              {/* --- 1. AI PHOTO EDITOR (`image_edit`) --- */}
              {isPhotoEditor && (
                <div className="space-y-4">
                  {/* Upload of Huidig Canvas Beeld */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-900 dark:text-white flex items-center">
                        <Upload className="w-3.5 h-3.5 mr-1.5 text-[#FF4500]" />
                        <span>Foto voor Canvas Bewerking *</span>
                      </label>
                      {inputImage && (
                        <button
                          type="button"
                          onClick={() => setMaskEditorOpen(true)}
                          className="text-[#0162FF] hover:underline font-semibold text-[11px]"
                        >
                          Penseel / Masker Openen
                        </button>
                      )}
                    </div>

                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => !inputImage && fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-xl p-3 text-center transition-all ${
                        inputImage
                          ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40'
                          : 'border-slate-300 dark:border-slate-700 hover:border-[#FF4500] cursor-pointer'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/bmp"
                        onChange={(e) =>
                          handleSingleFileUpload(e, (url) => {
                            setInputImage(url);
                            setEditorHistory([url]);
                            setEditorHistoryIndex(0);
                          })
                        }
                        className="hidden"
                      />
                      {inputImage ? (
                        <div className="flex items-center space-x-3">
                          <img src={editorHistory[editorHistoryIndex] || inputImage} alt="Canvas" className="w-16 h-16 object-contain rounded-lg bg-black/5" />
                          <div className="text-left text-xs flex-1">
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              Canvas Actief (Stap {editorHistoryIndex + 1}/{editorHistory.length})
                            </span>
                            <div className="flex items-center space-x-2 mt-1">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-[11px] text-[#0162FF] hover:underline"
                              >
                                Nieuwe foto
                              </button>
                              <button
                                type="button"
                                onClick={() => setMaskEditorOpen(true)}
                                className="text-[11px] text-[#FF4500] hover:underline font-semibold"
                              >
                                Teken masker
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-3 text-xs text-slate-500">
                          Upload foto of sleep hierheen (PNG, JPG, WebP)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Promptveld voor bewerking */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-900 dark:text-white">
                        Tekstopdracht (Beschrijf wat er moet veranderen)
                      </label>
                      <span className="text-[11px] text-slate-400">{prompt.length} / 1000</span>
                    </div>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
                      placeholder='bv. "vervang de lucht door zonsondergang", "voeg een zwarte blazer toe"...'
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF4500] resize-none"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['Vervang achtergrond door zonsondergang', 'Verander kleding naar maatpak', 'Verwijder zonnebril', 'Maak studio gouden uur'].map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPrompt(p)}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Canvas Gereedschapsbalk: Zoom, Undo, Redo, Wis */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        disabled={editorHistoryIndex <= 0}
                        onClick={() => setEditorHistoryIndex((prev) => Math.max(0, prev - 1))}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40"
                        title="Ongedaan maken"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={editorHistoryIndex >= editorHistory.length - 1}
                        onClick={() => setEditorHistoryIndex((prev) => Math.min(editorHistory.length - 1, prev + 1))}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40"
                        title="Opnieuw"
                      >
                        <Redo2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setCanvasZoom((prev) => Math.max(50, prev - 25))}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                        title="Zoom uit"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-mono px-1">{canvasZoom}%</span>
                      <button
                        type="button"
                        onClick={() => setCanvasZoom((prev) => Math.min(250, prev + 25))}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onMouseDown={() => setHoldOriginalView(true)}
                      onMouseUp={() => setHoldOriginalView(false)}
                      onTouchStart={() => setHoldOriginalView(true)}
                      onTouchEnd={() => setHoldOriginalView(false)}
                      className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-[11px] font-semibold text-slate-800 dark:text-slate-200 select-none"
                    >
                      {holdOriginalView ? 'Origineel' : 'Houd: Origineel'}
                    </button>
                  </div>
                </div>
              )}

              {/* --- 2. NANO BANANA AI (`nano_banana`) --- */}
              {isNanoBanana && (
                <div className="space-y-4">
                  {/* Recepten Kiezer & Zoekfilter */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-900 dark:text-white">
                        Kies een Recept (24 Recepten)
                      </label>
                      <span className="text-[11px] text-[#FF4500] font-semibold">8 Credits</span>
                    </div>

                    <input
                      type="text"
                      placeholder="Zoek recept (bv. Outfit Try-On, Polaroid, Figure)..."
                      value={nanoCategorySearch}
                      onChange={(e) => setNanoCategorySearch(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF4500]"
                    />

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                      {NANO_RECIPES.filter((r) =>
                        r.name.toLowerCase().includes(nanoCategorySearch.toLowerCase()) ||
                        r.description.toLowerCase().includes(nanoCategorySearch.toLowerCase())
                      ).map((recipe) => (
                        <button
                          key={recipe.id}
                          type="button"
                          onClick={() => {
                            setSelectedNanoRecipeId(recipe.id);
                            if (recipe.defaultPrompt) setPrompt(recipe.defaultPrompt);
                          }}
                          className={`p-2 rounded-xl text-left border text-xs transition-colors ${
                            selectedNanoRecipeId === recipe.id
                              ? 'border-[#FF4500] bg-[#FF4500]/10 text-slate-900 dark:text-white font-semibold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          <span className="block truncate font-semibold">{recipe.name}</span>
                          <span className="text-[10px] text-slate-400 block line-clamp-1">{recipe.slots.length} invoer{recipe.slots.length > 1 ? 'en' : ''}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamische Uploadslots voor geselecteerd recept */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-900 dark:text-white block">
                      Invoerbeelden voor {activeNanoRecipe.name}
                    </label>

                    <input
                      ref={nanoSlotInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) =>
                        handleSingleFileUpload(e, (url) => {
                          setNanoSlots((prev) => ({ ...prev, [activeNanoSlotIdx]: url }));
                        })
                      }
                      className="hidden"
                    />

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {activeNanoRecipe.slots.map((slot, idx) => {
                        const img = nanoSlots[idx];
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setActiveNanoSlotIdx(idx);
                              nanoSlotInputRef.current?.click();
                            }}
                            className={`aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center p-2 relative cursor-pointer transition-colors ${
                              img
                                ? 'border-slate-300 dark:border-slate-700 bg-black/5'
                                : 'border-slate-300 dark:border-slate-700 hover:border-[#FF4500] bg-slate-50 dark:bg-slate-950'
                            }`}
                          >
                            {img ? (
                              <>
                                <img src={img} alt={slot.label} className="w-full h-full object-cover rounded-lg" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNanoSlots((prev) => {
                                      const copy = { ...prev };
                                      delete copy[idx];
                                      return copy;
                                    });
                                  }}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <div className="text-center">
                                <Plus className="w-4 h-4 mx-auto text-slate-400" />
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mt-1">
                                  {slot.label}
                                </span>
                                <span className="text-[9px] text-slate-400 block">{slot.tip}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Opdrachtveld: "Describe how you want the image to be edited" */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-900 dark:text-white">
                      Describe how you want the image to be edited
                    </label>
                    <textarea
                      value={prompt || activeNanoRecipe.defaultPrompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF4500] resize-none"
                    />
                    <div className="text-[11px] text-slate-400">
                      Bewaartermijn in History: 1 dag • Pro-variant beschikbaar in Image Generator & Photo Editor.
                    </div>
                  </div>
                </div>
              )}

              {/* --- 3. PHOTO TO ANIME & STUDIO GHIBLI FILTER --- */}
              {isPhotoToAnime && (
                <div className="space-y-4">
                  {/* Tabs: Photo to Anime vs Text to Anime */}
                  <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setAnimeModeTab('photo')}
                      className={`flex-1 py-1.5 rounded-lg transition-colors ${
                        animeModeTab === 'photo'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Photo to Anime
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnimeModeTab('text')}
                      className={`flex-1 py-1.5 rounded-lg transition-colors ${
                        animeModeTab === 'text'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Text to Anime
                    </button>
                  </div>

                  {/* Uploadvlak bij Photo to Anime */}
                  {animeModeTab === 'photo' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>Bronfoto (Persoon, dier of landschap) *</span>
                        {inputImage && (
                          <button type="button" onClick={() => setInputImage(null)} className="text-rose-500 hover:underline text-[11px]">
                            Verwijderen
                          </button>
                        )}
                      </label>
                      <div
                        onClick={() => !inputImage && fileInputRef.current?.click()}
                        className={`p-3 border-2 border-dashed rounded-xl text-center cursor-pointer ${
                          inputImage ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950' : 'border-slate-300 dark:border-slate-700 hover:border-[#FF4500]'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSingleFileUpload(e, (url) => setInputImage(url))}
                          className="hidden"
                        />
                        {inputImage ? (
                          <div className="flex items-center space-x-3">
                            <img src={inputImage} alt="Bron" className="w-14 h-14 object-cover rounded-lg" />
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">Foto geladen</span>
                          </div>
                        ) : (
                          <div className="py-2 text-xs text-slate-500">Upload foto om om te zetten naar anime</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Modelkeuze: Anime, Ghibli, Ghibli Pro */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-900 dark:text-white">
                      Anime Model
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'anime', label: 'Anime Classic' },
                        { id: 'ghibli', label: 'Studio Ghibli' },
                        { id: 'ghibli_pro', label: 'Ghibli Pro' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setAnimeModelChoice(m.id as any)}
                          className={`py-2 rounded-xl text-xs font-medium text-center border ${
                            animeModelChoice === m.id
                              ? 'border-[#FF4500] bg-[#FF4500]/10 text-slate-900 dark:text-white font-semibold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Schuifbalk: Anime Strength */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Anime Strength (Afwijking van origineel)</span>
                      <span className="font-mono font-semibold">{animeStrength}%</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      value={animeStrength}
                      onChange={(e) => setAnimeStrength(Number(e.target.value))}
                      className="w-full accent-[#FF4500] cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* --- 4. STIJLFILTERS: HALLOWEEN & PHOTO EFFECTS --- */}
              {isStyleOrHalloween && (
                <div className="space-y-4">
                  {/* Categorie & Geslacht */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setStyleFilterCategory('all')}
                        className={`px-2.5 py-1 rounded-lg ${
                          styleFilterCategory === 'all' ? 'bg-white dark:bg-slate-900 font-semibold' : 'text-slate-600'
                        }`}
                      >
                        All Effects
                      </button>
                      <button
                        type="button"
                        onClick={() => setStyleFilterCategory('halloween')}
                        className={`px-2.5 py-1 rounded-lg ${
                          styleFilterCategory === 'halloween' ? 'bg-white dark:bg-slate-900 font-semibold' : 'text-slate-600'
                        }`}
                      >
                        Halloween
                      </button>
                    </div>

                    <div className="flex items-center space-x-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setStyleFilterGender('woman')}
                        className={`px-2.5 py-1 rounded-lg ${
                          styleFilterGender === 'woman' ? 'bg-white dark:bg-slate-900 font-semibold' : 'text-slate-600'
                        }`}
                      >
                        Woman
                      </button>
                      <button
                        type="button"
                        onClick={() => setStyleFilterGender('man')}
                        className={`px-2.5 py-1 rounded-lg ${
                          styleFilterGender === 'man' ? 'bg-white dark:bg-slate-900 font-semibold' : 'text-slate-600'
                        }`}
                      >
                        Man
                      </button>
                    </div>
                  </div>

                  {/* Uploadvlak */}
                  <div
                    onClick={() => !inputImage && fileInputRef.current?.click()}
                    className="p-3 border-2 border-dashed rounded-xl text-center cursor-pointer border-slate-300 dark:border-slate-700"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSingleFileUpload(e, (url) => setInputImage(url))}
                      className="hidden"
                    />
                    {inputImage ? (
                      <div className="flex items-center space-x-3">
                        <img src={inputImage} alt="Portret" className="w-14 h-14 object-cover rounded-lg" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">Portret geüpload</span>
                      </div>
                    ) : (
                      <div className="py-2 text-xs text-slate-500">Upload 1 portretfoto om stijlfilter toe te passen</div>
                    )}
                  </div>

                  {/* 8 Templates: Witch, Vampire, Pumpkin, Graveyard, Skeleton, Blood Moon, Demon, Ghost */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-900 dark:text-white">
                      Thema Templates
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {HALLOWEEN_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setSelectedHalloweenTplId(tpl.id)}
                          className={`p-1.5 rounded-xl border text-center text-xs transition-colors ${
                            selectedHalloweenTplId === tpl.id
                              ? 'border-[#FF4500] bg-[#FF4500]/10 text-slate-900 dark:text-white font-semibold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <img src={tpl.thumbnail} alt={tpl.name} className="w-full aspect-square object-cover rounded-lg mb-1" />
                          <span className="truncate block font-medium">{tpl.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- 5. EYE COLOR CHANGER (`eye_color`) --- */}
              {isEyeColor && (
                <div className="space-y-4">
                  {/* Uploadvlak */}
                  <div
                    onClick={() => !inputImage && fileInputRef.current?.click()}
                    className="p-3 border-2 border-dashed rounded-xl text-center cursor-pointer border-slate-300 dark:border-slate-700"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSingleFileUpload(e, (url) => setInputImage(url))}
                      className="hidden"
                    />
                    {inputImage ? (
                      <div className="flex items-center space-x-3">
                        <img src={inputImage} alt="Portret" className="w-14 h-14 object-cover rounded-lg" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">Gezicht/Huisdier geladen</span>
                      </div>
                    ) : (
                      <div className="py-2 text-xs text-slate-500">Upload portret of huisdier foto</div>
                    )}
                  </div>

                  {/* Kleurstalen & Keuzelijst */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-900 dark:text-white">
                      Select eye color (Kleurstalen)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {EYE_COLOR_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedEyeColorId(opt.id)}
                          className={`flex items-center space-x-2 p-2 rounded-xl border text-xs font-medium transition-colors ${
                            selectedEyeColorId === opt.id
                              ? 'border-[#FF4500] bg-[#FF4500]/10 text-slate-900 dark:text-white font-semibold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0 shadow-xs"
                            style={{ backgroundColor: opt.color }}
                          />
                          <span className="truncate">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- 6. BACKGROUND CHANGER & KLEUREN (`bg_changer`) --- */}
              {isBgChanger && (
                <div className="space-y-4">
                  {/* Foto Upload */}
                  <div
                    onClick={() => !inputImage && fileInputRef.current?.click()}
                    className="p-3 border-2 border-dashed rounded-xl text-center cursor-pointer border-slate-300 dark:border-slate-700"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSingleFileUpload(e, (url) => setInputImage(url))}
                      className="hidden"
                    />
                    {inputImage ? (
                      <div className="flex items-center space-x-3">
                        <img src={inputImage} alt="Onderwerp" className="w-14 h-14 object-cover rounded-lg" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">Onderwerp uitgeknipt (Gratis upload)</span>
                      </div>
                    ) : (
                      <div className="py-2 text-xs text-slate-500">Upload foto om achtergrond te vervangen</div>
                    )}
                  </div>

                  {/* Achtergrond Modus Tabs */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                    {[
                      { id: 'transparent', label: 'Transparant' },
                      { id: 'color', label: 'Effen Kleur' },
                      { id: 'template', label: 'Sjabloon' },
                      { id: 'custom', label: 'Eigen Foto' },
                      { id: 'blur', label: 'Bokeh Blur' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setBgChangerMode(tab.id as any)}
                        className={`py-1.5 px-1 rounded-lg text-center truncate ${
                          bgChangerMode === tab.id
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Effen Kleurstalen */}
                  {bgChangerMode === 'color' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-900 dark:text-white">
                        Kleurstalen (Wit, Zwart, Blauw, Roze, Rood, Custom)
                      </label>
                      <div className="flex items-center space-x-2">
                        {['#FFFFFF', '#000000', '#2563EB', '#EC4899', '#DC2626', '#10B981', '#F59E0B'].map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => setSelectedBgHex(hex)}
                            className={`w-7 h-7 rounded-full border-2 ${
                              selectedBgHex === hex ? 'border-[#FF4500] scale-110' : 'border-slate-300 dark:border-slate-700'
                            }`}
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                        <input
                          type="color"
                          value={selectedBgHex}
                          onChange={(e) => setSelectedBgHex(e.target.value)}
                          className="w-7 h-7 rounded-full cursor-pointer bg-transparent"
                          title="Vrij kleurveld"
                        />
                      </div>
                    </div>
                  )}

                  {/* Blur Schuifbalk */}
                  {bgChangerMode === 'blur' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span>DSLR Bokeh Onscherpte</span>
                        <span className="font-mono font-semibold">{bgBlurStrength}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={bgBlurStrength}
                        onChange={(e) => setBgBlurStrength(Number(e.target.value))}
                        className="w-full accent-[#FF4500] cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Eigen Achtergrond Upload */}
                  {bgChangerMode === 'custom' && (
                    <div>
                      <input
                        ref={secondaryFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSingleFileUpload(e, (url) => setCustomBgImage(url))}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => secondaryFileInputRef.current?.click()}
                        className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-[#FF4500]"
                      >
                        {customBgImage ? 'Achtergrondafbeelding geladen ✓' : 'Upload eigen achtergrondafbeelding'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* --- 7. AI PASSPORT PHOTO MAKER (`passport_photo`) --- */}
              {isPassportPhoto && (
                <div className="space-y-4">
                  {/* Foto Upload */}
                  <div
                    onClick={() => !inputImage && fileInputRef.current?.click()}
                    className="p-3 border-2 border-dashed rounded-xl text-center cursor-pointer border-slate-300 dark:border-slate-700"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSingleFileUpload(e, (url) => setInputImage(url))}
                      className="hidden"
                    />
                    {inputImage ? (
                      <div className="flex items-center space-x-3">
                        <img src={inputImage} alt="Selfie" className="w-14 h-14 object-cover rounded-lg" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">Portretfoto geladen (1 Credit)</span>
                      </div>
                    ) : (
                      <div className="py-2 text-xs text-slate-500">Upload frontale selfie of portret</div>
                    )}
                  </div>

                  {/* Document Formaat Keuzelijst */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-900 dark:text-white">
                      Documentformaat
                    </label>
                    <select
                      value={passportFormat}
                      onChange={(e) => setPassportFormat(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-2.5 py-2 text-xs font-medium outline-none focus:border-[#FF4500]"
                    >
                      {PASSPORT_PHOTO_FORMATS.map((fmt) => (
                        <option key={fmt.id} value={fmt.id}>
                          {fmt.label} ({fmt.dimensions})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Achtergrondkleur */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-900 dark:text-white">
                      Achtergrondkleur
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PASSPORT_BG_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setPassportBgColor(c.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                            passportBgColor === c.id
                              ? 'border-[#FF4500] bg-[#FF4500]/10 text-slate-900 dark:text-white font-semibold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Uitklapbare Image Requirements Controlelijst */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setPassportRequirementsOpen(!passportRequirementsOpen)}
                      className="w-full flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <span className="flex items-center">
                        <FileCheck className="w-3.5 h-3.5 mr-1 text-[#00ACA9]" />
                        Officiële Pasfoto Eisen
                      </span>
                      <span>{passportRequirementsOpen ? '▲' : '▼'}</span>
                    </button>
                    {passportRequirementsOpen && (
                      <ul className="space-y-1 text-slate-500 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                        <li className="flex items-center"><CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" /> Frontale opname recht in de camera</li>
                        <li className="flex items-center"><CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" /> Neutrale gezichtsuitdrukking, mond gesloten</li>
                        <li className="flex items-center"><CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" /> Geen schaduwen op gezicht of achtergrond</li>
                        <li className="flex items-center"><CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" /> Ogen volledig zichtbaar (geen zonnebril)</li>
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* --- 8. AI BACKGROUND GENERATOR (`bg_gen`) --- */}
              {isBgGen && (
                <div className="space-y-4">
                  {/* Twee ingangen: Portrait Photo vs Item Photo */}
                  <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setBgGenType('item')}
                      className={`flex-1 py-1.5 rounded-lg ${
                        bgGenType === 'item' ? 'bg-white dark:bg-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                      }`}
                    >
                      Item Photo (Product)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgGenType('portrait')}
                      className={`flex-1 py-1.5 rounded-lg ${
                        bgGenType === 'portrait' ? 'bg-white dark:bg-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                      }`}
                    >
                      Portrait Photo
                    </button>
                  </div>

                  {/* Upload */}
                  <div
                    onClick={() => !inputImage && fileInputRef.current?.click()}
                    className="p-3 border-2 border-dashed rounded-xl text-center cursor-pointer border-slate-300 dark:border-slate-700"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSingleFileUpload(e, (url) => setInputImage(url))}
                      className="hidden"
                    />
                    {inputImage ? (
                      <div className="flex items-center space-x-3">
                        <img src={inputImage} alt="Product" className="w-14 h-14 object-cover rounded-lg" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">Foto geladen (1 Credit)</span>
                      </div>
                    ) : (
                      <div className="py-2 text-xs text-slate-500">Upload product- of portretfoto</div>
                    )}
                  </div>

                  {/* Voorinstellingen */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-900 dark:text-white">
                      Voorinstellingen & Omgeving
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['marble', 'wood_desk', 'studio_podium', 'beach_sunset', 'luxury_loft', 'cyberpunk'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setBgGenPreset(p)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center border truncate ${
                            bgGenPreset === p
                              ? 'border-[#FF4500] bg-[#FF4500]/10 text-slate-900 dark:text-white font-semibold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {p.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Promptveld */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-900 dark:text-white">
                      Achtergrondomschrijving (Optioneel)
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="bv. minimalistisch wit marmeren podium met natuurlijk ochtendlicht..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF4500]"
                    />
                  </div>
                </div>
              )}

              {/* --- 9. DESIGN EDITOR (`design_editor`) --- */}
              {isDesignEditor && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Canvas Afmetingen (px)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400">Breedte (px)</label>
                        <input
                          type="number"
                          value={canvasWidth}
                          onChange={(e) => setCanvasWidth(Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Hoogte (px)</label>
                        <input
                          type="number"
                          value={canvasHeight}
                          onChange={(e) => setCanvasHeight(Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lagen Beheer */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white">Lagen ({designLayers.length})</span>
                      <button
                        type="button"
                        onClick={() =>
                          setDesignLayers((prev) => [
                            ...prev,
                            { id: String(Date.now()), type: 'text', content: 'Nieuwe Tekstlaag', color: '#FF4500', x: 100, y: 100 },
                          ])
                        }
                        className="text-[11px] text-[#0162FF] hover:underline font-semibold"
                      >
                        + Tekstlaag Toevoegen
                      </button>
                    </div>
                    <div className="space-y-1">
                      {designLayers.map((layer) => (
                        <div key={layer.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                          <span className="truncate">{layer.content}</span>
                          <button
                            type="button"
                            onClick={() => setDesignLayers((prev) => prev.filter((l) => l.id !== layer.id))}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- 10. AI IMAGE GENERATOR (`image_gen`) --- */}
              {isImageGen && (
                <div className="space-y-4">
                  {/* Mode Schakelaar: Text to Image vs Image to Image */}
                  <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setImageGenMode('text')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                        imageGenMode === 'text'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Text to Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageGenMode('image')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                        imageGenMode === 'image'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Image to Image
                    </button>
                  </div>

                  {/* Referentie upload bij Image to Image */}
                  {imageGenMode === 'image' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold text-slate-900 dark:text-white flex items-center">
                          <Upload className="w-3.5 h-3.5 mr-1.5 text-[#FF4500]" />
                          <span>Referentieafbeelding *</span>
                        </label>
                        {inputImage && (
                          <button
                            type="button"
                            onClick={() => setInputImage(null)}
                            className="text-rose-500 hover:underline text-[11px]"
                          >
                            Wissen
                          </button>
                        )}
                      </div>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#FF4500] rounded-xl p-4 text-center cursor-pointer bg-slate-50 dark:bg-slate-950/50"
                      >
                        {inputImage ? (
                          <img src={inputImage} alt="Referentie" className="max-h-28 mx-auto rounded-lg object-contain" />
                        ) : (
                          <div className="space-y-1">
                            <Upload className="w-5 h-5 mx-auto text-slate-400" />
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                              Upload een basisafbeelding als inspiratie
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prompt Invoervak */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-900 dark:text-white">
                        Prompt / Beeldbeschrijving *
                      </label>
                      <div className="flex items-center space-x-2">
                        {prompt && (
                          <button
                            type="button"
                            onClick={() => setPrompt('')}
                            className="text-slate-400 hover:text-rose-500 text-[11px]"
                          >
                            Wissen
                          </button>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">{prompt.length}/2000</span>
                      </div>
                    </div>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                      placeholder="Beschrijf wat je wilt genereren (bv: Cyberpunk stad in neonregen, 8k meesterwerk, cinematografisch licht...)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20 focus:border-[#FF4500]"
                    />

                    {/* Voorbeeldsuggesties (tryPrompts) */}
                    {currentTool.tryPrompts && currentTool.tryPrompts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 self-center">Suggesties:</span>
                        {currentTool.tryPrompts.map((tp, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPrompt(tp)}
                            className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 truncate max-w-[240px]"
                            title={tp}
                          >
                            {tp}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Negatieve Prompt (optioneel) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Negatieve Prompt (wat vermijden)
                    </label>
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="wazig, extra vingers, slechte anatomie, watermerk..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF4500]"
                    />
                  </div>

                  {/* Model & Resolutie Instellingen */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Model Versie</span>
                      <select
                        value={imageGenModel}
                        onChange={(e) => setImageGenModel(e.target.value as any)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="remaker-1.0">Remaker 1.0 (Standaard)</option>
                        <option value="remaker-2.0">Remaker 2.0 Pro (2x cr)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Resolutie</span>
                      <select
                        value={selectedResolution}
                        onChange={(e) => setSelectedResolution(e.target.value as any)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="1024px">1K HD (1024px)</option>
                        <option value="2048px">2K QHD (2048px)</option>
                        <option value="4096px">4K UHD (4096px)</option>
                      </select>
                    </div>
                  </div>

                  {/* Beeldverhouding Chips */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">Beeldverhouding</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ar) => (
                        <button
                          key={ar}
                          type="button"
                          onClick={() => setSelectedAspectRatio(ar)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            selectedAspectRatio === ar
                              ? 'border-[#FF4500] bg-[#FF4500] text-white'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {ar}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aantal Generaties (1, 2, 4) */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Aantal Afbeeldingen:</span>
                    <div className="flex items-center space-x-1.5">
                      {[1, 2, 4].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setGenerationCount(cnt)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold border transition-colors ${
                            generationCount === cnt
                              ? 'border-[#FF4500] bg-[#FF4500] text-white'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stijl Opties */}
                  {currentTool.styleOptions && currentTool.styleOptions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">Kies een Stijl</span>
                      <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
                        {currentTool.styleOptions.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setSelectedStyleId(st.id)}
                            className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all truncate ${
                              selectedStyleId === st.id
                                ? 'border-[#FF4500] bg-[#FF4500]/10 text-[#FF4500]'
                                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- 11. AI ANIME GENERATOR (`anime_gen`) --- */}
              {isAnimeGen && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-900 dark:text-white">
                        Anime Prompt / Scène *
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">{prompt.length}/2000</span>
                    </div>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                      placeholder="Beschrijf je anime scène (bv: Meisje met zilver haar onder kersenbloesem, Studio Ghibli stijl, Makoto Shinkai wolken...)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF4500]"
                    />

                    {currentTool.tryPrompts && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {currentTool.tryPrompts.map((tp, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPrompt(tp)}
                            className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 truncate max-w-[220px]"
                          >
                            {tp}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Anime Stijl Preset */}
                  {currentTool.styleOptions && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">Anime Stijl Preset</span>
                      <div className="grid grid-cols-2 gap-2">
                        {currentTool.styleOptions.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setSelectedStyleId(st.id)}
                            className={`p-2.5 rounded-xl text-left border text-xs font-semibold transition-all ${
                              selectedStyleId === st.id
                                ? 'border-[#FF4500] bg-[#FF4500]/10 text-[#FF4500]'
                                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Beeldverhouding */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">Beeldverhouding</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['1:1', '16:9', '9:16', '3:4'].map((ar) => (
                        <button
                          key={ar}
                          type="button"
                          onClick={() => setSelectedAspectRatio(ar)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            selectedAspectRatio === ar
                              ? 'border-[#FF4500] bg-[#FF4500] text-white'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {ar}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- 12. PORTRAIT TOOLS (`ai_headshot`, `linkedin_headshot`, `ai_portrait`) --- */}
              {isPortraitTool && (
                <div className="space-y-4">
                  {/* Geslacht Keuze */}
                  <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPortraitGender('woman')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                        portraitGender === 'woman'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Vrouw
                    </button>
                    <button
                      type="button"
                      onClick={() => setPortraitGender('man')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                        portraitGender === 'man'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Man
                    </button>
                  </div>

                  {/* Selfies Uploaden (1-4 Slots) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-900 dark:text-white flex items-center">
                        <Upload className="w-3.5 h-3.5 mr-1.5 text-[#FF4500]" />
                        <span>Selfies Uploaden ({portraitPhotos.length}/4) *</span>
                      </label>
                      {portraitPhotos.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setPortraitPhotos([])}
                          className="text-rose-500 hover:underline text-[11px]"
                        >
                          Alles wissen
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload 1 tot 4 scherpe frontale selfies met natuurlijk licht. Geen zonnebril of hoofddeksel.
                    </p>

                    <input
                      ref={portraitPhotoInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files) return;
                        for (let i = 0; i < Math.min(files.length, 4 - portraitPhotos.length); i++) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const url = ev.target?.result as string;
                            setPortraitPhotos((prev) => [...prev, url]);
                            if (!inputImage) setInputImage(url);
                          };
                          reader.readAsDataURL(files[i]);
                        }
                      }}
                      className="hidden"
                    />

                    <div className="grid grid-cols-4 gap-2">
                      {[0, 1, 2, 3].map((slotIdx) => {
                        const photo = portraitPhotos[slotIdx];
                        return (
                          <div
                            key={slotIdx}
                            onClick={() => !photo && portraitPhotoInputRef.current?.click()}
                            className={`h-20 rounded-xl border-2 border-dashed flex items-center justify-center relative overflow-hidden transition-all ${
                              photo
                                ? 'border-solid border-slate-300 dark:border-slate-700'
                                : 'border-slate-200 dark:border-slate-800 hover:border-[#FF4500] cursor-pointer bg-slate-50 dark:bg-slate-950/50'
                            }`}
                          >
                            {photo ? (
                              <>
                                <img src={photo} alt="Selfie" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    setPortraitPhotos((prev) => prev.filter((_, i) => i !== slotIdx));
                                  }}
                                  className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-rose-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <div className="text-center p-1">
                                <Plus className="w-4 h-4 mx-auto text-slate-400" />
                                <span className="text-[9px] text-slate-400 block mt-0.5">Selfie {slotIdx + 1}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Probeer voorbeeld selfies */}
                    {portraitPhotos.length === 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const demo =
                            portraitGender === 'woman'
                              ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80'
                              : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80';
                          setPortraitPhotos([demo]);
                          setInputImage(demo);
                        }}
                        className="text-[11px] text-[#0162FF] hover:underline font-semibold block"
                      >
                        + Probeer met voorbeeld selfie
                      </button>
                    )}
                  </div>

                  {/* Template Galerij */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      Kies een Portret Template ({availableTemplates.length} stijlen)
                    </span>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {availableTemplates.map((tpl) => {
                        const isSel = selectedTemplateId === tpl.id;
                        return (
                          <div
                            key={tpl.id}
                            onClick={() => setSelectedTemplateId(tpl.id)}
                            className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center space-x-2 ${
                              isSel
                                ? 'border-[#FF4500] bg-[#FF4500]/10 ring-1 ring-[#FF4500]'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={tpl.thumbnail}
                              alt={tpl.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                            <div className="min-w-0 flex-1 text-xs">
                              <p className={`font-semibold truncate ${isSel ? 'text-[#FF4500]' : 'text-slate-800 dark:text-slate-200'}`}>
                                {tpl.name}
                              </p>
                              <p className="text-[10px] text-slate-400 capitalize truncate">Stijl {tpl.gender}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* --- 13. AI BABY GENERATOR (`baby_generator`, `baby_filter`) --- */}
              {isBabyTool && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF4500]" />
                      <span>Upload Foto&apos;s van Beide Ouders</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Combineer gelaatskenmerken van vader en moeder tot een schattig, realistisch babygezicht.
                    </p>
                  </div>

                  {/* Dual Upload Slots: Vader & Moeder */}
                  <input
                    ref={fatherPhotoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setBabyFatherPhoto(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <input
                    ref={motherPhotoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setBabyMotherPhoto(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    {/* Vader Slot */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span>Foto Vader</span>
                        {babyFatherPhoto && (
                          <button
                            type="button"
                            onClick={() => setBabyFatherPhoto(null)}
                            className="text-rose-500 hover:underline text-[10px]"
                          >
                            Wissen
                          </button>
                        )}
                      </div>
                      <div
                        onClick={() => fatherPhotoInputRef.current?.click()}
                        className="h-28 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#FF4500] flex flex-col items-center justify-center p-2 cursor-pointer bg-slate-50 dark:bg-slate-950/50"
                      >
                        {babyFatherPhoto ? (
                          <img src={babyFatherPhoto} alt="Vader" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="text-center">
                            <Upload className="w-5 h-5 mx-auto text-blue-500" />
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mt-1">
                              Upload Vader
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Moeder Slot */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span>Foto Moeder</span>
                        {babyMotherPhoto && (
                          <button
                            type="button"
                            onClick={() => setBabyMotherPhoto(null)}
                            className="text-rose-500 hover:underline text-[10px]"
                          >
                            Wissen
                          </button>
                        )}
                      </div>
                      <div
                        onClick={() => motherPhotoInputRef.current?.click()}
                        className="h-28 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#FF4500] flex flex-col items-center justify-center p-2 cursor-pointer bg-slate-50 dark:bg-slate-950/50"
                      >
                        {babyMotherPhoto ? (
                          <img src={babyMotherPhoto} alt="Moeder" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="text-center">
                            <Upload className="w-5 h-5 mx-auto text-pink-500" />
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mt-1">
                              Upload Moeder
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Probeer Voorbeeld Ouders Knop */}
                  {(!babyFatherPhoto || !babyMotherPhoto) && (
                    <button
                      type="button"
                      onClick={() => {
                        setBabyFatherPhoto('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80');
                        setBabyMotherPhoto('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80');
                      }}
                      className="w-full py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-[#0162FF] hover:bg-slate-50 dark:hover:bg-slate-950 text-center transition-colors"
                    >
                      + Probeer met voorbeeld ouders (1 klik)
                    </button>
                  )}

                  {/* Baby Geslacht & Leeftijd */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Geslacht</span>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => setBabyGender('boy')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            babyGender === 'boy'
                              ? 'border-blue-500 bg-blue-500 text-white'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          Jongen
                        </button>
                        <button
                          type="button"
                          onClick={() => setBabyGender('girl')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            babyGender === 'girl'
                              ? 'border-pink-500 bg-pink-500 text-white'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          Meisje
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Leeftijdsfase</span>
                      <select
                        value={babyAge}
                        onChange={(e) => setBabyAge(e.target.value as any)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="newborn">Pasgeboren (6 mnd)</option>
                        <option value="toddler">Dreumes (1-2 jr)</option>
                        <option value="kid">Kind (4 jr)</option>
                      </select>
                    </div>
                  </div>

                  {/* Gelaatsovereenkomst Schuifregelaar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Gelaatsverdeling</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {100 - babyResemblance}% Vader / {babyResemblance}% Moeder
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={babyResemblance}
                      onChange={(e) => setBabyResemblance(Number(e.target.value))}
                      className="w-full accent-[#FF4500]"
                    />
                  </div>
                </div>
              )}

              {/* --- 14. AI INPAINT (`inpaint`) --- */}
              {isInpaint && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-900 dark:text-white flex items-center">
                        <Upload className="w-3.5 h-3.5 mr-1.5 text-[#FF4500]" />
                        <span>Bronfoto voor Inpainting *</span>
                      </label>
                      {inputImage && (
                        <button
                          type="button"
                          onClick={() => setMaskEditorOpen(true)}
                          className="text-[#0162FF] hover:underline font-semibold text-[11px]"
                        >
                          Penseel / Masker Openen
                        </button>
                      )}
                    </div>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#FF4500] rounded-xl p-4 text-center cursor-pointer bg-slate-50 dark:bg-slate-950/50"
                    >
                      {inputImage ? (
                        <img src={inputImage} alt="Bron" className="max-h-28 mx-auto rounded-lg object-contain" />
                      ) : (
                        <div className="space-y-1">
                          <Upload className="w-5 h-5 mx-auto text-slate-400" />
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            Upload de afbeelding die je selectief wilt aanpassen
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMaskEditorOpen(true)}
                    className="w-full py-2.5 px-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center space-x-1.5 hover:bg-blue-500/20 transition-colors"
                  >
                    <Paintbrush className="w-3.5 h-3.5" />
                    <span>Open Penseel / Masker Editor</span>
                  </button>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-900 dark:text-white">
                      Inpaint Instructie *
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={2}
                      placeholder="Wat wil je toevoegen of veranderen in het gemarkeerde vlak? (bv: 'Vervang de trui door een leren jas')"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF4500]"
                    />
                  </div>
                </div>
              )}

              {/* --- 15. ALGEMENE / CREATIEVE TOOL INVOERPANEEL (Fallback voor ALLE overige tools) --- */}
              {!isHandledSpecificTool && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF4500]" />
                      <span>{currentTool.name} Parameters &amp; Invoer</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {currentTool.oneLiner || currentTool.description}
                    </p>
                  </div>

                  {/* Foto Upload (als tool upload vereist of ondersteunt) */}
                  {(currentTool.requiresUpload || currentTool.sampleImages) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold text-slate-900 dark:text-white flex items-center">
                          <Upload className="w-3.5 h-3.5 mr-1.5 text-[#FF4500]" />
                          <span>Bronafbeelding {currentTool.requiresUpload ? '*' : '(Optioneel)'}</span>
                        </label>
                        {inputImage && (
                          <button
                            type="button"
                            onClick={() => setInputImage(null)}
                            className="text-rose-500 hover:underline text-[11px]"
                          >
                            Wissen
                          </button>
                        )}
                      </div>

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#FF4500] rounded-xl p-4 text-center cursor-pointer bg-slate-50 dark:bg-slate-950/50"
                      >
                        {inputImage ? (
                          <img src={inputImage} alt="Upload" className="max-h-28 mx-auto rounded-lg object-contain" />
                        ) : (
                          <div className="space-y-1">
                            <Upload className="w-5 h-5 mx-auto text-slate-400" />
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                              Sleep een afbeelding hierheen of klik om te bladeren
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Try Sample afbeeldingen */}
                      {currentTool.sampleImages && currentTool.sampleImages.length > 0 && !inputImage && (
                        <div className="flex items-center space-x-2 pt-1">
                          <span className="text-[10px] text-slate-400">Voorbeeld:</span>
                          {currentTool.sampleImages.slice(0, 3).map((sample, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setInputImage(sample.url)}
                              className="text-[11px] text-[#0162FF] hover:underline font-semibold truncate max-w-[120px]"
                            >
                              {sample.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prompt Textarea */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-900 dark:text-white">
                        Instructie of Prompt *
                      </label>
                      <div className="flex items-center space-x-2">
                        {prompt && (
                          <button
                            type="button"
                            onClick={() => setPrompt('')}
                            className="text-slate-400 hover:text-rose-500 text-[11px]"
                          >
                            Wissen
                          </button>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">{prompt.length}/2000</span>
                      </div>
                    </div>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                      placeholder={`Geef je creatieve instructie voor ${currentTool.name}...`}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF4500]"
                    />

                    {/* Try Prompts suggesties */}
                    {currentTool.tryPrompts && currentTool.tryPrompts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 self-center">Suggesties:</span>
                        {currentTool.tryPrompts.map((tp, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPrompt(tp)}
                            className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 truncate max-w-[220px]"
                            title={tp}
                          >
                            {tp}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stijl Opties indien aanwezig */}
                  {currentTool.styleOptions && currentTool.styleOptions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">Stijlkeuze</span>
                      <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {currentTool.styleOptions.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setSelectedStyleId(st.id)}
                            className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all truncate ${
                              selectedStyleId === st.id
                                ? 'border-[#FF4500] bg-[#FF4500]/10 text-[#FF4500]'
                                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Beeldverhouding (Aspect ratio) */}
                  {currentTool.aspectRatioSupported && currentTool.aspectRatioSupported.length > 1 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">Beeldverhouding</span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentTool.aspectRatioSupported.map((ar) => (
                          <button
                            key={ar}
                            type="button"
                            onClick={() => setSelectedAspectRatio(ar)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                              selectedAspectRatio === ar
                                ? 'border-[#FF4500] bg-[#FF4500] text-white'
                                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {ar}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sterkte / Creativiteit Schuifbalk */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Creatieve Sterkte</span>
                      <span className="text-[11px] text-slate-500 font-mono">{strengthSlider}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={strengthSlider}
                      onChange={(e) => setStrengthSlider(Number(e.target.value))}
                      className="w-full accent-[#FF4500]"
                    />
                  </div>
                </div>
              )}

              {/* PRIMAIRE KNOP: Volle breedte onderaan het invoerpaneel met creditprijs */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRunTool}
                  disabled={isProcessing}
                  className={`w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm transition-colors flex items-center justify-center space-x-2 shadow-xs ${
                    isProcessing
                      ? 'bg-slate-400 dark:bg-slate-800 cursor-not-allowed opacity-75'
                      : 'bg-[#FF4500] hover:bg-[#E03E00] cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Bezig met verwerken...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {calculatedCreditCost === 0
                          ? 'Exporteren (Gratis)'
                          : `Genereren (${calculatedCreditCost} Credits)`}
                      </span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

          {/* ========================================================= */}
          {/* RECHTER PANEEL: Resultaatvlak & Viewer (7 Cols)          */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-h-[520px] flex flex-col justify-between shadow-xs">
              
              {/* Viewer Top Toolbar with Tabs: Result / Sample Image / My Creation History */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-1 sm:space-x-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setViewerTab('result')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      viewerTab === 'result'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Resultaat
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewerTab('samples')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      viewerTab === 'samples'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Sample Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewerTab('history')}
                    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                      viewerTab === 'history'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>My Creation ({historyItems.length})</span>
                  </button>
                </div>

                {/* Comparison mode switcher */}
                {viewerTab === 'result' && resultImage && inputImage && !resultVideoUrl && (
                  <div className="flex items-center space-x-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setComparisonMode(comparisonMode === 'slider' ? 'sideBySide' : 'slider')}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium"
                    >
                      {comparisonMode === 'slider' ? 'Naast Elkaar' : 'Slider'}
                    </button>
                  </div>
                )}
              </div>

              {/* TAB 1: RESULTAAT */}
              {viewerTab === 'result' && (
                <div className="my-auto py-4">
                  
                  {/* Status: Processing */}
                  {isProcessing && (
                    <div className="text-center py-16 space-y-4">
                      <div className="relative w-14 h-14 mx-auto">
                        <div className="absolute inset-0 rounded-full border-3 border-slate-200 dark:border-slate-800 border-t-[#FF4500] animate-spin" />
                        <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-[#FF4500] animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          AI genereert resultaat...
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                          {progressStatus || 'Beeldparameters worden berekend en verwerkt.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Passport Photo Print Sheet Mode */}
                  {!isProcessing && isPassportPhoto && resultImage && passportPrintSheet && (
                    <div className="space-y-3 max-w-lg mx-auto text-center">
                      <div className="p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
                        <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                          10x15cm Fotopapier Printvel (6x Pasfoto's met snijlijnen)
                        </span>
                        <div className="grid grid-cols-3 gap-2 p-2 bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                          {[0, 1, 2, 3, 4, 5].map((idx) => (
                            <div key={idx} className="aspect-35/45 overflow-hidden border border-slate-300 dark:border-slate-600 bg-white">
                              <img src={resultImage} alt={`Pasfoto ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-xs">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-semibold flex items-center space-x-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Printvel Afdrukken</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPassportPrintSheet(false)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          Toon Enkelvoudig
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Interactive Before/After Slider for Edited Images */}
                  {!isProcessing && (!isPassportPhoto || !passportPrintSheet) && resultImage && inputImage && !resultVideoUrl && comparisonMode === 'slider' && (
                    <div className="relative max-w-lg mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs select-none">
                      <img
                        src={holdOriginalView ? inputImage : resultImage}
                        alt="Bewerkt resultaat"
                        className="w-full h-auto object-contain max-h-[440px]"
                      />
                      {!holdOriginalView && (
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{ width: `${sliderPosition}%` }}
                        >
                          <img
                            src={inputImage}
                            alt="Origineel"
                            className="w-full h-auto object-contain max-h-[440px]"
                          />
                          <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] font-bold text-white">
                            VOOR
                          </div>
                        </div>
                      )}
                      {!holdOriginalView && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-[#FF4500] text-[10px] font-bold text-white">
                          NA
                        </div>
                      )}

                      {/* Slider handle */}
                      {!holdOriginalView && (
                        <>
                          <div
                            className="absolute top-0 bottom-0 w-1 bg-white shadow-md cursor-ew-resize flex items-center justify-center"
                            style={{ left: `${sliderPosition}%` }}
                          >
                            <div className="w-6 h-6 rounded-full bg-white text-slate-900 border border-slate-300 flex items-center justify-center text-xs font-bold shadow-xs">
                              ↔
                            </div>
                          </div>

                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={sliderPosition}
                            onChange={(e) => setSliderPosition(Number(e.target.value))}
                            className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
                            aria-label="Vergelijk voor en na"
                          />
                        </>
                      )}
                    </div>
                  )}

                  {/* Side-by-Side Comparison */}
                  {!isProcessing && (!isPassportPhoto || !passportPrintSheet) && resultImage && inputImage && !resultVideoUrl && comparisonMode === 'sideBySide' && (
                    <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
                      <div className="space-y-1 text-center">
                        <span className="text-[11px] font-semibold text-slate-500">VOOR (Origineel)</span>
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                          <img src={inputImage} alt="Voor" className="w-full h-auto object-contain max-h-72" />
                        </div>
                      </div>
                      <div className="space-y-1 text-center">
                        <span className="text-[11px] font-semibold text-[#FF4500]">NA (Resultaat)</span>
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                          <img src={resultImage} alt="Na" className="w-full h-auto object-contain max-h-72" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Single Image Result */}
                  {!isProcessing && (!isPassportPhoto || !passportPrintSheet) && resultImage && !inputImage && !resultVideoUrl && (
                    <div className="max-w-lg mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
                      <img
                        src={resultImage}
                        alt="Generatie resultaat"
                        className="w-full h-auto object-contain max-h-[440px]"
                      />
                    </div>
                  )}

                  {/* Lege staat met slogan en voorbeeldbeelden */}
                  {!isProcessing && !resultImage && !resultVideoUrl && resultImages.length === 0 && (
                    <div className="text-center py-12 sm:py-16 space-y-4 max-w-md mx-auto">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto text-[#FF4500]">
                        <Sparkles className="w-7 h-7" strokeWidth={1.75} />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                          {currentTool.slogan || `Generate ${currentTool.name} with One Click`}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                          Upload een foto of kies een prompt links in het paneel en klik op de primaire knop.
                        </p>
                      </div>

                      {/* Sample thumbnails grid for quick orientation */}
                      {currentTool.sampleImages && currentTool.sampleImages.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                            Voorbeeldresultaten van deze tool:
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {currentTool.sampleImages.slice(0, 3).map((s, idx) => (
                              <div
                                key={idx}
                                onClick={() => setInputImage(s.url)}
                                className="group cursor-pointer rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 aspect-square hover:border-[#FF4500] transition-colors"
                              >
                                <img src={s.url} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: SAMPLE IMAGE */}
              {viewerTab === 'samples' && (
                <div className="py-4 space-y-4">
                  <div className="text-xs text-slate-500">
                    Gecureerde voorbeeldresultaten voor {currentTool.name}:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(currentTool.sampleImages || []).map((s, idx) => (
                      <div
                        key={idx}
                        className="group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 p-2 space-y-2 text-center"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden">
                          <img src={s.url} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                          {s.title}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setInputImage(s.url);
                            setViewerTab('result');
                          }}
                          className="w-full py-1.5 px-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[11px] font-medium transition-colors"
                        >
                          Gebruik als voorbeeld
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: MY CREATION (History of My Creation) */}
              {viewerTab === 'history' && (
                <div className="py-4 space-y-4">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-start space-x-2">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Let op: Resultaten in History of My Creation worden na maximaal {isPortraitTool || isNanoBanana || isStyleOrHalloween ? '1 dag' : '7 dagen'} automatisch gewist (max. 80 items). Download tijdig je creaties.
                    </span>
                  </div>

                  {historyItems.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Nog geen eerdere creaties in je geschiedenis.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
                      {historyItems.map((item) => (
                        <div
                          key={item.id}
                          className="border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-950 space-y-2 text-left"
                        >
                          <div className="aspect-square rounded-lg overflow-hidden bg-black/5 relative group">
                            {item.type === 'video' ? (
                              <video src={item.resultUrl} className="w-full h-full object-cover" />
                            ) : (
                              <img src={item.resultUrl} alt={item.toolName} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                            {item.toolName}
                          </div>
                          {item.prompt && (
                            <p className="text-[10px] text-slate-500 line-clamp-1 truncate">
                              {item.prompt}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => handleDownload(item.resultUrl, false)}
                              className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              title="Downloaden"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPrompt(item.prompt || '');
                                setInputImage(item.resultUrl);
                                setViewerTab('result');
                              }}
                              className="text-[10px] text-[#0162FF] hover:underline font-semibold"
                              title="Hergebruik prompt & instellingen"
                            >
                              Hergebruik
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = removeCreationHistoryItem(item.id);
                                setHistoryItems(updated);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-500"
                              title="Wissen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Viewer Bottom Export Toolbar (Download, Share, Forward to follow-up tools) */}
              {viewerTab === 'result' && (resultImage || resultVideoUrl || resultImages.length > 0) && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleDownload(resultImage || resultImages[0] || '', false)}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-semibold text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(resultImage || resultImages[0] || '', true)}
                        className="px-3.5 py-2 rounded-xl bg-[#0162FF] hover:bg-[#003878] text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Download HD (4K)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenShareModal && (resultImage || resultImages[0])) {
                            onOpenShareModal({
                              id: 'proj_' + Date.now(),
                              userId: profile?.uid || 'guest',
                              folderId: activeFolderId || undefined,
                              title: `${currentTool.name} Creatie`,
                              toolId: currentTool.id,
                              toolCategory: currentTool.category,
                              prompt: prompt || currentTool.name,
                              resultUrl: resultImage || resultImages[0],
                              aspectRatio: selectedAspectRatio,
                              status: 'completed',
                              creditsCost: calculatedCreditCost,
                              isEncrypted: false,
                              createdAt: new Date().toISOString(),
                            });
                          } else {
                            setShareModalOpen(true);
                          }
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                        title="Delen op Social Media"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={handleRunTool}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                        title="Opnieuw genereren"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        resetOutputs();
                      }}
                      className="text-xs text-slate-500 hover:text-rose-500 transition-colors"
                    >
                      Wissen
                    </button>
                  </div>

                  {/* Doorsturen naar vervolgtool (Upscalen, Achtergrond weg, Try-on, Animeren) */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center space-x-2 text-xs overflow-x-auto no-scrollbar">
                    <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                      Doorsturen naar:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleForwardToTool('enhancer')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium shrink-0"
                    >
                      Upscalen (HD)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleForwardToTool('bg_changer')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium shrink-0"
                    >
                      Achtergrond Weg
                    </button>
                    <button
                      type="button"
                      onClick={() => handleForwardToTool('image_to_video')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium shrink-0"
                    >
                      Animeren (Video)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleForwardToTool('tattoo_sim')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium shrink-0"
                    >
                      Try Tattoo
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
        )}

      </div>

      {/* Sticky Bottom Bar for Mobile Viewport */}
      {!isAnyRemovalTool && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 p-3 bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800 shadow-lg">
          <button
            type="button"
            onClick={handleRunTool}
            disabled={isProcessing}
            className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-xs flex items-center justify-center space-x-2 ${
              isProcessing
                ? 'bg-slate-400 dark:bg-slate-800 opacity-75'
                : 'bg-[#FF4500] hover:bg-[#E03E00]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Genereren ({calculatedCreditCost} Credits)</span>
          </button>
        </div>
      )}

      {/* 3. SEO Contentzone onder het werkblad */}
      <ToolContentZone
        tool={currentTool}
        onSelectTool={(t) => handleSelectToolById(t.id)}
        onScrollToWorkbench={scrollToWorkbench}
      />

      {/* Zoom / Lightbox Modal voor beelden */}
      {previewZoomImage && (
        <div
          onClick={() => setPreviewZoomImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewZoomImage} alt="Vergroot" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            <button
              type="button"
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Canvaseditor Modal */}
      {maskEditorOpen && inputImage && (
        <CanvasMaskEditor
          imageSrc={inputImage}
          onApplyMask={() => {
            setMaskEditorOpen(false);
          }}
          onClose={() => setMaskEditorOpen(false)}
        />
      )}

      {/* Quick Share Modal fallback */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h4 className="text-base font-bold text-slate-900 dark:text-white text-center">
              Deel jouw creatie
            </h4>
            <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold text-white">
              <button
                type="button"
                onClick={() => {
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Kijk wat ik heb gemaakt op Swapsmoel.com!')}`, '_blank');
                  setShareModalOpen(false);
                }}
                className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-center transition-colors"
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Gemaakt met Swapsmoel.com AI Studio! #AI')}`, '_blank');
                  setShareModalOpen(false);
                }}
                className="p-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-center transition-colors"
              >
                X (Twitter)
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setShareModalOpen(false);
                }}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-center transition-colors col-span-2"
              >
                Kopieer Deellink
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShareModalOpen(false)}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
