import { useState, type FormEvent } from 'react';
import { useCreateBooking } from '../../api/queries';
import type { Booking, Slot } from '../../api/types';
import { Alert } from '../../components/ui/Alert';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import { describeError, isSlotTaken } from '../../lib/errors';
import { durationMinutes, formatLongDay, formatTimeRange } from '../../lib/format';

interface DetailsModalProps {
  slot: Slot | null;
  onClose: () => void;
  onBooked: (booking: Booking, slot: Slot) => void;
  onSlotTaken: () => void;
}

export function DetailsModal({ slot, onClose, onBooked, onSlotTaken }: DetailsModalProps) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open={slot !== null}
      onClose={onClose}
      dismissible={!busy}
      title="Enter your details"
      description="Almost there! We just need to know who's coming."
    >
      {slot && (
        <DetailsForm
          key={slot.id}
          slot={slot}
          onBusyChange={setBusy}
          onBooked={onBooked}
          onSlotTaken={onSlotTaken}
        />
      )}
    </Modal>
  );
}

function DetailsForm({
  slot,
  onBusyChange,
  onBooked,
  onSlotTaken,
}: {
  slot: Slot;
  onBusyChange: (busy: boolean) => void;
  onBooked: (booking: Booking, slot: Slot) => void;
  onSlotTaken: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // One key per attempt at this slot, so double-clicks and automatic retries can't book twice.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const createBooking = useCreateBooking();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    onBusyChange(true);
    createBooking.mutate(
      { input: { slot_id: slot.id, name, email }, idempotencyKey },
      {
        onSuccess: (booking) => onBooked(booking, slot),
        onSettled: () => onBusyChange(false),
      },
    );
  }

  const taken = createBooking.isError && isSlotTaken(createBooking.error);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl bg-primary-50 p-4">
        <Avatar name={slot.provider} className="size-11 text-base" />
        <div className="text-sm">
          <p className="font-bold text-ink">
            {slot.provider} · {durationMinutes(slot.start, slot.end)} min
          </p>
          <p className="text-ink-muted">
            {formatLongDay(slot.start)}, {formatTimeRange(slot.start, slot.end)}
          </p>
        </div>
      </div>

      <TextField
        label="Full name"
        required
        maxLength={200}
        autoComplete="name"
        placeholder="Ada Obi"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        label="Email"
        type="email"
        required
        autoComplete="email"
        placeholder="ada@example.com"
        hint="We use this to keep track of your bookings."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {createBooking.isError && <Alert>{describeError(createBooking.error)}</Alert>}

      {taken ? (
        <Button className="w-full" size="lg" onClick={onSlotTaken}>
          Choose another time
        </Button>
      ) : (
        <Button type="submit" className="w-full" size="lg" loading={createBooking.isPending}>
          {createBooking.isPending ? 'Booking…' : 'Schedule appointment'}
        </Button>
      )}
    </form>
  );
}
