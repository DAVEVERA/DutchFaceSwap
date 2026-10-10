import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Gift, Clock, Check, Sparkles, X, Coins, ArrowRight } from 'lucide-react';

interface FreeCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  openPricingModal: () => void;
}

export const FreeCreditsModal: React.FC<FreeCreditsModalProps> = ({
  isOpen,
  onClose,
  openPricingModal,
}) => {
  const { profile, addCredits } = useAuth();
  const [timeLeft, setTimeLeft] = useState('');
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);

  const getTodayUTCKey = () => {
    return new Date().toISOString().slice(0, 10);
  };

  useEffect(() => {
    const todayKey = getTodayUTCKey();
    const claimedDate = localStorage.getItem('swapsmoel_daily_claim_date');
    if (claimedDate === todayKey) {
      setAlreadyClaimed(true);
    } else {
      setAlreadyClaimed(false);
    }

    const updateTimer = () => {
      const now = new Date();
      const nextMidnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const diffMs = Math.max(0, nextMidnightUTC.getTime() - now.getTime());
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = async () => {
    const todayKey = getTodayUTCKey();
    localStorage.setItem('swapsmoel_daily_claim_date', todayKey);
    setAlreadyClaimed(true);
    setJustClaimed(true);

    try {
      await addCredits(15, 0, 0, 'daily_free_claim');
    } catch (e) {
      console.warn('Credits claimen:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Sluiten"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#FF4500]/10 border border-[#FF4500]/20 text-[#FF4500] flex items-center justify-center mx-auto">
            <Gift className="w-6 h-6" strokeWidth={1.75} />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Dagelijkse Gratis Credits
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              Ontvang elke dag 15 gratis credits om al onze AI tools uit te proberen. Ongebruikte dagcredits vervallen om 00:00 UTC.
            </p>
          </div>

          {/* Reward Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Huidig saldo:</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center">
                <Coins className="w-3.5 h-3.5 text-[#FF4500] mr-1" />
                {profile?.credits ?? 0} credits
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                  <Sparkles className="w-4 h-4 text-[#FF4500] mr-1.5" />
                  +15 Dagelijkse Credits
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Geldig tot middernacht
                </div>
              </div>
              <span className="text-xs font-bold text-[#FF4500]">Gratis</span>
            </div>

            {/* Countdown timer to 00:00 UTC */}
            <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <Clock className="w-3.5 h-3.5 text-[#0162FF]" />
              <span>Resterende tijd tot 00:00 UTC reset:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {timeLeft || '--:--:--'}
              </span>
            </div>
          </div>

          {/* Action button */}
          {alreadyClaimed ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center space-x-2">
                <Check className="w-4 h-4" />
                <span>
                  {justClaimed ? '15 Credits succesvol bijgeschreven!' : 'Vandaag al geclaimd'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Morgen om 00:00 UTC kun je opnieuw 15 gratis credits claimen.
              </p>
              <button
                onClick={() => {
                  onClose();
                  openPricingModal();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>Meer credits bijkopen zonder abonnement</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              className="w-full py-3 px-4 rounded-xl bg-[#FF4500] hover:bg-[#E03E00] text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Claim +15 Gratis Credits</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
