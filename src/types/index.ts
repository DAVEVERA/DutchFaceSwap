export type ToolCategory = 'face' | 'creative' | 'photo' | 'video' | 'audio' | 'batch';
export type ToolSuite = 'beeld' | 'removal' | 'video' | 'tattoo' | 'face';

export interface ToolSuiteDefinition {
  id: ToolSuite;
  name: string;
  iconName: string;
  toolIds: string[];
}

export interface ToolStyleOption {
  id: string;
  label: string;
  promptModifier?: string;
  thumbnailUrl?: string;
}

export interface ToolFaqItem {
  question: string;
  answer: string;
}

export type GeneratorModuleType =
  | 'image_generator'
  | 'anime_generator'
  | 'template_portraits'
  | 'baby_generator'
  | 'tattoo_suite'
  | 'product_description'
  | 'standard';

export interface AITool {
  id: string;
  name: string;
  dutchName: string;
  description: string;
  category: ToolCategory;
  suite?: ToolSuite;
  moduleType?: GeneratorModuleType;
  isLandingPageOnly?: boolean;
  targetToolId?: string;
  landingPageTargetName?: string;
  slogan?: string;
  oneLiner?: string;
  creditsCost: number;
  badge?: string;
  iconName: string;
  requiresUpload: boolean;
  aspectRatioSupported?: string[];
  supportsResolution?: boolean;
  popular?: boolean;
  isFreeToTry?: boolean;
  model: string;
  sampleImages?: Array<{ title: string; url: string }>;
  tryPrompts?: string[];
  styleOptions?: ToolStyleOption[];
  faqItems?: ToolFaqItem[];
}

export type Currency = 'EUR' | 'USD' | 'GBP';

export interface CreditPackage {
  id: string;
  credits: number;
  bonusCredits: number;
  priceEur: number;
  priceUsd: number;
  priceGbp: number;
  popular?: boolean;
  discountBadge?: string;
  freeTry?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  role: 'admin' | 'creator' | 'editor' | 'viewer';
  credits: number;
  bonusCredits: number;
  tier: 'free' | 'pro' | 'vip';
  preferredCurrency: Currency;
  encryptionEnabled: boolean;
  encryptionKeyExported?: string;
  onboardingCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFolder {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: 'Marketing' | 'Social Media' | 'Portretten' | 'E-commerce' | 'E-Commerce' | 'Kunst' | 'Persoonlijk' | 'Algemeen';
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectItem {
  id: string;
  userId: string;
  folderId?: string;
  title: string;
  toolId: string;
  toolCategory: ToolCategory;
  prompt: string;
  inputImageUrl?: string;
  resultUrl: string;
  aspectRatio: string;
  resolution?: string;
  status: 'processing' | 'completed' | 'failed';
  creditsCost: number;
  isEncrypted: boolean;
  encryptedData?: string;
  encryptedIv?: string;
  modelUsed?: string;
  version?: number;
  tags?: string[];
  createdAt: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  credits: number;
  bonusCredits: number;
  amount: number;
  currency: Currency;
  paymentMethod: string;
  status: 'completed' | 'pending';
  invoiceNumber: string;
  createdAt: string;
}

export interface AdminMetrics {
  totalGenerations: number;
  activeUsersToday: number;
  revenueEur: number;
  apiCostEur: number;
  marginPercent: number;
  avgLatencyMs: number;
  serverUptime: string;
  storageEncryptedVaults: number;
}
