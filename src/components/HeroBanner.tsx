import React from 'react';
import { Search } from 'lucide-react';

interface HeroBannerProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectCategory: (cat: any) => void;
  openPricingModal: () => void;
  onOpenStudio: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  searchQuery,
  setSearchQuery,
  openPricingModal,
  onOpenStudio,
}) => {
  return (
    <div className="relative pt-8 pb-12 sm:pt-14 sm:pb-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#060B18] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Main Headline */}
        <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight transition-colors">
          Transformeer en creëer elk beeld <span className="text-[#FF4500]">moeiteloos met AI</span>.
        </h1>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-5 text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed transition-colors">
          Realiseer elk visueel idee met precieze prompts of kies uit meer dan 40 AI foto- en video-tools. Mobiel geoptimaliseerd met veilige end-to-end encryptie.
        </p>

        {/* Call to actions */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 max-w-md sm:max-w-none mx-auto">
          <button
            onClick={onOpenStudio}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#FF4500] hover:bg-[#E03E00] text-white font-semibold text-sm transition-colors shadow-xs"
          >
            Open Studio Workspace
          </button>

          <button
            onClick={openPricingModal}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold text-sm transition-colors"
          >
            Bekijk Tarieven
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-8 sm:mt-10 max-w-xl mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-4 h-4 text-slate-400 dark:text-slate-500" strokeWidth={1.75} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek tools: Face Morph, Restauratie, Pasfoto, Video..."
              className="w-full pl-11 pr-16 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-[#0162FF] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white px-1.5 py-0.5 rounded transition-colors"
              >
                Wissen
              </button>
            )}
          </div>
        </div>

        {/* Quick Search Chips */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 text-xs">
          <span className="text-slate-400 dark:text-slate-500 text-[11px]">Populair:</span>
          {['Face Morph', 'Gender Swap', 'AI Anime', 'Restauratie', 'Veo 3 Video', 'Pasfoto AI'].map((term) => (
            <button
              key={term}
              onClick={() => setSearchQuery(term)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors text-[11px]"
            >
              {term}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
