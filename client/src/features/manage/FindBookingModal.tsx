import { motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Illustration } from '../../components/ui/Illustration';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import { formatDateTime } from '../../lib/format';
import { recentBookings } from '../../lib/storage';

export function FindBookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Find your booking"
      description="Enter the booking reference from your confirmation."
      hero={
        <div className="flex justify-center">
          <Illustration name="search" className="h-28" />
        </div>
      }
    >
      <FindBookingForm onDone={onClose} />
    </Modal>
  );
}

function FindBookingForm({ onDone }: { onDone: () => void }) {
  const [reference, setReference] = useState('');
  const [recent] = useState(recentBookings.list);
  const navigate = useNavigate();

  const open = (id: string) => {
    onDone();
    void navigate(`/booking/${encodeURIComponent(id)}`);
  };

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // References look like KC-7KQ2M-9XH4P; accept them typed in any case.
    const id = reference.trim();
    if (id) open(/^kc-/i.test(id) ? id.toUpperCase() : id);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <TextField
          label="Booking reference"
          placeholder="KC-XXXXX-XXXXX"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
        />
        <Button type="submit" className="w-full" disabled={!reference.trim()}>
          Find booking
        </Button>
      </form>

      {recent.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold tracking-wider text-ink-soft uppercase">
            Booked on this device
          </p>
          <ul className="space-y-2">
            {recent.map((b, i) => (
              <motion.li
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <button
                  type="button"
                  onClick={() => open(b.id)}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-line p-3 text-left transition hover:border-primary-500 hover:bg-primary-50"
                >
                  <Avatar name={b.provider} className="size-10 text-sm ring-2" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{b.provider}</span>
                    <span className="block truncate text-sm text-ink-muted">
                      {formatDateTime(b.start)}
                    </span>
                  </span>
                  <span
                    className="text-primary-500 transition group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
