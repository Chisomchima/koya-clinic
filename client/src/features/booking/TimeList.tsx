import { AnimatePresence, motion } from 'motion/react';
import type { Slot } from '../../api/types';
import { formatTime } from '../../lib/format';

interface TimeListProps {
  slots: Slot[];
  selectedId: string | null;
  showProvider: boolean;
  onSelect: (slot: Slot) => void;
  onConfirm: (slot: Slot) => void;
}

/** Picking a time splits it into the time and a "Next" button. Taken slots animate out. */
export function TimeList({ slots, selectedId, showProvider, onSelect, onConfirm }: TimeListProps) {
  return (
    <ul className="space-y-2">
      <AnimatePresence initial={true}>
        {slots.map((slot, i) => {
          const selected = slot.id === selectedId;
          return (
            <motion.li
              key={slot.id}
              layout
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0, transition: { delay: i * 0.03 } }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="flex gap-2"
            >
              <motion.button
                layout
                type="button"
                onClick={() => onSelect(slot)}
                aria-pressed={selected}
                className={
                  selected
                    ? 'h-13 flex-1 rounded-xl bg-ink-muted font-bold text-white'
                    : 'h-13 w-full rounded-xl border border-primary-300 font-bold text-primary-500 transition-[border-width,border-color] hover:border-2 hover:border-primary-500'
                }
              >
                <span className="block leading-tight">{formatTime(slot.start)}</span>
                {showProvider && (
                  <span
                    className={
                      selected
                        ? 'block text-xs font-medium text-white/80'
                        : 'block text-xs font-medium text-ink-muted'
                    }
                  >
                    {slot.provider}
                  </span>
                )}
              </motion.button>
              <AnimatePresence>
                {selected && (
                  <motion.button
                    type="button"
                    layout
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: '50%' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                    onClick={() => onConfirm(slot)}
                    className="h-13 overflow-hidden rounded-xl bg-primary-500 font-bold whitespace-nowrap text-white hover:bg-primary-700"
                  >
                    Next
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
