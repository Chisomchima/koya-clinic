import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import type { Booking, Slot } from '../../api/types';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { CalendarIcon, CheckIcon } from '../../components/ui/Icons';
import { Illustration } from '../../components/ui/Illustration';
import { Modal } from '../../components/ui/Modal';
import { downloadCalendarFile } from '../../lib/calendar-file';
import { formatLongDay, formatTimeRange } from '../../lib/format';

export interface BookingResult {
  booking: Booking;
  slot: Slot;
}

export function SuccessModal({
  result,
  onClose,
}: {
  result: BookingResult | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const firstName = result?.booking.name.split(/\s+/)[0];

  return (
    <Modal
      open={result !== null}
      onClose={onClose}
      title={<span className="block text-center">You're booked in, {firstName}!</span>}
      description={
        <span className="block text-center">
          Keep your booking reference to view or cancel later.
        </span>
      }
      hero={
        <div className="relative flex justify-center">
          <Illustration name="success" className="h-36" />
          <motion.span
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.25 }}
            className="absolute -bottom-2 left-1/2 flex size-12 -translate-x-1/2 items-center justify-center rounded-full bg-success text-white shadow-lg ring-4 ring-white"
          >
            <CheckIcon className="size-7" strokeWidth={3} />
          </motion.span>
        </div>
      }
    >
      {result && (
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl border border-line p-4"
          >
            <div className="flex items-center gap-3">
              <Avatar name={result.slot.provider} className="size-11 text-base" />
              <div className="text-sm">
                <p className="font-bold">{result.slot.provider}</p>
                <p className="text-ink-muted">
                  {formatLongDay(result.slot.start)},{' '}
                  {formatTimeRange(result.slot.start, result.slot.end)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-canvas px-3 py-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">
                  Booking reference
                </p>
                <p className="truncate font-mono text-sm">{result.booking.id}</p>
              </div>
              <CopyButton text={result.booking.id} />
            </div>
          </motion.div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() =>
                downloadCalendarFile({
                  id: result.booking.id,
                  provider: result.slot.provider,
                  start: result.slot.start,
                  end: result.slot.end,
                })
              }
            >
              <CalendarIcon className="size-4" />
              Add to calendar
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                onClose();
                void navigate(`/booking/${result.booking.id}`);
              }}
            >
              View booking
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
