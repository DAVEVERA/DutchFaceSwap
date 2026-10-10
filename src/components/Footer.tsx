import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Mail, Lock, X } from 'lucide-react';
import { AITool } from '../types/index.ts';
import { getToolById } from '../data/toolsData.ts';

interface FooterProps {
  onSelectTool: (tool: AITool) => void;
  openPricingModal: () => void;
  openProfileModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectTool,
  openPricingModal,
  openProfileModal,
}) => {
  const [legalModalContent, setLegalModalContent] = useState<{ title: string; text: string } | null>(null);

  const openLegalModal = (title: string, text: string) => {
    setLegalModalContent({ title, text });
  };

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Brand Col (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#FF4500] text-white flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-heading font-bold text-xl text-slate-900 dark:text-white">
                Swapsmoel
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Het toonaangevende Nederlandse AI creatieplatform. Genereer, bewerk en animeer portretten, video's en tatoeages in fotorealistische studiokwaliteit met één klik.
            </p>
            <div className="pt-2 flex items-center space-x-4 text-xs text-slate-500">
              <div className="flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>AVG Compliant</span>
              </div>
              <div className="flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>256-bit AES E2EE</span>
              </div>
            </div>
          </div>

          {/* Productlinks Col */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              AI Producten
            </h4>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li>
                <button
                  onClick={() => { onSelectTool(getToolById('image_gen')); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  AI Beeld Generator
                </button>
              </li>
              <li>
                <button
                  onClick={() => { onSelectTool(getToolById('image_edit')); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  AI Foto Bewerker
                </button>
              </li>
              <li>
                <button
                  onClick={() => { onSelectTool(getToolById('baby_filter')); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  AI Baby Generator
                </button>
              </li>
              <li>
                <button
                  onClick={() => { onSelectTool(getToolById('image_to_video')); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Veo Video Studio
                </button>
              </li>
              <li>
                <button
                  onClick={() => { onSelectTool(getToolById('tattoo_create')); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  AI Tattoo Ontwerper
                </button>
              </li>
            </ul>
          </div>

          {/* Bedrijf & Tarieven Col */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Platform & Credits
            </h4>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={openPricingModal} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Tarieven & Credits (Geen abonnement)
                </button>
              </li>
              <li>
                <button onClick={openProfileModal} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Mijn Account & Sleutels
                </button>
              </li>
              <li>
                <button
                  onClick={() => openLegalModal('Over Swapsmoel', 'Swapsmoel is een Nederlands technologiebedrijf gevestigd in Amsterdam dat gespecialiseerd is in geavanceerde multimodale AI modellen (Gemini Nano, Flux en Google Veo). Ons platform stelt ontwerpers, marketeers en consumenten in staat om zonder technische barrières beelden en video’s van topkwaliteit te creëren.')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Over Ons (About)
                </button>
              </li>
            </ul>
          </div>

          {/* Beleid, Terms & Contact Col */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Beleid & Veiligheid
            </h4>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li>
                <button
                  onClick={() => openLegalModal('Privacybeleid', 'Swapsmoel respecteert strikt de Algemene Verordening Gegevensbescherming (AVG / GDPR). Alle data en geüploade beelden worden versleuteld verzonden en uitsluitend verwerkt voor de door de gebruiker geïnitieerde generatietaak. Beelden worden na maximaal 7 dagen automatisch uit de tijdelijke verwerkingsopslag verwijderd.')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Privacybeleid (Privacy)
                </button>
              </li>
              <li>
                <button
                  onClick={() => openLegalModal('Algemene Voorwaarden', 'Door het gebruik van Swapsmoel ga je akkoord met onze gebruiksvoorwaarden. Gegenereerde beelden zijn 100% royalty-free en mogen zowel privé als commercieel worden ingezet. Het is verboden om het platform te gebruiken voor onwettige, misleidende of lasterlijke doeleinden.')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Algemene Voorwaarden (Terms)
                </button>
              </li>
              <li>
                <button
                  onClick={() => openLegalModal('Content Policy', 'Veiligheid en ethiek staan centraal. Swapsmoel hanteert geautomatiseerde filters die strikt toezien op het weren van NSFW-materiaal, deepfake-misbruik van niet-toestemmende personen, haatdragende uitingen en schendingen van intellectueel eigendom. Overtreders worden direct geblokkeerd.')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Content Policy (Veilige AI)
                </button>
              </li>
              <li className="pt-2 text-slate-500 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-[#FF4500]" />
                <a href="mailto:info@swapsmoel.com" className="hover:underline">info@swapsmoel.com</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            © 2026 Swapsmoel.com • Alle rechten voorbehouden.
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Servers: Google Cloud Europa (Frankfurt)</span>
            <span>Uptime: 99.98%</span>
          </div>
        </div>

      </div>

      {/* Legal Dialog */}
      {legalModalContent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {legalModalContent.title}
              </h3>
              <button
                onClick={() => setLegalModalContent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {legalModalContent.text}
            </p>
            <div className="pt-2 text-right">
              <button
                onClick={() => setLegalModalContent(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-xs font-semibold"
              >
                Begrepen
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
