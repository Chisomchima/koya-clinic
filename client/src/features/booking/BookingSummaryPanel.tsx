import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import type { Slot } from '../../api/types';
import { Avatar } from '../../components/ui/Avatar';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  GlobeIcon,
  SparklesIcon,
} from '../../components/ui/Icons';
import { formatLongDay, formatTimeRange, localTimeZone } from '../../lib/format';
import { ANY_PROVIDER } from './ProviderStep';

interface BookingSummaryPanelProps {
  provider: string | null;
  slot: Slot | null;
  durationMinutes: number;
  onBack: () => void;
}

/** The left-hand panel: what is being booked so far, filling in as choices are made. */
export function BookingSummaryPanel({
  provider,
  slot,
  durationMinutes,
  onBack,
}: BookingSummaryPanelProps) {
  const providerName = slot?.provider ?? (provider === ANY_PROVIDER ? null : provider);

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={onBack}
        aria-label="Back"
        whileHover={{ x: -2 }}
        className="mb-6 flex size-11 items-center justify-center rounded-full border border-line text-primary-500 transition hover:bg-primary-50"
      >
        <ArrowLeftIcon className="size-5" />
      </motion.button>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={providerName ?? 'clinic'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="flex items-center gap-3"
        >
          {providerName ? (
            <Avatar name={providerName} className="size-12 text-lg" />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-full bg-primary-500 text-white ring-4 ring-primary-100">
              <SparklesIcon className="size-6" />
            </span>
          )}
          <div>
            <p className="text-sm font-semibold text-ink-muted">Koya Clinic</p>
            <p className="font-bold">
              {providerName ??
                (provider === ANY_PROVIDER ? 'First available doctor' : 'Any doctor')}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Clinic appointment</h1>

      <ul className="mt-4 space-y-3 font-semibold text-ink-muted">
        <Row icon={<ClockIcon className="size-5" />}>{durationMinutes} min</Row>
        <AnimatePresence>
          {slot && (
            <motion.li
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3 overflow-hidden text-success"
            >
              <CalendarIcon className="mt-0.5 size-5 shrink-0" />
              <span>
                {formatTimeRange(slot.start, slot.end)}, {formatLongDay(slot.start)}
              </span>
            </motion.li>
          )}
        </AnimatePresence>
        <Row icon={<GlobeIcon className="size-5" />}>{localTimeZone().replace(/_/g, ' ')}</Row>
      </ul>
    </div>
  );
}

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </li>
  );
}
