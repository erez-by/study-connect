// Browser notification + subtle audio alert helpers for new chat messages.
// Audio uses the Web Audio API (no asset file) and is created lazily so we
// respect browser autoplay policies — it must be primed by a user gesture.

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    return audioCtx;
  } catch {
    return null;
  }
}

/** Call from a user gesture to unlock audio playback. */
export function primeAudio() {
  const ctx = getCtx();
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}

/** Play a short, gentle two-note "ping". Silently no-ops if audio is blocked. */
export function playPing() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  try {
    const now = ctx.currentTime;
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  } catch {
    // ignore
  }
}

/** Ask for notification permission gracefully (no throw). */
export async function ensureNotifyPermission(): Promise<boolean> {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "default") await Notification.requestPermission();
    return Notification.permission === "granted";
  } catch {
    return false;
  }
}

/** Show a system notification if permitted; otherwise silently no-op. */
export function showNotification(title: string, body: string) {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    new Notification(title, { body, tag: "study-buddy-message" });
  } catch {
    // ignore
  }
}
