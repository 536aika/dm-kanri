const STORAGE_KEY_PREFIX = 'dmBreakTimeEnd';
const LOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour
export const BREAK_AT_COUNTS = [25, 50, 75, 100, 125] as const;

function getStorageKey(userName?: string): string {
  if (userName?.trim()) {
    return `${STORAGE_KEY_PREFIX}_${encodeURIComponent(userName.trim())}`;
  }
  return 'dmBreakTimeEnd'; // 後方互換
}

export function shouldStartBreak(currentCount: number): boolean {
  return BREAK_AT_COUNTS.includes(currentCount as 25 | 50 | 75 | 100 | 125);
}

export function getBreakEndTime(userName?: string): number | null {
  if (typeof window === 'undefined') return null;
  const key = getStorageKey(userName);
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const end = parseInt(raw, 10);
  if (Number.isNaN(end)) return null;
  return end;
}

export function setBreakLock(userName?: string): void {
  if (typeof window === 'undefined') return;
  const end = Date.now() + LOCK_DURATION_MS;
  localStorage.setItem(getStorageKey(userName), String(end));
}

export function clearBreakLock(userName?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getStorageKey(userName));
}

export function isBreakActive(userName?: string): boolean {
  const end = getBreakEndTime(userName);
  if (end === null) return false;
  return Date.now() < end;
}

/**
 * Returns remaining milliseconds until break ends, or 0 if not active/expired
 */
export function getRemainingMs(userName?: string): number {
  const end = getBreakEndTime(userName);
  if (end === null) return 0;
  const remaining = end - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Format remaining ms as HH:MM:SS
 */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}
