const STORAGE_KEY = 'dmBreakTimeEnd';
const LOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour
export const BREAK_AT_COUNTS = [25, 50, 75, 100, 125] as const;

export function shouldStartBreak(currentCount: number): boolean {
  return BREAK_AT_COUNTS.includes(currentCount as 25 | 50 | 75 | 100 | 125);
}

export function getBreakEndTime(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const end = parseInt(raw, 10);
  if (Number.isNaN(end)) return null;
  return end;
}

export function setBreakLock(): void {
  if (typeof window === 'undefined') return;
  const end = Date.now() + LOCK_DURATION_MS;
  localStorage.setItem(STORAGE_KEY, String(end));
}

export function clearBreakLock(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function isBreakActive(): boolean {
  const end = getBreakEndTime();
  if (end === null) return false;
  return Date.now() < end;
}

/**
 * Returns remaining milliseconds until break ends, or 0 if not active/expired
 */
export function getRemainingMs(): number {
  const end = getBreakEndTime();
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
