import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HeroBanner } from './components/HeroBanner.tsx';
import { ToolGrid } from './components/ToolGrid.tsx';
import { StudioWorkspace } from './components/StudioWorkspace.tsx';
import { CloudVault } from './components/CloudVault.tsx';
import { ProjectManager } from './components/ProjectManager.tsx';
import { PricingModal } from './components/PricingModal.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { AdminGateModal } from './components/AdminGateModal.tsx';
import { BatchProcessorModal } from './components/BatchProcessorModal.tsx';
import { SocialShareModal } from './components/SocialShareModal.tsx';
import { UserProfileModal } from './components/UserProfileModal.tsx';
import { OnboardingTutorial } from './components/OnboardingTutorial.tsx';
import { FreeCreditsModal } from './components/FreeCreditsModal.tsx';
import { Footer } from './components/Footer.tsx';
import { AI_TOOLS } from './data/toolsData.ts';
import { AITool, ProjectItem, ToolCategory } from './types/index.ts';
import { Lock, ArrowLeft } from 'lucide-react';

function MainApp() {
  const {
    onboardingOpen,
    setOnboardingOpen,
    setActiveFolderId,
  } = useAuth();

  // Visitor lands directly on the shared workbench without intermediate page
  const [activeTab, setActiveTab] = useState<'tools' | 'studio' | 'vault' | 'pricing' | 'admin' | 'batch' | 'projects'>('studio');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Default tool: Face Swap is the primary core tool of Swapsmoel
  const defaultTool = AI_TOOLS.find((t) => t.id === 'face_swap') || AI_TOOLS[0];
  const [selectedTool, setSelectedTool] = useState<AITool>(defaultTool);

  // Modals state
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [freeCreditsModalOpen, setFreeCreditsModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [adminGateOpen, setAdminGateOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Social Share Modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTargetProject, setShareTargetProject] = useState<ProjectItem | null>(null);

  // Hidden admin entrance keyboard listener: Ctrl+Shift+A or Cmd+Shift+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setAdminGateOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (window.location.hash === '#admin' || window.location.search.includes('admin=true')) {
      setAdminGateOpen(true);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectTool = (tool: AITool) => {
    setSelectedTool(tool);
    if (tool.category === 'batch') {
      setBatchModalOpen(true);
    } else {
      setActiveTab('studio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenStudioWithProject = (folderId: string) => {
    setActiveFolderId(folderId);
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenShareModal = (project: ProjectItem) => {
    setShareTargetProject(project);
    setShareModalOpen(true);
  };

  const handleAdminUnlocked = () => {
    setIsAdminAuthenticated(true);
    setActiveTab('admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#282828] dark:bg-[#040814] dark:text-[#E8E8E8] flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Banner when in Admin Mode */}
      {activeTab === 'admin' && (
        <div className="bg-indigo-950/90 border-b border-indigo-800/80 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-indigo-300 font-bold">
            <Lock className="w-4 h-4 text-indigo-400" />
            <span>Beheerdersmodus Actief (Afgeschermde Entree)</span>
          </div>
          <button
            onClick={() => setActiveTab('studio')}
            className="px-3 py-1 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Verlaat Beheerdersportaal</span>
          </button>
        </div>
      )}

      {/* Topbalk: Logo, megamenu "AI Tools", Pricing, Taalkeuze, Creditteller, Free Credits, Log in */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'pricing') {
            setPricingModalOpen(true);
          } else if (tab === 'batch') {
            setBatchModalOpen(true);
          } else if (tab === 'admin') {
            if (isAdminAuthenticated) {
              setActiveTab('admin');
            } else {
              setAdminGateOpen(true);
            }
          } else {
            setActiveTab(tab);
          }
        }}
        openPricingModal={() => setPricingModalOpen(true)}
        openProfileModal={() => setProfileModalOpen(true)}
        openOnboardingTutorial={() => setOnboardingOpen(true)}
        openAdminGate={() => setAdminGateOpen(true)}
        openFreeCreditsModal={() => setFreeCreditsModalOpen(true)}
        onSelectTool={handleSelectTool}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* SHARED WORKBENCH: Gedeeld kader voor alle tools */}
        {activeTab === 'studio' && (
          <StudioWorkspace
            initialTool={selectedTool}
            openPricingModal={() => setPricingModalOpen(true)}
            onOpenVault={() => setActiveTab('vault')}
            onOpenShareModal={handleOpenShareModal}
          />
        )}

        {/* 40+ AI Tools Catalog Browser (via Megamenu of link) */}
        {activeTab === 'tools' && (
          <>
            <HeroBanner
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
              openPricingModal={() => setPricingModalOpen(true)}
              onOpenStudio={() => setActiveTab('studio')}
            />

            <ToolGrid
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSelectTool={handleSelectTool}
            />
          </>
        )}

        {/* Project Management System */}
        {activeTab === 'projects' && (
          <ProjectManager
            onOpenStudioWithProject={handleOpenStudioWithProject}
            onOpenShareModal={handleOpenShareModal}
          />
        )}

        {/* Cloud Vault (End-to-End Encrypted) */}
        {activeTab === 'vault' && (
          <CloudVault />
        )}

        {/* Admin Portal & Metrics */}
        {activeTab === 'admin' && (
          <AdminPortal />
        )}

      </main>

      {/* Footer: Productlinks, Pricing, About, Privacy, Terms, Content Policy, contactadres */}
      <Footer
        onSelectTool={handleSelectTool}
        openPricingModal={() => setPricingModalOpen(true)}
        openProfileModal={() => setProfileModalOpen(true)}
      />

      {/* Modals */}
      {/* 1. Pricing & Credits Modal */}
      <PricingModal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
      />

      {/* 2. Dagelijkse Free Credits Modal */}
      <FreeCreditsModal
        isOpen={freeCreditsModalOpen}
        onClose={() => setFreeCreditsModalOpen(false)}
        openPricingModal={() => {
          setFreeCreditsModalOpen(false);
          setPricingModalOpen(true);
        }}
      />

      {/* 3. Batch Processing Modal */}
      <BatchProcessorModal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        openPricingModal={() => setPricingModalOpen(true)}
      />

      {/* 4. User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        openPricingModal={() => setPricingModalOpen(true)}
        openOnboardingTutorial={() => setOnboardingOpen(true)}
      />

      {/* 5. Onboarding Tutorial */}
      <OnboardingTutorial
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onStartCreating={() => setActiveTab('studio')}
      />

      {/* 6. Social Media Sharing Modal */}
      <SocialShareModal
        project={shareTargetProject}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      {/* 7. Hidden Admin Gate Modal */}
      <AdminGateModal
        isOpen={adminGateOpen}
        onClose={() => setAdminGateOpen(false)}
        onAuthenticated={handleAdminUnlocked}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
