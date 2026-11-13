import { AnimatePresence, motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/ui/Icons';
import { cn } from '../../lib/cn';
import {
  addMonths,
  dayKey,
  formatLongDay,
  formatMonthYear,
  monthGrid,
  startOfMonth,
  weekdayLabels,
} from '../../lib/format';

interface MonthCalendarProps {
  /** Day keys (YYYY-MM-DD) that have at least one open slot. */
  availableDays: Set<string>;
  selectedDay: string | null;
  onSelectDay: (key: string) => void;
  /** First and last months that can be shown. */
  minMonth: Date;
  maxMonth: Date;
}

const WEEKDAYS = weekdayLabels();

export function MonthCalendar({
  availableDays,
  selectedDay,
  onSelectDay,
  minMonth,
  maxMonth,
}: MonthCalendarProps) {
  const initial = selectedDay ? startOfMonth(new Date(selectedDay)) : startOfMonth(minMonth);
  const [[month, direction], setMonth] = useState<[Date, number]>([initial, 0]);
  const todayKey = dayKey(new Date());

  const canGoBack = month > startOfMonth(minMonth);
  const canGoForward = month < startOfMonth(maxMonth);
  const shift = (n: number) => setMonth([addMonths(month, n), n]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <AnimatePresence mode="wait" initial={false}>
          <motion.h3
            key={month.toISOString()}
            initial={{ opacity: 0, y: direction * 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction * -8 }}
            className="font-semibold"
            aria-live="polite"
          >
            {formatMonthYear(month)}
          </motion.h3>
        </AnimatePresence>
        <div className="flex gap-1">
          <NavButton label="Previous month" disabled={!canGoBack} onClick={() => shift(-1)}>
            <ChevronLeftIcon className="size-5" />
          </NavButton>
          <NavButton label="Next month" disabled={!canGoForward} onClick={() => shift(1)}>
            <ChevronRightIcon className="size-5" />
          </NavButton>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-2">
            {d}
          </span>
        ))}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={month.toISOString()}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: d * 60, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d * -60, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 350, damping: 34 }}
            className="grid grid-cols-7 gap-y-1"
          >
            {monthGrid(month).map((date, i) => {
              if (!date) return <span key={`pad-${i}`} />;
              const key = dayKey(date);
              const available = availableDays.has(key);
              const selected = key === selectedDay;
              return (
                <div key={key} className="flex justify-center">
                  <motion.button
                    type="button"
                    disabled={!available}
                    onClick={() => onSelectDay(key)}
                    whileTap={available ? { scale: 0.9 } : undefined}
                    aria-pressed={selected}
                    aria-label={`${formatLongDay(date)}${available ? '' : ', no times available'}`}
                    className={cn(
                      'relative flex size-10 items-center justify-center rounded-full text-[15px] transition-colors sm:size-11',
                      selected &&
                        'bg-primary-500 font-bold text-white shadow-md shadow-primary-500/40',
                      !selected &&
                        available &&
                        'bg-primary-50 font-bold text-primary-500 hover:bg-primary-100',
                      !available && 'cursor-default text-ink-soft/60',
                    )}
                  >
                    {date.getDate()}
                    {key === todayKey && (
                      <span
                        className={cn(
                          'absolute bottom-1 size-1 rounded-full',
                          selected ? 'bg-white' : 'bg-primary-500',
                        )}
                      />
                    )}
                  </motion.button>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function NavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-full bg-primary-50 text-primary-500 transition hover:bg-primary-100 disabled:bg-transparent disabled:text-ink-soft/40"
    >
      {children}
    </button>
  );
}
