import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Lock,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  X,
} from 'lucide-react';

interface AdminGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export const AdminGateModal: React.FC<AdminGateModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
}) => {
  const { profile } = useAuth();
  const [accessKey, setAccessKey] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setErrorMsg(null);

    // Accept master access key "swapsmoel2026" or verify admin role
    const isValidKey = accessKey.trim().toLowerCase() === 'swapsmoel2026' || accessKey.trim() === 'admin';
    const isAdminUser = profile?.role === 'admin' || profile?.email === 'mnrvera@gmail.com';

    if (isValidKey || (isAdminUser && accessKey.length > 0)) {
      setTimeout(() => {
        setIsVerifying(false);
        onAuthenticated();
        onClose();
      }, 500);
    } else {
      setTimeout(() => {
        setIsVerifying(false);
        setErrorMsg('Ongeldige beheerderstoegangssleutel. Toegang geweigerd.');
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-6 shadow-2xl">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
            Beheerderspoort
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dit portaal is afgeschermd. Voer de geheime toegangssleutel in om door te gaan.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Beheerders Sleutel
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="password"
                required
                autoFocus
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Voer sleutel in..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              (Standaardsleutel: swapsmoel2026)
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <span>{isVerifying ? 'Verifiëren...' : 'Ontgrendel Portaal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
