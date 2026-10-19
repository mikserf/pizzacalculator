import { useEffect, useRef, useState } from 'react';

const DURATION = 550; // ms
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Value that glides to `target` (ease-out), starting from wherever it currently is. */
function useAnimatedNumber(target: number): number {
  const [shown, setShown] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    const from = current.current;
    if (!Number.isFinite(target) || !Number.isFinite(from) || from === target || prefersReducedMotion()) {
      current.current = target;
      setShown(target);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const v = from + (target - from) * easeOutCubic(t);
      current.current = v;
      setShown(v);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return shown;
}

interface AnimatedNumberProps {
  value: number;
  format: (v: number) => string;
}

/**
 * A number that counts up or down to its new value. Screen readers get the
 * final value only (the counting frames are hidden from them).
 */
const AnimatedNumber = ({ value, format }: AnimatedNumberProps) => {
  const shown = useAnimatedNumber(value);
  return (
    <>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
};

export default AnimatedNumber;
