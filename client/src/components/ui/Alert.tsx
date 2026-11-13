import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

const tones = {
  error: 'bg-danger/8 text-danger ring-danger/20',
  info: 'bg-primary-50 text-primary-700 ring-primary-200',
};

export function Alert({
  tone = 'error',
  children,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0, x: tone === 'error' ? [0, -6, 6, -3, 3, 0] : 0 }}
      transition={{ duration: 0.4 }}
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('rounded-xl px-4 py-3 text-sm font-medium ring-1', tones[tone])}
    >
      {children}
    </motion.div>
  );
}
