import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { decryptData } from '../lib/crypto.ts';
import { ProjectItem } from '../types/index.ts';
import {
  FolderLock,
  Lock,
  Unlock,
  ShieldCheck,
  Download,
  Trash2,
  Calendar,
} from 'lucide-react';

export const CloudVault: React.FC = () => {
  const {
    projects,
    profile,
    activeEncryptionKey,
    updateProfileDetails,
    deleteProject,
  } = useAuth();

  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const toggleEncryption = async () => {
    if (!profile) return;
    await updateProfileDetails({
      encryptionEnabled: !profile.encryptionEnabled,
    });
  };

  const handleInspect = async (proj: ProjectItem) => {
    setSelectedProject(proj);
    setDecryptedUrl(null);

    if (proj.isEncrypted && proj.encryptedData && activeEncryptionKey) {
      setIsDecrypting(true);
      try {
        const decrypted = await decryptData(proj.encryptedData, proj.encryptedIv || '', activeEncryptionKey);
        setDecryptedUrl(decrypted);
      } catch (err) {
        console.error('Decryption failed:', err);
      } finally {
        setIsDecrypting(false);
      }
    } else {
      setDecryptedUrl(proj.resultUrl);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Vault Header & Security Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#00ACA9]/10 border border-[#00ACA9]/25 text-[#00ACA9] text-xs font-bold uppercase mb-2">
            <ShieldCheck className="w-4 h-4 text-[#00ACA9]" />
            <span>Zero-Knowledge AES-GCM Encrypted Cloud</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Mijn Cloud Vault
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            Al jouw gegenereerde afbeeldingen, video’s en face morphs worden beveiligd opgeslagen en gesynchroniseerd met Firestore.
          </p>
        </div>

        {/* E2EE Toggle Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-4 shadow-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-emerald-500 dark:text-emerald-400">
            {profile?.encryptionEnabled ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5 text-amber-500" />}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1">
              <span>End-to-End Encryptie</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">(AES-256)</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {profile?.encryptionEnabled ? 'Actief • Alleen jij hebt de sleutel' : 'Uitgeschakeld'}
            </div>
          </div>
          <button
            onClick={toggleEncryption}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              profile?.encryptionEnabled
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            {profile?.encryptionEnabled ? 'Ingeschakeld' : 'Inschakelen'}
          </button>
        </div>
      </div>

      {/* Projects Gallery */}
      {projects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 max-w-md mx-auto my-12 shadow-xs">
          <FolderLock className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="font-heading text-xl font-bold text-slate-900 dark:text-white">Je Cloud Vault is nog leeg</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Ga naar de Studio Workspace, pas effecten toe en klik op "Opslaan in Cloud Vault" om projecten veilig te bewaren.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => handleInspect(proj)}
              className="cursor-pointer group p-3.5 rounded-3xl bg-white dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0162FF]/50 dark:hover:border-[#0162FF]/40 transition-all flex flex-col justify-between shadow-xs hover:shadow-xl hover:shadow-[#0162FF]/5"
            >
              <div>
                {/* Thumbnail / Image container */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 aspect-square border border-slate-200 dark:border-slate-800/80 mb-3 flex items-center justify-center">
                  {proj.isEncrypted ? (
                    <div className="text-center p-4">
                      <Lock className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto mb-1 animate-pulse" />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                        E2EE Versleuteld
                      </span>
                    </div>
                  ) : (
                    <img
                      src={proj.resultUrl}
                      alt={proj.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-[10px] font-semibold text-white">
                    {proj.aspectRatio}
                  </div>
                </div>

                {/* Metadata */}
                <h4 className="font-heading text-base font-bold text-slate-900 dark:text-white group-hover:text-[#FF4500] transition-colors truncate">
                  {proj.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  "{proj.prompt}"
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(proj.createdAt).toLocaleDateString('nl-NL')}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject(proj.id);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                  title="Verwijder uit Vault"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-heading text-xl font-bold text-slate-900 dark:text-white truncate">
                {selectedProject.title}
              </h4>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 max-h-80 flex items-center justify-center">
              {isDecrypting ? (
                <div className="text-xs text-amber-600 dark:text-amber-400 py-12">
                  Bezig met ontsleutelen op apparaat...
                </div>
              ) : decryptedUrl ? (
                <img
                  src={decryptedUrl}
                  alt={selectedProject.title}
                  className="max-h-80 w-auto object-contain"
                />
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400 py-12">
                  Kan beeld niet weergeven
                </div>
              )}
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div><strong>Prompt:</strong> {selectedProject.prompt}</div>
              <div><strong>Model gebruikt:</strong> {selectedProject.modelUsed || 'Gemini Nano Banana'}</div>
              <div><strong>Versleuteling:</strong> {selectedProject.isEncrypted ? 'Ja (AES-256 GCM)' : 'Nee'}</div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              {decryptedUrl && (
                <a
                  href={decryptedUrl}
                  download={`vault-${selectedProject.id}.png`}
                  className="flex-1 py-2.5 rounded-xl bg-[#0162FF] hover:bg-[#003878] text-white text-center font-semibold text-xs flex items-center justify-center space-x-1 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Downloaden</span>
                </a>
              )}
              <button
                onClick={() => {
                  deleteProject(selectedProject.id);
                  setSelectedProject(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 font-bold text-xs hover:bg-rose-500/20 dark:hover:bg-rose-500/30 transition-colors"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
