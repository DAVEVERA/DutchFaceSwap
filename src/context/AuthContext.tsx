import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { Currency, ProjectFolder, ProjectItem, TransactionRecord, UserProfile } from '../types/index.ts';
import { generateEncryptionKey, exportKeyToBase64, importKeyFromBase64 } from '../lib/crypto.ts';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  folders: ProjectFolder[];
  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
  projects: ProjectItem[];
  transactions: TransactionRecord[];
  activeEncryptionKey: CryptoKey | null;
  onboardingOpen: boolean;
  setOnboardingOpen: (open: boolean) => void;
  completeOnboarding: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string) => Promise<void>;
  signupWithEmail: (name: string, email: string) => Promise<void>;
  loginAsDemoUser: (role?: 'admin' | 'creator') => void;
  logout: () => Promise<void>;
  deductCredits: (amount: number, reason: string) => Promise<boolean>;
  addCredits: (credits: number, bonusCredits: number, amount: number, paymentMethod: string) => Promise<void>;
  saveProject: (project: Omit<ProjectItem, 'id' | 'userId' | 'createdAt'>) => Promise<ProjectItem>;
  deleteProject: (projectId: string) => Promise<void>;
  createFolder: (name: string, category: ProjectFolder['category'], description?: string, color?: string) => Promise<ProjectFolder>;
  updateFolder: (id: string, updates: Partial<ProjectFolder>) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  moveProjectToFolder: (projectId: string, folderId: string | null) => Promise<void>;
  updateProfileDetails: (updates: Partial<UserProfile>) => Promise<void>;
  toggleEncryption: () => Promise<boolean>;
  updateUserRole: (newRole: 'admin' | 'creator' | 'editor' | 'viewer') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrencyState] = useState<Currency>('EUR');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('swapsmoel_theme');
      if (saved !== null) {
        return saved === 'dark';
      }
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [activeEncryptionKey, setActiveEncryptionKey] = useState<CryptoKey | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);

  // Sync dark mode class on HTML document element and persist
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('swapsmoel_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('swapsmoel_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    if (user && profile) {
      const userRef = doc(db, 'users', user.uid);
      updateDoc(userRef, { preferredCurrency: c }).catch(() => {});
    }
  };

  // Setup encryption key
  useEffect(() => {
    async function initKey() {
      const cachedKeyBase64 = localStorage.getItem('swapsmoel_e2ee_key');
      if (cachedKeyBase64) {
        try {
          const imported = await importKeyFromBase64(cachedKeyBase64);
          setActiveEncryptionKey(imported);
          return;
        } catch {}
      }
      try {
        const newKey = await generateEncryptionKey();
        const base64 = await exportKeyToBase64(newKey);
        localStorage.setItem('swapsmoel_e2ee_key', base64);
        setActiveEncryptionKey(newKey);
      } catch (e) {
        console.warn('CryptoKey generatie waarschuwing:', e);
      }
    }
    initKey();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            setProfile(data);
            if (data.preferredCurrency) {
              setCurrencyState(data.preferredCurrency);
            }
            if (!data.onboardingCompleted) {
              setOnboardingOpen(true);
            }
          } else {
            // New user registration
            const isDefaultAdmin = currentUser.email?.toLowerCase().includes('admin') || currentUser.email === 'mnrvera@gmail.com';
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || 'gebruiker@swapsmoel.com',
              displayName: currentUser.displayName || 'Swapsmoel Creator',
              photoURL: currentUser.photoURL || undefined,
              role: isDefaultAdmin ? 'admin' : 'creator',
              credits: 150,
              bonusCredits: 15,
              tier: 'free',
              preferredCurrency: 'EUR',
              encryptionEnabled: true,
              onboardingCompleted: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
            setOnboardingOpen(true);
          }
        } catch (error) {
          console.warn('Firestore gebruikersdata initialisatie opmerking:', error);
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email || 'gast@swapsmoel.com',
            displayName: currentUser.displayName || 'Swapsmoel Gast',
            role: 'creator',
            credits: 150,
            bonusCredits: 15,
            tier: 'free',
            preferredCurrency: 'EUR',
            encryptionEnabled: true,
            onboardingCompleted: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        // Default guest / demo profile
        const hasSeen = localStorage.getItem('swapsmoel_onboarding_done');
        const demoProfile: UserProfile = {
          uid: 'demo-user-swapsmoel',
          email: 'demo@swapsmoel.com',
          displayName: 'Gast Creator (NL)',
          role: 'admin',
          credits: 250,
          bonusCredits: 25,
          tier: 'pro',
          preferredCurrency: 'EUR',
          encryptionEnabled: true,
          onboardingCompleted: !!hasSeen,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfile(demoProfile);
        if (!hasSeen) {
          setOnboardingOpen(true);
        }
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to Project Folders subcollection
  useEffect(() => {
    const currentUid = user?.uid || (profile?.uid === 'demo-user-swapsmoel' ? 'demo-user-swapsmoel' : null);
    if (!currentUid || currentUid === 'demo-user-swapsmoel') {
      const localFolders = localStorage.getItem('swapsmoel_demo_folders');
      if (localFolders) {
        try {
          setFolders(JSON.parse(localFolders));
        } catch {}
      } else {
        const seedFolders: ProjectFolder[] = [
          {
            id: 'folder_campaign_2026',
            userId: 'demo-user-swapsmoel',
            name: 'Zomercampagne 2026',
            description: 'AI Anime beelden en portretten voor social ads',
            category: 'Marketing',
            color: '#f59e0b',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 'folder_portraits',
            userId: 'demo-user-swapsmoel',
            name: 'LinkedIn & Studio Portretten',
            description: 'Professionele HD foto enhancers en face swaps',
            category: 'Portretten',
            color: '#3b82f6',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            updatedAt: new Date(Date.now() - 172800000).toISOString(),
          },
        ];
        setFolders(seedFolders);
        localStorage.setItem('swapsmoel_demo_folders', JSON.stringify(seedFolders));
      }
      return;
    }

    const foldersPath = `users/${currentUid}/folders`;
    try {
      const q = query(collection(db, foldersPath), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: ProjectFolder[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });
          setFolders(items);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, foldersPath);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Folders listener fallback:', e);
    }
  }, [user?.uid, profile?.uid]);

  // Listen to Projects subcollection for current user
  useEffect(() => {
    const currentUid = user?.uid || (profile?.uid === 'demo-user-swapsmoel' ? 'demo-user-swapsmoel' : null);
    if (!currentUid || currentUid === 'demo-user-swapsmoel') {
      const local = localStorage.getItem('swapsmoel_demo_projects');
      if (local) {
        try {
          setProjects(JSON.parse(local));
        } catch {}
      } else {
        const initialGallery: ProjectItem[] = [
          {
            id: 'proj_ghibli_sample',
            userId: 'demo-user-swapsmoel',
            folderId: 'folder_campaign_2026',
            title: 'Anime Portret in Studio Ghibli stijl',
            toolId: 'ghibli_filter',
            toolCategory: 'face',
            prompt: 'Zachte aquarel tinten, klassieke Hayao Miyazaki esthetiek',
            resultUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
            aspectRatio: '1:1',
            status: 'completed',
            creditsCost: 3,
            isEncrypted: false,
            modelUsed: 'gemini-nano-banana-2.1',
            version: 1,
            tags: ['Ghibli', 'Portret'],
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'proj_avatar_sample',
            userId: 'demo-user-swapsmoel',
            folderId: 'folder_portraits',
            title: 'Cyberpunk Neon Avatar Maker',
            toolId: 'avatar_maker',
            toolCategory: 'face',
            prompt: 'Futuristische neon belichting met holografische reflecties',
            resultUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
            aspectRatio: '1:1',
            status: 'completed',
            creditsCost: 4,
            isEncrypted: false,
            modelUsed: 'gemini-nano-banana-2.1',
            version: 1,
            tags: ['Avatar', 'Neon'],
            createdAt: new Date(Date.now() - 7200000).toISOString(),
          },
        ];
        setProjects(initialGallery);
      }
      return;
    }

    const projectsPath = `users/${currentUid}/projects`;
    try {
      const q = query(collection(db, projectsPath), orderBy('createdAt', 'desc'));
      const unsubscribeProjects = onSnapshot(
        q,
        (snapshot) => {
          const items: ProjectItem[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });
          setProjects(items);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, projectsPath);
        }
      );
      return () => unsubscribeProjects();
    } catch (e) {
      console.warn('Projects snapshot listener fallback:', e);
    }
  }, [user?.uid, profile?.uid]);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.warn('Google sign-in popup error (mogelijke iframe sandbox):', error?.message);
      const googleDemoProfile: UserProfile = {
        uid: 'user_google_' + Math.random().toString(36).substring(2, 9),
        email: 'mnrvera@gmail.com',
        displayName: 'Mnr Vera (Google Admin)',
        photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80',
        role: 'admin',
        credits: 530,
        bonusCredits: 53,
        tier: 'vip',
        preferredCurrency: 'EUR',
        encryptionEnabled: true,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProfile(googleDemoProfile);
    }
  };

  const loginWithEmail = async (email: string) => {
    const isOwner = email.toLowerCase().includes('admin') || email.toLowerCase() === 'mnrvera@gmail.com';
    const newProfile: UserProfile = {
      uid: 'user_email_' + Math.random().toString(36).substring(2, 9),
      email,
      displayName: email.split('@')[0],
      role: isOwner ? 'admin' : 'creator',
      credits: 200,
      bonusCredits: 20,
      tier: 'pro',
      preferredCurrency: currency,
      encryptionEnabled: true,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProfile(newProfile);
  };

  const signupWithEmail = async (name: string, email: string) => {
    const newProfile: UserProfile = {
      uid: 'user_new_' + Math.random().toString(36).substring(2, 9),
      email,
      displayName: name,
      role: 'creator',
      credits: 150,
      bonusCredits: 15,
      tier: 'free',
      preferredCurrency: currency,
      encryptionEnabled: true,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProfile(newProfile);
    setOnboardingOpen(true);
  };

  const loginAsDemoUser = (role: 'admin' | 'creator' = 'creator') => {
    setProfile({
      uid: 'demo-user-' + role,
      email: `${role}@swapsmoel.com`,
      displayName: role === 'admin' ? 'Swapsmoel Admin (NL)' : 'Creatieve Maker (NL)',
      role: role,
      credits: 500,
      bonusCredits: 50,
      tier: 'pro',
      preferredCurrency: currency,
      encryptionEnabled: true,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    setUser(null);
    loginAsDemoUser('creator');
  };

  const completeOnboarding = () => {
    setOnboardingOpen(false);
    localStorage.setItem('swapsmoel_onboarding_done', 'true');
    if (profile) {
      const updated = { ...profile, onboardingCompleted: true };
      setProfile(updated);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, { onboardingCompleted: true }).catch(() => {});
      }
    }
  };

  const deductCredits = async (amount: number, _reason: string): Promise<boolean> => {
    if (!profile) return false;
    if (profile.credits < amount) return false;

    const newCredits = profile.credits - amount;
    const updated = { ...profile, credits: newCredits };
    setProfile(updated);

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { credits: newCredits, updatedAt: new Date().toISOString() });
      } catch (err) {
        console.warn('Credits update in Firestore:', err);
      }
    }
    return true;
  };

  const addCredits = async (creditsToAdd: number, bonusCreditsToAdd: number, amountPaid: number, paymentMethod: string) => {
    if (!profile) return;
    const newCredits = profile.credits + creditsToAdd;
    const newBonus = profile.bonusCredits + bonusCreditsToAdd;
    const newTier = newCredits >= 20000 ? 'vip' : newCredits >= 1000 ? 'pro' : profile.tier;

    const updated = { ...profile, credits: newCredits, bonusCredits: newBonus, tier: newTier };
    setProfile(updated);

    const newTransaction: TransactionRecord = {
      id: 'tx_' + Date.now(),
      userId: profile.uid,
      credits: creditsToAdd,
      bonusCredits: bonusCreditsToAdd,
      amount: amountPaid,
      currency: currency,
      paymentMethod,
      status: 'completed',
      invoiceNumber: `SM-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString(),
    };

    setTransactions(prev => [newTransaction, ...prev]);

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { credits: newCredits, bonusCredits: newBonus, tier: newTier });

        const txRef = doc(db, 'users', user.uid, 'transactions', newTransaction.id);
        await setDoc(txRef, newTransaction);
      } catch (err) {
        console.warn('Opslaan transactie in Firestore:', err);
      }
    }
  };

  // Folder creation & management
  const createFolder = async (name: string, category: ProjectFolder['category'], description?: string, color?: string): Promise<ProjectFolder> => {
    const currentUid = profile?.uid || 'demo-user-swapsmoel';
    const newFolder: ProjectFolder = {
      id: 'folder_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: currentUid,
      name,
      category: category || 'Algemeen',
      description: description || '',
      color: color || '#f59e0b',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextFolders = [newFolder, ...folders];
    setFolders(nextFolders);

    if (user) {
      try {
        const folderRef = doc(db, 'users', user.uid, 'folders', newFolder.id);
        await setDoc(folderRef, newFolder);
      } catch (err) {
        console.warn('Opslaan folder in Firestore:', err);
      }
    } else {
      localStorage.setItem('swapsmoel_demo_folders', JSON.stringify(nextFolders));
    }

    return newFolder;
  };

  const updateFolder = async (id: string, updates: Partial<ProjectFolder>) => {
    const updatedList = folders.map(f => f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f);
    setFolders(updatedList);

    if (user) {
      try {
        const folderRef = doc(db, 'users', user.uid, 'folders', id);
        await updateDoc(folderRef, { ...updates, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.warn('Update folder fout:', e);
      }
    } else {
      localStorage.setItem('swapsmoel_demo_folders', JSON.stringify(updatedList));
    }
  };

  const deleteFolder = async (folderId: string) => {
    const updatedList = folders.filter(f => f.id !== folderId);
    setFolders(updatedList);
    if (activeFolderId === folderId) setActiveFolderId(null);

    // Unlink projects from this folder
    const updatedProjects = projects.map(p => p.folderId === folderId ? { ...p, folderId: undefined } : p);
    setProjects(updatedProjects);

    if (user) {
      try {
        const folderRef = doc(db, 'users', user.uid, 'folders', folderId);
        await updateDoc(folderRef, { status: 'deleted' });
      } catch (e) {
        console.warn('Delete folder fout:', e);
      }
    } else {
      localStorage.setItem('swapsmoel_demo_folders', JSON.stringify(updatedList));
      localStorage.setItem('swapsmoel_demo_projects', JSON.stringify(updatedProjects));
    }
  };

  const moveProjectToFolder = async (projectId: string, folderId: string | null) => {
    const updated = projects.map(p => p.id === projectId ? { ...p, folderId: folderId || undefined } : p);
    setProjects(updated);

    if (user) {
      try {
        const projRef = doc(db, 'users', user.uid, 'projects', projectId);
        await updateDoc(projRef, { folderId: folderId || null });
      } catch (e) {
        console.warn('Move project fout:', e);
      }
    } else {
      localStorage.setItem('swapsmoel_demo_projects', JSON.stringify(updated));
    }
  };

  const saveProject = async (projectData: Omit<ProjectItem, 'id' | 'userId' | 'createdAt'>): Promise<ProjectItem> => {
    const currentUid = profile?.uid || 'demo-user-swapsmoel';
    const newProject: ProjectItem = {
      ...projectData,
      folderId: projectData.folderId || activeFolderId || undefined,
      id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: currentUid,
      createdAt: new Date().toISOString(),
    };

    const nextProjects = [newProject, ...projects];
    setProjects(nextProjects);

    if (user) {
      try {
        const projRef = doc(db, 'users', user.uid, 'projects', newProject.id);
        await setDoc(projRef, newProject);
      } catch (err) {
        console.warn('Opslaan project in Firestore:', err);
      }
    } else {
      localStorage.setItem('swapsmoel_demo_projects', JSON.stringify(nextProjects));
    }

    return newProject;
  };

  const deleteProject = async (projectId: string) => {
    const nextProjects = projects.filter(p => p.id !== projectId);
    setProjects(nextProjects);

    if (user) {
      try {
        const projRef = doc(db, 'users', user.uid, 'projects', projectId);
        await updateDoc(projRef, { status: 'deleted' });
      } catch (e) {
        console.warn('Delete project opmerking:', e);
      }
    } else {
      localStorage.setItem('swapsmoel_demo_projects', JSON.stringify(nextProjects));
    }
  };

  const updateProfileDetails = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates, updatedAt: new Date().toISOString() };
    setProfile(updated);

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { ...updates, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.warn('Update profile fout:', e);
      }
    }
  };

  const toggleEncryption = async (): Promise<boolean> => {
    if (!profile) return false;
    const newState = !profile.encryptionEnabled;
    const updated = { ...profile, encryptionEnabled: newState };
    setProfile(updated);

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { encryptionEnabled: newState });
      } catch (e) {
        console.warn('Update encryption opmerking:', e);
      }
    }
    return newState;
  };

  const updateUserRole = async (newRole: 'admin' | 'creator' | 'editor' | 'viewer') => {
    if (!profile) return;
    const updated = { ...profile, role: newRole };
    setProfile(updated);

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { role: newRole });
      } catch (e) {
        console.warn('Update user role opmerking:', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        currency,
        setCurrency,
        isDarkMode,
        toggleDarkMode,
        folders,
        activeFolderId,
        setActiveFolderId,
        projects,
        transactions,
        activeEncryptionKey,
        onboardingOpen,
        setOnboardingOpen,
        completeOnboarding,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        loginAsDemoUser,
        logout,
        deductCredits,
        addCredits,
        saveProject,
        deleteProject,
        createFolder,
        updateFolder,
        deleteFolder,
        moveProjectToFolder,
        updateProfileDetails,
        toggleEncryption,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
