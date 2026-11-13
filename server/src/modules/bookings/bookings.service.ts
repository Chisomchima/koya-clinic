import type { QueryFilter } from 'mongoose';
import { newBookingReference } from '../../lib/booking-reference.js';
import { decodeCursor, encodeCursor } from '../../lib/cursor.js';
import { badRequest, conflict, notFound, unprocessable } from '../../lib/http-error.js';
import { isDuplicateKeyError } from '../../lib/mongo-errors.js';
import { Booking, type BookingDoc } from '../../models/booking.model.js';
import { Slot } from '../../models/slot.model.js';
import type { CreateBookingInput, ListBookingsInput } from './bookings.schema.js';

type StoredBooking = BookingDoc & { _id: string };

/** A scoped Idempotency-Key and the hash of the request body it came with. */
export interface IdempotencyContext {
  key: string;
  requestHash: string;
}

const toBookingDto = (b: StoredBooking) => ({
  id: b._id,
  slot_id: b.slotId,
  name: b.name,
  email: b.email,
  status: b.status,
  created_at: b.createdAt.toISOString(),
});

/** The booking this key already created, if any. 422 if the key came with a different body. */
export async function findIdempotentBooking({ key, requestHash }: IdempotencyContext) {
  const booking = await Booking.findOne({ idempotencyKey: key }).lean();
  if (!booking) return null;
  if (booking.requestHash !== requestHash) {
    throw unprocessable('Idempotency-Key was already used with a different request body');
  }
  return toBookingDto(booking);
}

export async function createBooking(input: CreateBookingInput, idempotency?: IdempotencyContext) {
  const slot = await Slot.findById(input.slot_id).lean();
  if (!slot) throw notFound('slot not found');
  if (slot.startAt.getTime() <= Date.now()) throw badRequest('slot has already started');

  try {
    const booking = await Booking.create({
      _id: newBookingReference(),
      slotId: input.slot_id,
      name: input.name,
      email: input.email,
      status: 'confirmed',
      createdAt: new Date(),
      idempotencyKey: idempotency?.key,
      requestHash: idempotency?.requestHash,
    });
    return { booking: toBookingDto(booking.toObject()), replayed: false };
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
    // A concurrent retry with the same key may have won the race. Both target this slot, so
    // either unique index can reject us: check for the winner before reporting a taken slot.
    const winner = idempotency && (await findIdempotentBooking(idempotency));
    if (winner) return { booking: winner, replayed: true };
    throw conflict('slot is already booked');
  }
}

export async function getBooking(id: string) {
  const booking = await Booking.findById(id).lean();
  if (!booking) throw notFound('booking not found');
  return toBookingDto(booking);
}

/** The status check and the update are one atomic operation. */
export async function cancelBooking(id: string) {
  const cancelled = await Booking.findOneAndUpdate(
    { _id: id, status: 'confirmed' },
    { $set: { status: 'cancelled' } },
    { returnDocument: 'after' },
  ).lean();
  if (cancelled) return toBookingDto(cancelled);
  throw (await Booking.exists({ _id: id }))
    ? conflict('booking is already cancelled')
    : notFound('booking not found');
}

/** Keyset pagination on (createdAt, id): pages don't shift when new bookings arrive. */
export async function listBookings({ email, limit, cursor }: ListBookingsInput) {
  const filter: QueryFilter<StoredBooking> = { email };
  if (cursor !== undefined) {
    const after = decodeCursor(cursor);
    filter.$or = [
      { createdAt: { $gt: after.createdAt } },
      { createdAt: after.createdAt, _id: { $gt: after.id } },
    ];
  }

  // One extra row tells us whether there is another page.
  const rows = await Booking.find(filter)
    .sort({ createdAt: 1, _id: 1 })
    .limit(limit + 1)
    .lean();
  const page = rows.slice(0, limit);
  const last = page.at(-1);

  return {
    bookings: page.map(toBookingDto),
    next_cursor:
      rows.length > limit && last
        ? encodeCursor({ createdAt: last.createdAt, id: last._id })
        : null,
  };
}
