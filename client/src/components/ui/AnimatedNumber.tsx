import { animate, useInView, useMotionValue, useTransform, motion } from 'motion/react';
import { useEffect, useRef } from 'react';

/** Counts up to `value` when it scrolls into view. */
export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, { duration: 1.2, ease: 'easeOut' });
    return () => controls.stop();
  }, [inView, value, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}
