/**
 * Validates that the account link contains instagram.com and is a valid URL
 */
export function isValidAccountLink(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!trimmed.includes('instagram.com')) return false;
  try {
    new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize account link for storage (ensure https)
 */
export function normalizeAccountLink(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}
