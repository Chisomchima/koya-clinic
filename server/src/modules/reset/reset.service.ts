import { Booking } from '../../models/booking.model.js';
import { Slot } from '../../models/slot.model.js';
import type { ResetInput } from './reset.schema.js';

/** Deletes every booking and replaces all slots. */
export async function resetAll({ slots }: ResetInput) {
  await Promise.all([Booking.deleteMany({}), Slot.deleteMany({})]);
  if (slots.length > 0) {
    await Slot.insertMany(
      slots.map((s) => ({
        _id: s.id,
        provider: s.provider,
        start: s.start,
        end: s.end,
        startAt: new Date(s.start),
        endAt: new Date(s.end),
      })),
    );
  }
  return { ok: true, slots: slots.length };
}
