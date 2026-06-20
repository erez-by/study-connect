// PIN unlock state, persisted in localStorage with a 24-hour expiration so
// users don't have to re-enter their PIN every time they open a new tab.
const KEY = "sb_unlocked";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function setUnlocked() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ at: Date.now() }));
  } catch {
    // ignore (private mode / unavailable storage)
  }
}

export function isUnlocked(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { at?: number };
    if (typeof parsed.at !== "number" || Date.now() - parsed.at > TTL_MS) {
      localStorage.removeItem(KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function clearUnlocked() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
