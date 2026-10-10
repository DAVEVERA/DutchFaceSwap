import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { AI_TOOLS } from '../data/toolsData.ts';
import { AITool } from '../types/index.ts';
import {
  Sparkles,
  Coins,
  Sun,
  Moon,
  Lock,
  FolderLock,
  FolderKanban,
  Menu,
  X,
  PlusCircle,
  LogOut,
  User as UserIcon,
  HelpCircle,
  ChevronDown,
  Search,
  Gift,
  Globe,
  ArrowRight,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'studio' | 'tools' | 'vault' | 'pricing' | 'admin' | 'batch' | 'projects';
  setActiveTab: (tab: 'studio' | 'tools' | 'vault' | 'pricing' | 'admin' | 'batch' | 'projects') => void;
  openPricingModal: () => void;
  openProfileModal: () => void;
  openOnboardingTutorial: () => void;
  openAdminGate: () => void;
  openFreeCreditsModal: () => void;
  onSelectTool?: (tool: AITool) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openPricingModal,
  openProfileModal,
  openOnboardingTutorial,
  openAdminGate,
  openFreeCreditsModal,
  onSelectTool,
}) => {
  const {
    profile,
    isDarkMode,
    toggleDarkMode,
    logout,
  } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [megaSearch, setMegaSearch] = useState('');
  const [language, setLanguage] = useState<'NL' | 'EN' | 'DE' | 'FR'>('NL');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Hidden admin entrance trigger: 3 rapid clicks on the discreet logo dot
  const [secretClickCount, setSecretClickCount] = useState(0);

  const handleSecretClick = () => {
    const next = secretClickCount + 1;
    setSecretClickCount(next);
    if (next >= 3) {
      setSecretClickCount(0);
      openAdminGate();
    }
    setTimeout(() => setSecretClickCount(0), 1500);
  };

  const filteredMegaTools = megaSearch.trim()
    ? AI_TOOLS.filter((t) =>
        t.name.toLowerCase().includes(megaSearch.toLowerCase()) ||
        t.dutchName.toLowerCase().includes(megaSearch.toLowerCase()) ||
        t.description.toLowerCase().includes(megaSearch.toLowerCase())
      )
    : AI_TOOLS;

  const categories = [
    { id: 'beeld', label: 'Beeld Studio', tools: filteredMegaTools.filter((t) => t.suite === 'beeld' || (t.category === 'creative' && !t.suite)) },
    { id: 'video', label: 'Video Studio', tools: filteredMegaTools.filter((t) => t.suite === 'video' || t.category === 'video') },
    { id: 'tattoo', label: 'Tattoo Studio', tools: filteredMegaTools.filter((t) => t.suite === 'tattoo') },
    { id: 'face', label: 'Gezicht & Morphs', tools: filteredMegaTools.filter((t) => t.suite === 'face' || t.category === 'face') },
    { id: 'photo', label: 'Fotoverbetering', tools: filteredMegaTools.filter((t) => t.category === 'photo' && t.suite !== 'beeld') },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('studio')}>
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#FF4500] text-white shadow-xs group">
              <Sparkles className="w-5 h-5 group-hover:rotate-6 transition-transform" strokeWidth={1.75} />
              {/* Discreet Secret Admin Entrance trigger */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleSecretClick();
                }}
                className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#00ACA9] border-2 border-white dark:border-slate-950 rounded-full cursor-pointer hover:scale-125 transition-transform"
                title="Status: Online"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Swapsmoel
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            
            {/* Premier Face Swap Tool Direct Button */}
            <button
              onClick={() => {
                const fs = AI_TOOLS.find((t) => t.id === 'face_swap');
                if (fs && onSelectTool) onSelectTool(fs);
                setActiveTab('studio');
              }}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 bg-[#FF4500]/10 hover:bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/20 shadow-xs mr-1"
            >
              <Sparkles className="w-4 h-4 text-[#FF4500]" />
              <span>Face Swap</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FF4500] text-white font-bold">
                Populair
              </span>
            </button>

            {/* Megamenu AI Tools Trigger */}
            <div className="relative">
              <button
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                  megaMenuOpen
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900'
                }`}
              >
                <span>AI Tools</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Megamenu Dropdown Panel */}
              {megaMenuOpen && (
                <div
                  className="fixed inset-x-0 top-16 sm:top-20 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-xl max-h-[80vh] overflow-y-auto"
                >
                  <div className="max-w-7xl mx-auto p-6 space-y-6">
                    {/* Megamenu Search Header */}
                    <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-900">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Zoek in 40+ AI tools (bv. baby, video, tattoo, morph)..."
                          value={megaSearch}
                          onChange={(e) => setMegaSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF4500]"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => setMegaMenuOpen(false)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs flex items-center space-x-1 font-medium"
                      >
                        <X className="w-4 h-4" />
                        <span>Sluiten</span>
                      </button>
                    </div>

                    {/* Megamenu Categories Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                      {categories.map((cat) => (
                        <div key={cat.id} className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-900">
                            {cat.label}
                          </h4>
                          <div className="space-y-1">
                            {cat.tools.slice(0, 7).map((tool) => (
                              <button
                                key={tool.id}
                                onClick={() => {
                                  if (onSelectTool) onSelectTool(tool);
                                  setActiveTab('studio');
                                  setMegaMenuOpen(false);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="w-full text-left p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center justify-between text-xs group"
                              >
                                <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-[#FF4500] truncate">
                                  {tool.name}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0 font-mono ml-1">
                                  {tool.creditsCost}cr
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* View all tools link */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Alle tools draaien direct in dezelfde studio werkblad-schil.
                      </span>
                      <button
                        onClick={() => {
                          setActiveTab('tools');
                          setMegaMenuOpen(false);
                        }}
                        className="text-[#FF4500] hover:underline font-semibold flex items-center space-x-1"
                      >
                        <span>Bekijk tooloverzicht</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'studio'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#FF4500]" strokeWidth={1.75} />
              <span>Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'projects'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-[#0162FF]" strokeWidth={1.75} />
              <span>Projecten</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'vault'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900'
              }`}
            >
              <FolderLock className="w-4 h-4 text-[#00ACA9]" strokeWidth={1.75} />
              <span>Cloud Vault</span>
            </button>

            <button
              onClick={openPricingModal}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900 transition-colors"
            >
              <span>Pricing</span>
            </button>
          </nav>

          {/* Right Actions: Free Credits, Currency/Lang, Credits counter, Theme, Profile */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            
            {/* Free Credits Daily Claim Button */}
            <button
              onClick={openFreeCreditsModal}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#FF4500]/10 hover:bg-[#FF4500]/20 border border-[#FF4500]/30 text-[#FF4500] font-semibold text-xs transition-colors shadow-xs"
              title="Claim dagelijks 15 gratis credits (vervalt om 00:00 UTC)"
            >
              <Gift className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">Free Credits</span>
              <span className="text-[10px] bg-[#FF4500] text-white px-1.5 py-0.2 rounded font-bold">+15</span>
            </button>

            {/* Language Selector */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-slate-300 dark:hover:border-slate-700"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{language}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langDropdownOpen && (
                <div
                  className="absolute right-0 mt-1 w-24 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-1 z-50 text-xs"
                  onClick={() => setLangDropdownOpen(false)}
                >
                  {(['NL', 'EN', 'DE', 'FR'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg font-medium transition-colors ${
                        language === lang
                          ? 'bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {lang === 'NL' && '🇳🇱 NL'}
                      {lang === 'EN' && '🇬🇧 EN'}
                      {lang === 'DE' && '🇩🇪 DE'}
                      {lang === 'FR' && '🇫🇷 FR'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Credits Counter with Purchase Trigger */}
            <button
              onClick={openPricingModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 transition-colors shadow-xs group"
              title="Credits saldo en opwaarderen"
            >
              <Coins className="w-3.5 h-3.5 text-[#FF4500]" strokeWidth={1.75} />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {profile?.credits ?? 0}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">cr</span>
              <PlusCircle className="w-3 h-3 text-[#FF4500] opacity-75 group-hover:opacity-100 ml-0.5" />
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
              title={isDarkMode ? 'Lichte modus' : 'Donkere modus'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-[#FF4500]" /> : <Moon className="w-4 h-4 text-[#0162FF]" />}
            </button>

            {/* User Profile / Login */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-semibold text-xs shadow-xs"
              >
                <span>{profile?.displayName ? profile.displayName.split(' ')[0] : 'Inloggen'}</span>
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{profile?.displayName || 'Gast Gebruiker'}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{profile?.email || 'demo@swapsmoel.com'}</div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold capitalize">
                        {profile?.role || 'Creator'}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 flex items-center">
                        <Lock className="w-3 h-3 text-emerald-500 mr-1" />
                        E2EE Actief
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={openProfileModal}
                      className="w-full flex items-center px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                      <UserIcon className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      Mijn Account
                    </button>

                    <button
                      onClick={openPricingModal}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                      <span className="flex items-center">
                        <Coins className="w-3.5 h-3.5 text-[#FF4500] mr-2" />
                        Credits opwaarderen
                      </span>
                      <span className="text-[#FF4500] font-bold">+{profile?.bonusCredits || 0} bonus</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('vault')}
                      className="w-full flex items-center px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                      <FolderLock className="w-3.5 h-3.5 text-emerald-500 mr-2" />
                      Mijn Cloud Vault
                    </button>

                    <button
                      onClick={openOnboardingTutorial}
                      className="w-full flex items-center px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500 mr-2" />
                      Onboarding Gids
                    </button>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                    <button
                      onClick={logout}
                      className="w-full flex items-center px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2" />
                      Uitloggen
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-6 space-y-1.5 shadow-lg">
          <button
            onClick={() => { openFreeCreditsModal(); setMobileMenuOpen(false); }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold bg-[#FF4500]/10 text-[#FF4500] border border-[#FF4500]/20"
          >
            <div className="flex items-center space-x-2.5">
              <Gift className="w-4 h-4" />
              <span>Claim Dagelijkse Credits</span>
            </div>
            <span className="text-xs bg-[#FF4500] text-white px-2 py-0.5 rounded font-bold">+15 Gratis</span>
          </button>

          <button
            onClick={() => { setActiveTab('studio'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'studio' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-5 h-5 text-[#FF4500]" strokeWidth={1.75} />
            <span>Studio Workspace</span>
          </button>

          <button
            onClick={() => { setActiveTab('projects'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'projects' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <FolderKanban className="w-5 h-5 text-[#0162FF]" strokeWidth={1.75} />
            <span>Mijn Projecten</span>
          </button>

          <button
            onClick={() => { setActiveTab('vault'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'vault' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <FolderLock className="w-5 h-5 text-[#00ACA9]" strokeWidth={1.75} />
            <span>Cloud Vault (E2EE)</span>
          </button>

          <button
            onClick={() => { openPricingModal(); setMobileMenuOpen(false); }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Coins className="w-5 h-5 text-[#FF4500]" strokeWidth={1.75} />
            <span>Tarieven & Credits</span>
          </button>

          <button
            onClick={() => { openProfileModal(); setMobileMenuOpen(false); }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <UserIcon className="w-5 h-5 text-slate-500" strokeWidth={1.75} />
            <span>Profiel & Account</span>
          </button>

          <button
            onClick={() => { openOnboardingTutorial(); setMobileMenuOpen(false); }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <HelpCircle className="w-5 h-5 text-slate-500" strokeWidth={1.75} />
            <span>Onboarding Gids</span>
          </button>
        </div>
      )}
    </header>
  );
};
