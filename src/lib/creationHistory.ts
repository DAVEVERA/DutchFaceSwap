export interface CreationHistoryItem {
  id: string;
  toolId: string;
  toolName: string;
  prompt: string;
  inputUrl?: string;
  resultUrl: string;
  type: 'image' | 'video' | 'audio' | 'text';
  resolution?: string;
  aspectRatio?: string;
  style?: string;
  model?: string;
  retentionDays?: number;
  createdAt: number;
}

const STORAGE_KEY = 'swapsmoel_creation_history';
const MAX_ITEMS = 80;
const DEFAULT_EXPIRY_DAYS = 7;

export function getCreationHistory(): CreationHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: CreationHistoryItem[] = JSON.parse(raw);
    const now = Date.now();
    // Filter out expired items based on item retention days or default 7 days
    const valid = items.filter((item) => {
      const days = item.retentionDays || DEFAULT_EXPIRY_DAYS;
      const expiryMs = days * 24 * 60 * 60 * 1000;
      return now - item.createdAt < expiryMs;
    });
    if (valid.length !== items.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }
    return valid.slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function saveCreationHistoryItem(
  item: Omit<CreationHistoryItem, 'id' | 'createdAt'>
): CreationHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getCreationHistory();
    const newItem: CreationHistoryItem = {
      ...item,
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      createdAt: Date.now(),
    };
    const updated = [newItem, ...existing].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function removeCreationHistoryItem(id: string): CreationHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getCreationHistory();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearCreationHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
