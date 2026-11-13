import { randomUUID } from 'node:crypto';
import { badRequest, conflict, notFound } from '../../lib/http-error.js';
import { isDuplicateKeyError } from '../../lib/mongo-errors.js';
import { Booking, type BookingDoc, type BookingStatus } from '../../models/booking.model.js';
import { Slot } from '../../models/slot.model.js';
import type { CreateBookingInput } from './bookings.schema.js';

export interface BookingDto {
  id: string;
  slot_id: string;
  name: string;
  email: string;
  status: BookingStatus;
  created_at: string;
}

type StoredBooking = BookingDoc & { _id: string };

const toBookingDto = (b: StoredBooking): BookingDto => ({
  id: b._id,
  slot_id: b.slotId,
  name: b.name,
  email: b.email,
  status: b.status,
  created_at: b.createdAt.toISOString(),
});

export async function createBooking(input: CreateBookingInput): Promise<BookingDto> {
  const slot = await Slot.findById(input.slot_id).lean();
  if (!slot) throw notFound('slot not found');
  if (slot.startAt.getTime() <= Date.now()) throw badRequest('slot has already started');

  try {
    // The partial unique index on slotId decides any race: only one confirmed insert succeeds.
    const booking = await Booking.create({
      _id: `bk_${randomUUID()}`,
      slotId: input.slot_id,
      name: input.name,
      email: input.email,
      status: 'confirmed',
      createdAt: new Date(),
    });
    return toBookingDto(booking.toObject());
  } catch (err) {
    if (isDuplicateKeyError(err, 'slotId')) throw conflict('slot is already booked');
    throw err;
  }
}

export async function getBooking(id: string): Promise<BookingDto> {
  const booking = await Booking.findById(id).lean();
  if (!booking) throw notFound('booking not found');
  return toBookingDto(booking);
}

/** Cancels a confirmed booking. The status check and the update are one atomic operation. */
export async function cancelBooking(id: string): Promise<BookingDto> {
  const cancelled = await Booking.findOneAndUpdate(
    { _id: id, status: 'confirmed' },
    { $set: { status: 'cancelled' } },
    { returnDocument: 'after' },
  ).lean();
  if (cancelled) return toBookingDto(cancelled);

  const exists = await Booking.exists({ _id: id });
  throw exists ? conflict('booking is already cancelled') : notFound('booking not found');
}
