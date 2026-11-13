import { AnimatePresence, motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError } from '../api/http';
import { useBooking, useCancelBooking, useSlots } from '../api/queries';
import type { BookingStatus } from '../api/types';
import { useAppModals } from '../app/app-modals-context';
import { Alert } from '../components/ui/Alert';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { CopyButton } from '../components/ui/CopyButton';
import { CalendarIcon, ClockIcon, UserIcon } from '../components/ui/Icons';
import { Illustration } from '../components/ui/Illustration';
import { Skeleton } from '../components/ui/Skeleton';
import { CancelBookingModal } from '../features/manage/CancelBookingModal';
import { downloadCalendarFile } from '../lib/calendar-file';
import { cn } from '../lib/cn';
import { describeError } from '../lib/errors';
import { durationMinutes, formatDateTime, formatLongDay, formatTimeRange } from '../lib/format';

export function ManageBookingPage() {
  const { id = '' } = useParams();
  const bookingQuery = useBooking(id);
  const slotsQuery = useSlots();
  const cancel = useCancelBooking();
  const { openFindBooking } = useAppModals();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [justCancelled, setJustCancelled] = useState(false);

  if (bookingQuery.isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-10">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (bookingQuery.isError) {
    const missing = bookingQuery.error instanceof ApiError && bookingQuery.error.status === 404;
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
        <Illustration name={missing ? 'search' : 'noSignal'} className="h-44" />
        <h1 className="mt-8 text-2xl font-extrabold">
          {missing ? "We couldn't find that booking" : 'Something went wrong'}
        </h1>
        <p className="mt-2 text-ink-muted">
          {missing
            ? 'Double-check the reference from your confirmation and try again.'
            : describeError(bookingQuery.error)}
        </p>
        <div className="mt-8 flex gap-3">
          <Button onClick={openFindBooking}>Try another reference</Button>
          <Link
            to="/book"
            className="inline-flex h-11 items-center px-4 font-semibold text-primary-500 hover:underline"
          >
            Book instead
          </Link>
        </div>
      </div>
    );
  }

  const booking = bookingQuery.data;
  const slot = slotsQuery.data?.find((s) => s.id === booking.slot_id);
  const confirmed = booking.status === 'confirmed';
  const upcoming = slot ? new Date(slot.start).getTime() > slotsQuery.dataUpdatedAt : true;

  return (
    <div className="relative mx-auto max-w-2xl px-4 pt-6 pb-20 sm:px-6">
      <div className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary-100/60 blur-3xl" />

      <AnimatePresence>
        {justCancelled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6"
          >
            <Alert tone="info">
              Your appointment has been cancelled and the time has been released.
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="text-3xl font-extrabold tracking-tight">Your appointment</h1>

      <motion.article
        layout
        className="mt-6 overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line/60"
      >
        <div
          className={cn(
            'transition-[filter,opacity] duration-500',
            !confirmed && 'opacity-70 grayscale',
          )}
        >
          <div className="flex flex-wrap items-center gap-5 border-b border-line/70 p-6 sm:p-8">
            {slot && <DateTile iso={slot.start} />}
            <div className="min-w-0 flex-1">
              <StatusBadge status={booking.status} />
              <p className="mt-2 text-xl font-bold">
                {slot ? formatDateTime(slot.start) : 'Clinic appointment'}
              </p>
              {slot && <p className="text-ink-muted">{formatTimeRange(slot.start, slot.end)}</p>}
            </div>
          </div>

          <dl className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
            {slot && (
              <Detail
                icon={<Avatar name={slot.provider} className="size-9 text-sm ring-2" />}
                label="Doctor"
              >
                {slot.provider}
              </Detail>
            )}
            {slot && (
              <Detail
                icon={
                  <IconBubble>
                    <ClockIcon className="size-5" />
                  </IconBubble>
                }
                label="Duration"
              >
                {durationMinutes(slot.start, slot.end)} minutes
              </Detail>
            )}
            <Detail
              icon={
                <IconBubble>
                  <UserIcon className="size-5" />
                </IconBubble>
              }
              label="Patient"
            >
              {booking.name}
              <span className="block truncate text-sm font-normal text-ink-muted">
                {booking.email}
              </span>
            </Detail>
            <Detail
              icon={
                <IconBubble>
                  <CalendarIcon className="size-5" />
                </IconBubble>
              }
              label="Booked on"
            >
              {formatLongDay(booking.created_at)}
            </Detail>
          </dl>

          <div className="mx-6 mb-6 flex items-center justify-between gap-2 rounded-2xl bg-canvas px-4 py-3 sm:mx-8">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">
                Booking reference
              </p>
              <p className="truncate font-mono text-sm">{booking.id}</p>
            </div>
            <CopyButton text={booking.id} />
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-line/70 p-6 sm:flex-row sm:p-8">
          {confirmed && upcoming ? (
            <>
              {slot && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    downloadCalendarFile({
                      id: booking.id,
                      provider: slot.provider,
                      start: slot.start,
                      end: slot.end,
                    })
                  }
                >
                  <CalendarIcon className="size-4" />
                  Add to calendar
                </Button>
              )}
              <Button
                variant="ghost"
                className="text-danger hover:bg-danger/8 hover:text-danger sm:ml-auto"
                onClick={() => {
                  cancel.reset();
                  setCancelOpen(true);
                }}
              >
                Cancel appointment
              </Button>
            </>
          ) : (
            <Link
              to="/book"
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary-500 px-5 font-semibold text-white hover:bg-primary-700"
            >
              Book a new appointment
            </Link>
          )}
        </div>
      </motion.article>

      <CancelBookingModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        pending={cancel.isPending}
        error={cancel.isError ? describeError(cancel.error) : null}
        summary={
          slot
            ? `appointment with ${slot.provider} on ${formatDateTime(slot.start)}`
            : 'appointment'
        }
        onConfirm={() =>
          cancel.mutate(booking.id, {
            onSuccess: () => {
              setCancelOpen(false);
              setJustCancelled(true);
            },
          })
        }
      />
    </div>
  );
}

function DateTile({ iso }: { iso: string }) {
  const date = new Date(iso);
  return (
    <motion.div
      initial={{ rotateX: -90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.15 }}
      className="w-20 overflow-hidden rounded-2xl text-center shadow-card ring-1 ring-line/60"
    >
      <p className="bg-primary-500 py-1 text-xs font-bold tracking-wider text-white uppercase">
        {date.toLocaleDateString(undefined, { month: 'short' })}
      </p>
      <p className="bg-white py-2 text-3xl font-extrabold">{date.getDate()}</p>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={status}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold capitalize',
          status === 'confirmed' ? 'bg-success/10 text-success' : 'bg-ink-soft/15 text-ink-muted',
        )}
      >
        <span
          className={cn(
            'size-1.5 rounded-full',
            status === 'confirmed' ? 'bg-success' : 'bg-ink-soft',
          )}
        />
        {status}
      </motion.span>
    </AnimatePresence>
  );
}

function IconBubble({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-9 items-center justify-center rounded-full bg-primary-50 text-primary-500">
      {children}
    </span>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div className="min-w-0">
        <dt className="text-xs font-semibold text-ink-soft">{label}</dt>
        <dd className="font-semibold">{children}</dd>
      </div>
    </div>
  );
}
