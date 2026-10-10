import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  User,
  Mail,
  Lock,
  Coins,
  ShieldCheck,
  LogOut,
  X,
  Check,
  Key,
  HelpCircle,
  Sparkles,
  Camera,
  Layers,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  openPricingModal: () => void;
  openOnboardingTutorial: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  openPricingModal,
  openOnboardingTutorial,
}) => {
  const {
    profile,
    user,
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    logout,
    updateProfileDetails,
    activeEncryptionKey,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'auth'>('profile');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Form states
  const [nameInput, setNameInput] = useState(profile?.displayName || '');
  const [bioInput, setBioInput] = useState(profile?.bio || '');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // E2EE Key export state
  const [exportedKey, setExportedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileDetails({
      displayName: nameInput.trim() || 'Swapsmoel Creator',
      bio: bioInput.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    if (authMode === 'login') {
      await loginWithEmail(emailInput);
    } else {
      await signupWithEmail(nameInput || emailInput.split('@')[0], emailInput);
    }
    setActiveTab('profile');
  };

  const handleExportKey = () => {
    const rawKey = localStorage.getItem('swapsmoel_e2ee_key');
    setExportedKey(rawKey || 'Geen sleutel gevonden');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white font-semibold">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <User className="w-5 h-5 text-slate-700 dark:text-slate-300" strokeWidth={1.75} />
              )}
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                {profile?.displayName || 'Gebruikersprofiel'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{profile?.email || 'Niet ingelogd'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'profile' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mijn Profiel
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'security' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Beveiliging & E2EE Sleutels
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'auth' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Inloggen & Account
          </button>
        </div>

        {/* TAB 1: Profile Details */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            
            {/* Balance Overview Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Beschikbaar Saldo
                </div>
                <div className="font-heading text-2xl font-black text-amber-600 dark:text-amber-400 flex items-center space-x-1.5 mt-0.5">
                  <Coins className="w-5 h-5" />
                  <span>{profile?.credits ?? 0} Credits</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  +{profile?.bonusCredits ?? 0} bonus credits in afwachting
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  openPricingModal();
                }}
                className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md"
              >
                Opwaarderen
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Volledige Naam</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Korte Bio / Omschrijving</label>
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                rows={2}
                placeholder="Bijv. Digitale kunstenaar, content creator of marketeer..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            {/* Replay Onboarding Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openOnboardingTutorial();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Bekijk Onboarding Tutorial Opnieuw</span>
              </button>
            </div>

            {saveSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>Profiel succesvol bijgewerkt!</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={logout}
                className="text-xs text-rose-500 dark:text-rose-400 hover:underline flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Uitloggen</span>
              </button>

              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                Wijzigingen Opslaan
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Security & E2EE Keys */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>End-to-End Encryptie Sleutel (AES-GCM 256)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Jouw foto’s en projecten worden versleuteld met een cryptografische sleutel die uitsluitend lokaal op jouw apparaat wordt bewaard. Niemand anders heeft toegang.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={handleExportKey}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
              >
                <Key className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Exporteer Beveiligingssleutel (Backup)</span>
              </button>

              {exportedKey && (
                <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-amber-700 dark:text-amber-300 break-all select-all">
                  {exportedKey}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Sign in & Sign up */}
        {activeTab === 'auth' && (
          <div className="space-y-4">
            <div className="flex justify-center space-x-3 mb-2">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`text-xs font-bold pb-1 border-b-2 ${
                  authMode === 'login' ? 'border-amber-500 text-amber-700 dark:text-amber-300' : 'border-transparent text-slate-500 dark:text-slate-400'
                }`}
              >
                Inloggen
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`text-xs font-bold pb-1 border-b-2 ${
                  authMode === 'signup' ? 'border-amber-500 text-amber-700 dark:text-amber-300' : 'border-transparent text-slate-500 dark:text-slate-400'
                }`}
              >
                Nieuw Account Registreren
              </button>
            </div>

            {/* Google One-Click Login */}
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white dark:hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Doorgaan met Google</span>
            </button>

            <div className="relative text-center my-3">
              <span className="bg-white dark:bg-slate-900 px-2 text-[10px] text-slate-500 uppercase tracking-widest relative z-10">
                Of met e-mail
              </span>
              <div className="absolute inset-0 top-1/2 border-t border-slate-200 dark:border-slate-800" />
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Naam</label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">E-mailadres</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Wachtwoord</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
              >
                {authMode === 'login' ? 'Inloggen' : 'Registreren & Starten'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
