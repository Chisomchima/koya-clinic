import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { ArrowRightIcon, SparklesIcon } from '../../components/ui/Icons';
import { Illustration } from '../../components/ui/Illustration';
import { cn } from '../../lib/cn';
import { formatTime, relativeDay } from '../../lib/format';
import type { ProviderSummary } from '../providers/useAvailability';
import type { Slot } from '../../api/types';

export const ANY_PROVIDER = 'any';

interface ProviderStepProps {
  providers: ProviderSummary[];
  firstOpenSlot: Slot | undefined;
  onSelect: (provider: string) => void;
}

const list = { show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export function ProviderStep({ providers, firstOpenSlot, onSelect }: ProviderStepProps) {
  if (!firstOpenSlot) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <Illustration name="empty" className="h-40" />
        <h2 className="mt-6 text-xl font-bold">No open appointments right now</h2>
        <p className="mt-1 max-w-sm text-ink-muted">
          Every slot is taken at the moment. New times open up regularly, so please check back soon.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold">Who would you like to see?</h2>
      <p className="mt-1 text-ink-muted">
        Choose a doctor, or take the first available appointment.
      </p>

      <motion.ul
        variants={list}
        initial="hidden"
        animate="show"
        className="mt-6 grid gap-3 sm:grid-cols-2"
      >
        <motion.li variants={item} className="sm:col-span-2">
          <ChoiceCard onClick={() => onSelect(ANY_PROVIDER)} highlight>
            <span className="flex size-12 items-center justify-center rounded-full bg-primary-500 text-white ring-4 ring-primary-100">
              <SparklesIcon className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">First available doctor</span>
              <span className="block text-sm text-ink-muted">
                Soonest: {relativeDay(firstOpenSlot.start)} at {formatTime(firstOpenSlot.start)}{' '}
                with {firstOpenSlot.provider}
              </span>
            </span>
          </ChoiceCard>
        </motion.li>

        {providers.map((p) => (
          <motion.li variants={item} key={p.name} className="h-full">
            <ChoiceCard onClick={() => onSelect(p.name)} disabled={!p.nextSlot}>
              <Avatar name={p.name} />
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{p.name}</span>
                <span className="block text-sm text-ink-muted">
                  {p.nextSlot
                    ? `Next: ${relativeDay(p.nextSlot.start)}, ${formatTime(p.nextSlot.start)}`
                    : 'Fully booked'}
                </span>
                {p.nextSlot && (
                  <span className="mt-1 inline-block rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-500">
                    {p.openSlots.length} open {p.openSlots.length === 1 ? 'time' : 'times'}
                  </span>
                )}
              </span>
            </ChoiceCard>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

function ChoiceCard({
  children,
  onClick,
  disabled,
  highlight,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -3 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={cn(
        'group flex h-full w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left transition-[border-color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50',
        highlight ? 'border-primary-200 bg-gradient-to-r from-primary-50 to-white' : 'border-line',
        !disabled && 'hover:border-primary-500 hover:shadow-card',
      )}
    >
      {children}
      {!disabled && (
        <ArrowRightIcon className="size-5 shrink-0 text-primary-500 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
      )}
    </motion.button>
  );
}
