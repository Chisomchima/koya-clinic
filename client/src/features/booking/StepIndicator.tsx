import { motion } from 'motion/react';
import { cn } from '../../lib/cn';
import { CheckIcon } from '../../components/ui/Icons';

const STEPS = ['Doctor', 'Date & time', 'Your details'];

/** `current` is 0-based. */
export function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-3" aria-label="Booking progress">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={label}
            className="flex items-center gap-2 sm:gap-3"
            aria-current={active ? 'step' : undefined}
          >
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ scale: active ? 1.08 : 1 }}
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300',
                  done && 'bg-primary-500 text-white',
                  active && 'bg-primary-500 text-white ring-4 ring-primary-100',
                  !done && !active && 'bg-white text-ink-soft ring-1 ring-line',
                )}
              >
                {done ? <CheckIcon className="size-4" strokeWidth={3} /> : i + 1}
              </motion.span>
              <span
                className={cn(
                  'hidden text-sm font-semibold sm:inline',
                  active || done ? 'text-ink' : 'text-ink-soft',
                )}
              >
                {label}
              </span>
            </span>
            {i < STEPS.length - 1 && (
              <span className="relative h-0.5 w-8 overflow-hidden rounded-full bg-line sm:w-14">
                <motion.span
                  className="absolute inset-y-0 left-0 bg-primary-500"
                  initial={false}
                  animate={{ width: done ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
