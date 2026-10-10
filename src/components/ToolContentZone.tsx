import React, { useState } from 'react';
import { AITool } from '../types/index.ts';
import { getRelatedTools } from '../data/toolsData.ts';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ArrowUp,
  ArrowRight,
  Layers,
  Star,
} from 'lucide-react';

interface ToolContentZoneProps {
  tool: AITool;
  onSelectTool: (tool: AITool) => void;
  onScrollToWorkbench: () => void;
}

export const ToolContentZone: React.FC<ToolContentZoneProps> = ({
  tool,
  onSelectTool,
  onScrollToWorkbench,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const relatedTools = getRelatedTools(tool, 4);

  const defaultFaqs = [
    {
      question: `Hoe werkt de ${tool.dutchName} van Swapsmoel?`,
      answer: `Onze ${tool.dutchName} draait op geavanceerde neurale modellen (${tool.model}). Je uploadt een afbeelding of voert een prompt in, waarna de AI binnen enkele seconden een fotorealistisch resultaat berekent.`,
    },
    {
      question: 'Zijn mijn uploads en bewerkingen privé?',
      answer: 'Ja, 100%. We respecteren strikte Europese privacy-standaarden (AVG/GDPR). Je bestanden worden uitsluitend gebruikt om de gewenste bewerking uit te voeren en worden niet gebruikt voor modeltraining.',
    },
    {
      question: 'Hoeveel credits kost deze tool?',
      answer: `Deze tool kost ${tool.creditsCost} credit${tool.creditsCost > 1 ? 's' : ''} per generatie. Je krijgt dagelijks gratis credits en kunt credits bijkopen zonder abonnement.`,
    },
    {
      question: 'Mag ik de resultaten commercieel inzetten?',
      answer: 'Ja, alle gemaakte creaties zijn volledig royalty-free en mogen zonder restricties worden gebruikt voor commerciële doeleinden, social media campagnes, advertenties en drukwerk.',
    },
  ];

  const faqs = tool.faqItems && tool.faqItems.length > 0 ? tool.faqItems : defaultFaqs;

  return (
    <section className="w-full bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* 1. Wat is het & Waarom gebruiken */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <Sparkles className="w-3 h-3 text-[#FF4500]" />
              <span>Over deze AI Tool</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Wat is de {tool.dutchName}?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {tool.description} Met geavanceerde AI technologieën transformeer je beelden, video of creatieve ontwerpen in seconden. Geen ingewikkelde software of Photoshop kennis vereist; de AI herkent gezichten, belichting en compositie volautomatisch.
            </p>
            <div className="pt-2 flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>AVG / GDPR Veilig</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Snelle Verwerking</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Star className="w-4 h-4 text-[#FF4500]" />
                <span>Studiokwaliteit</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Waarom {tool.dutchName} gebruiken?
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF4500] shrink-0 mt-0.5" />
                <span><strong>Eenvoudig met één klik:</strong> Geen technische instellingen nodig, alles heeft doordachte standaardwaarden.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF4500] shrink-0 mt-0.5" />
                <span><strong>Direct resultaat:</strong> Binnen 3 tot 15 seconden een haarscherpe preview met voor/na-vergelijker.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF4500] shrink-0 mt-0.5" />
                <span><strong>Hoge resolutie export:</strong> Download in standaardformaat of HD 4K voor professioneel gebruik.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF4500] shrink-0 mt-0.5" />
                <span><strong>Eerlijke credits:</strong> Slechts {tool.creditsCost} credit{tool.creditsCost > 1 ? 's' : ''} per taak. Geen verborgen maandabonnementen.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 2. Uitleg in Drie Stappen */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Hoe werkt het in 3 simpele stappen?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Van idee tot resultaat in minder dan een halve minuut
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                {tool.requiresUpload ? 'Upload een afbeelding' : 'Voer je beschrijving in'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {tool.requiresUpload
                  ? 'Sleep een foto naar het invoervlak of klik om een bestand te kiezen. Je kunt ook direct een voorbeeldbeeld aanklikken.'
                  : 'Typ een omschrijving in het promptveld of klik op een inspiratie-suggestie om direct te beginnen.'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Kies stijl en instellingen
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Selecteer de gewenste verhouding (1:1, 9:16, 16:9), kies eventueel een stijl of template tegel, of pas de parameters naar wens aan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Genereer en download
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Klik op de primaire knop ({tool.creditsCost} cr). Bekijk het resultaat live in het resultaatvlak, vergelijk voor en na, en download in HD.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Veelgestelde Vragen (FAQ) */}
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="text-center space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Veelgestelde Vragen (FAQ)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Alles wat je moet weten over {tool.dutchName}
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Tweede primaire knop terug naar boven */}
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Klaar om direct te beginnen met {tool.dutchName}?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Geen installatie of creditcard vereist. Test de tool direct bovenaan de pagina.
          </p>
          <div className="pt-2">
            <button
              onClick={onScrollToWorkbench}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#FF4500] hover:bg-[#E03E00] text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <ArrowUp className="w-4 h-4" />
              <span>Start met {tool.name} ({tool.creditsCost} Credits)</span>
            </button>
          </div>
        </div>

        {/* 5. Kruisverwijzing naar verwante tools */}
        {relatedTools.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#FF4500]" />
                  <span>Verwante AI Tools in deze Suite</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ontdek andere krachtige tools voor jouw creatieve workflow
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {relatedTools.map((relTool) => (
                <button
                  key={relTool.id}
                  onClick={() => {
                    onSelectTool(relTool);
                    onScrollToWorkbench();
                  }}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-left transition-all group shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {relTool.creditsCost} cr
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF4500] transition-colors" />
                  </div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white group-hover:text-[#FF4500] transition-colors line-clamp-1">
                    {relTool.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {relTool.dutchName}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
