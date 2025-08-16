export function isValidHttpUrl(input) {
  // Basic sanity check: must parse and be http/https
  try {
    const u = new URL(input);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeUrl(input) {
  // Normalize a bit so duplicates collapse (e.g., strip hash)
  const u = new URL(input);
  u.hash = '';
  return u.toString();
}
