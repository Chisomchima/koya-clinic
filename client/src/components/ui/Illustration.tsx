import { motion } from 'motion/react';
import { illustrations, type IllustrationName } from '../../assets/illustrations';
import { cn } from '../../lib/cn';

export function Illustration({ name, className }: { name: IllustrationName; className?: string }) {
  return (
    <motion.img
      src={illustrations[name]}
      alt=""
      aria-hidden="true"
      draggable={false}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      className={cn('pointer-events-none select-none', className)}
    />
  );
}
