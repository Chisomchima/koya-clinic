import { Booking } from '../../models/booking.model.js';
import { Slot, type SlotDoc } from '../../models/slot.model.js';

const toSlotDto = (slot: SlotDoc & { _id: string }, available: boolean) => ({
  id: slot._id,
  provider: slot.provider,
  start: slot.start,
  end: slot.end,
  available,
});

/** Every slot (optionally one provider's), earliest start first. */
export async function listSlots({ provider }: { provider?: string }) {
  const slots = await Slot.find(provider === undefined ? {} : { provider })
    .sort({ startAt: 1, _id: 1 })
    .lean();
  const booked = await Booking.distinct('slotId', {
    status: 'confirmed',
    slotId: { $in: slots.map((s) => s._id) },
  });
  const bookedIds = new Set<string>(booked);
  return { slots: slots.map((s) => toSlotDto(s, !bookedIds.has(s._id))) };
}
