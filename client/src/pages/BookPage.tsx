import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { queryKeys } from '../api/queries';
import type { Booking, Slot } from '../api/types';
import { Button } from '../components/ui/Button';
import { Illustration } from '../components/ui/Illustration';
import { Skeleton } from '../components/ui/Skeleton';
import { BookingSummaryPanel } from '../features/booking/BookingSummaryPanel';
import { DateTimeStep } from '../features/booking/DateTimeStep';
import { DetailsModal } from '../features/booking/DetailsModal';
import { ANY_PROVIDER, ProviderStep } from '../features/booking/ProviderStep';
import { StepIndicator } from '../features/booking/StepIndicator';
import { SuccessModal, type BookingResult } from '../features/booking/SuccessModal';
import { useAvailability } from '../features/providers/useAvailability';
import { celebrate, stopCelebrating } from '../lib/celebrate';
import { dayKey, durationMinutes } from '../lib/format';
import { recentBookings } from '../lib/storage';

/**
 * The booking flow: doctor → date & time → details (modal) → confirmation (modal).
 * The chosen doctor and day live in the URL, so the browser's back button steps back.
 */
export function BookPage() {
  const availability = useAvailability();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [confirmingSlot, setConfirmingSlot] = useState<Slot | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  useEffect(() => stopCelebrating, []);

  const requested = params.get('provider');
  const knownProvider =
    requested === ANY_PROVIDER || availability.providers.some((p) => p.name === requested);
  const provider = requested && knownProvider ? requested : null;

  const providerSlots =
    provider === ANY_PROVIDER
      ? availability.openSlots
      : availability.openSlots.filter((s) => s.provider === provider);

  // Default to the first day with an open time, so times show straight away.
  const requestedDay = params.get('date');
  const selectedDay =
    requestedDay && providerSlots.some((s) => dayKey(s.start) === requestedDay)
      ? requestedDay
      : providerSlots[0]
        ? dayKey(providerSlots[0].start)
        : null;

  // Re-derived from live data: if someone else books it, the selection quietly disappears.
  const selectedSlot = providerSlots.find((s) => s.id === selectedSlotId) ?? null;
  const step = confirmingSlot ? 2 : provider ? 1 : 0;

  function chooseProvider(name: string) {
    setSelectedSlotId(null);
    setParams({ provider: name });
  }

  function chooseDay(day: string) {
    setSelectedSlotId(null);
    setParams({ provider: provider ?? ANY_PROVIDER, date: day }, { replace: true });
  }

  function goBack() {
    if (provider) {
      setSelectedSlotId(null);
      setParams({});
    } else {
      void navigate('/');
    }
  }

  function onBooked(booking: Booking, slot: Slot) {
    setConfirmingSlot(null);
    setSelectedSlotId(null);
    setResult({ booking, slot });
    recentBookings.add({
      id: booking.id,
      provider: slot.provider,
      start: slot.start,
      end: slot.end,
    });
    celebrate();
  }

  function onSlotTaken() {
    setConfirmingSlot(null);
    setSelectedSlotId(null);
    void queryClient.invalidateQueries({ queryKey: queryKeys.slots });
  }

  const referenceSlot = selectedSlot ?? providerSlots[0] ?? availability.openSlots[0];
  const duration = referenceSlot ? durationMinutes(referenceSlot.start, referenceSlot.end) : 30;

  return (
    <div className="relative mx-auto max-w-5xl px-4 pt-4 pb-16 sm:px-6">
      <div className="pointer-events-none absolute -top-20 left-1/2 -z-10 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-primary-100/60 blur-3xl" />

      <StepIndicator current={step} />

      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="mt-8 grid overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line/60 md:grid-cols-[18rem_1fr]"
      >
        <aside className="border-b border-line/70 p-6 md:border-r md:border-b-0 md:p-8">
          <BookingSummaryPanel
            provider={provider}
            slot={confirmingSlot ?? selectedSlot}
            durationMinutes={duration}
            onBack={goBack}
          />
        </aside>

        <section className="min-h-[28rem] p-6 md:p-8">
          {availability.isPending ? (
            <LoadingState />
          ) : availability.isError ? (
            <ErrorState onRetry={() => void availability.refetch()} />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={provider ?? 'providers'}
                initial={{ opacity: 0, x: provider ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: provider ? -30 : 30 }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              >
                {provider ? (
                  <DateTimeStep
                    slots={providerSlots}
                    showProvider={provider === ANY_PROVIDER}
                    selectedDay={selectedDay}
                    selectedSlotId={selectedSlot?.id ?? null}
                    onSelectDay={chooseDay}
                    onSelectSlot={(slot) => setSelectedSlotId(slot.id)}
                    onConfirmSlot={setConfirmingSlot}
                    onChangeProvider={goBack}
                  />
                ) : (
                  <ProviderStep
                    providers={availability.providers}
                    firstOpenSlot={availability.openSlots[0]}
                    onSelect={chooseProvider}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </section>
      </motion.div>

      <DetailsModal
        slot={confirmingSlot}
        onClose={() => setConfirmingSlot(null)}
        onBooked={onBooked}
        onSlotTaken={onSlotTaken}
      />
      <SuccessModal
        result={result}
        onClose={() => {
          setResult(null);
          setParams({});
        }}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading available times">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-5 w-80" />
      <div className="grid gap-3 pt-2 sm:grid-cols-2">
        <Skeleton className="h-20 sm:col-span-2" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <Illustration name="noSignal" className="h-40" />
      <h2 className="mt-6 text-xl font-bold">We couldn't load available times</h2>
      <p className="mt-1 text-ink-muted">Check your connection and give it another go.</p>
      <Button className="mt-6" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
