const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * Returns current date in JST as "YYYY-MM-DD"
 */
export function todayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(jst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns current month in JST as "YYYY-MM"
 */
export function monthJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Returns current time in JST as ISO string (for sentAt)
 */
export function nowISOJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  return jst.toISOString().replace('Z', '+09:00');
}
