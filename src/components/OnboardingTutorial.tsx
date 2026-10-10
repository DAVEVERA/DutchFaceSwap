import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Sparkles,
  Sliders,
  FolderPlus,
  ShieldCheck,
  Share2,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Layers,
  Wand2,
} from 'lucide-react';

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCreating: () => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  isOpen,
  onClose,
  onStartCreating,
}) => {
  const { completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welkom bij Swapsmoel.com!',
      subtitle: 'Het complete platform voor AI beeld- en videogeneratie.',
      icon: <Sparkles className="w-8 h-8 text-[#FF4500]" strokeWidth={1.75} />,
      description:
        'Ontdek meer dan 40 gespecialiseerde AI tools. Van realistische Face Morphs en portretten tot Google Veo 3 videocreaties en beeldbewerking.',
      highlights: [
        '40+ Tools voor portretten, kunst, memes & video',
        'Veo 3.1 & Nano Banana 2.1 native AI modellen',
        'Volledig geoptimaliseerd voor mobiel en desktop',
      ],
    },
    {
      title: 'Studio & Voor/Na Vergelijking',
      subtitle: 'Upload, pas effecten toe en bekijk het live verschil.',
      icon: <Sliders className="w-8 h-8 text-[#0162FF]" strokeWidth={1.75} />,
      description:
        'In de Studio Workspace upload je een afbeelding, selecteer je een beeldverhouding en resolutie. Met de interactieve slider vergelijk je eenvoudig het origineel en resultaat.',
      highlights: [
        'Interactieve Before & After split slider',
        'Diep Denkend Model (High Thinking) via Gemini',
        'Direct downloaden in haarscherpe resoluties',
      ],
    },
    {
      title: 'Projectbeheer',
      subtitle: 'Houd creaties overzichtelijk geordend per project.',
      icon: <FolderPlus className="w-8 h-8 text-[#00ACA9]" strokeWidth={1.75} />,
      description:
        'Maak mappen aan voor verschillende projecten. Beheer meerdere afbeeldingen en bewerkingen binnen een overzicht.',
      highlights: [
        'Organiseer afbeeldingen in projectmappen',
        'Koppel bewerkingen aan jouw actieve project',
        'Batch bewerkingen en versiebeheer',
      ],
    },
    {
      title: 'Veilige Cloud Vault & Delen',
      subtitle: 'Veiligheid en snelle deelmogelijkheden.',
      icon: <Share2 className="w-8 h-8 text-[#FF4500]" strokeWidth={1.75} />,
      description:
        'Beveilig je projecten optioneel met client-side zero-knowledge encryptie. Deel je resultaten direct naar social media met virale captions.',
      highlights: [
        'Client-side AES-GCM 256-bit encryptie in je Cloud Vault',
        'Direct delen naar Instagram, TikTok en X',
        'Bonus credits bij aankopen',
      ],
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
      onClose();
      onStartCreating();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={() => {
            completeOnboarding();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator & Icon */}
        <div className="text-center space-y-3 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto">
            {step.icon}
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Stap {currentStep + 1} van {steps.length}
            </span>
            <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white mt-1">
              {step.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{step.subtitle}</p>
          </div>
        </div>

        {/* Description & Highlights */}
        <div className="space-y-3 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-center">
            {step.description}
          </p>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
            {step.highlights.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-slate-700 dark:text-slate-200">
                <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span className="font-medium text-[11px]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 pt-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep ? 'w-5 bg-[#FF4500]' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Vorige</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="py-2.5 px-6 rounded-xl bg-[#FF4500] hover:bg-[#E03E00] text-white font-semibold text-xs transition-colors flex items-center space-x-1.5"
          >
            <span>{currentStep === steps.length - 1 ? 'Start met Creëren' : 'Volgende'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
