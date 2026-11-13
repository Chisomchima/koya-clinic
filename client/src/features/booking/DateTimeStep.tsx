import { AnimatePresence, motion } from 'motion/react';
import { useMemo } from 'react';
import type { Slot } from '../../api/types';
import { Button } from '../../components/ui/Button';
import { GlobeIcon } from '../../components/ui/Icons';
import { Illustration } from '../../components/ui/Illustration';
import { dayKey, formatLongDay, localTimeZone } from '../../lib/format';
import { MonthCalendar } from './MonthCalendar';
import { TimeList } from './TimeList';

interface DateTimeStepProps {
  slots: Slot[];
  showProvider: boolean;
  selectedDay: string | null;
  selectedSlotId: string | null;
  onSelectDay: (day: string) => void;
  onSelectSlot: (slot: Slot) => void;
  onConfirmSlot: (slot: Slot) => void;
  onChangeProvider: () => void;
}

export function DateTimeStep({
  slots,
  showProvider,
  selectedDay,
  selectedSlotId,
  onSelectDay,
  onSelectSlot,
  onConfirmSlot,
  onChangeProvider,
}: DateTimeStepProps) {
  const availableDays = useMemo(() => new Set(slots.map((s) => dayKey(s.start))), [slots]);
  const daySlots = useMemo(
    () => (selectedDay ? slots.filter((s) => dayKey(s.start) === selectedDay) : []),
    [slots, selectedDay],
  );

  const first = slots[0];
  const last = slots.at(-1);
  if (!first || !last) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <Illustration name="empty" className="h-40" />
        <h2 className="mt-6 text-xl font-bold">No open times left</h2>
        <p className="mt-1 max-w-sm text-ink-muted">
          This doctor is fully booked. Try another doctor instead.
        </p>
        <Button className="mt-6" onClick={onChangeProvider}>
          Choose another doctor
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold">Select a date & time</h2>

      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <MonthCalendar
            availableDays={availableDays}
            selectedDay={selectedDay}
            onSelectDay={onSelectDay}
            minMonth={new Date(first.start)}
            maxMonth={new Date(last.start)}
          />
          <p className="mt-6 flex items-center gap-2 text-sm text-ink-muted">
            <GlobeIcon className="size-4" />
            Times are shown in your time zone ({localTimeZone().replace(/_/g, ' ')})
          </p>
        </div>

        <AnimatePresence mode="wait">
          {selectedDay && (
            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="md:w-56"
            >
              <p className="mb-4 font-medium">{formatLongDay(`${selectedDay}T12:00:00`)}</p>
              {daySlots.length > 0 ? (
                <div className="max-h-[22rem] overflow-y-auto pr-1">
                  <TimeList
                    slots={daySlots}
                    selectedId={selectedSlotId}
                    showProvider={showProvider}
                    onSelect={onSelectSlot}
                    onConfirm={onConfirmSlot}
                  />
                </div>
              ) : (
                <p className="text-sm text-ink-muted">
                  All times on this day have just been taken. Pick another day.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
