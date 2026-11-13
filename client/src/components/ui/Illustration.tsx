import { motion } from 'motion/react';
import { illustrations, type IllustrationName } from '../../assets/illustrations';
import { cn } from '../../lib/cn';

/** An unDraw illustration (recoloured to the brand blue), gently fading in. */
export function Illustration({
  name,
  className,
  float = false,
}: {
  name: IllustrationName;
  className?: string;
  float?: boolean;
}) {
  return (
    <motion.img
      src={illustrations[name]}
      alt=""
      aria-hidden="true"
      draggable={false}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      className={cn('pointer-events-none select-none', float && 'animate-float', className)}
    />
  );
}
