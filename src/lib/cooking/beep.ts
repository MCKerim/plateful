let context: AudioContext | null = null;

/** Three short tones for a timer that ran out while the screen is open; silent where audio is unavailable. */
export function beep(): void {
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    const start = context.currentTime;
    for (let i = 0; i < 3; i += 1) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, start + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.4, start + i * 0.25 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + i * 0.25 + 0.18);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start + i * 0.25);
      oscillator.stop(start + i * 0.25 + 0.2);
    }
  } catch {
    // No audio output here (a test runner, a locked-down WebView): the banner still shows.
  }
}
