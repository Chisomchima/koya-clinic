import confetti from 'canvas-confetti';

// Its own canvas and no web worker, so it works under the server's Content-Security-Policy.
let cannon: confetti.CreateTypes | undefined;

const COLORS = ['#006BFF', '#8FBAFF', '#0B3558', '#FFB020', '#17E885', '#E55CFF'];

/** Clears any confetti still falling, e.g. when navigating away. */
export const stopCelebrating = () => cannon?.reset();

export function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  cannon ??= confetti.create(undefined, { resize: true, useWorker: false });
  const burst = (x: number, angle: number) =>
    cannon!({
      particleCount: 70,
      spread: 70,
      startVelocity: 55,
      angle,
      origin: { x, y: 0.7 },
      colors: COLORS,
      zIndex: 100,
    });
  burst(0.2, 60);
  burst(0.8, 120);
  setTimeout(
    () =>
      cannon!({ particleCount: 90, spread: 120, origin: { y: 0.45 }, colors: COLORS, zIndex: 100 }),
    250,
  );
}
