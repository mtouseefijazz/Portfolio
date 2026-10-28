// Notification sound utility using Web Audio API.
// Generates a short, pleasant chime without needing an audio file.
//
// Browsers block AudioContext until the user interacts with the page.
// We "unlock" audio on the first click/tap/keypress, then realtime
// callbacks can play sounds freely.

let audioCtx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

// Call this on any user interaction (click, keypress, touch) to unlock audio.
// Also called automatically on the first pointerdown/keydown listener below.
export function unlockAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      unlocked = true;
    }).catch(() => {});
  } else {
    unlocked = true;
  }
}

// Auto-attach unlock listeners on first import (client-side only)
if (typeof window !== 'undefined') {
  const opts: AddEventListenerOptions = { once: true, passive: true };
  window.addEventListener('pointerdown', unlockAudio, opts);
  window.addEventListener('keydown', unlockAudio, opts);
  window.addEventListener('touchstart', unlockAudio, opts);
}

type SoundType = 'visitor' | 'admin';

export function playNotificationSound(type: SoundType = 'visitor') {
  const ctx = getCtx();
  if (!ctx) return;

  // If not unlocked yet, try to resume (might fail silently)
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  // Two-tone chime — higher pitch for admin replies, lower for visitor messages
  const baseFreq = type === 'admin' ? 660 : 523.25; // E5 for admin, C5 for visitor
  const secondFreq = type === 'admin' ? 880 : 659.25; // A5 for admin, E5 for visitor

  const tones = [
    { freq: baseFreq, start: 0, duration: 0.15 },
    { freq: secondFreq, start: 0.12, duration: 0.2 },
  ];

  tones.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + start);

    // Envelope: quick attack, gentle decay
    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.25, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + start);
    osc.stop(now + start + duration + 0.05);
  });
}

// Request browser notification permission (call on user interaction)
export function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

// Show a browser notification
export function showBrowserNotification(title: string, body: string) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/favicon.svg',
      silent: true, // we play our own sound
    });
  } catch {
    // ignore
  }
}
