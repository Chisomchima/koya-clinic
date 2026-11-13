import { randomUUID } from 'node:crypto';
import type { QueryFilter } from 'mongoose';
import { decodeCursor, encodeCursor } from '../../lib/cursor.js';
import { badRequest, conflict, notFound, unprocessable } from '../../lib/http-error.js';
import { isDuplicateKeyError } from '../../lib/mongo-errors.js';
import { Booking, type BookingDoc, type BookingStatus } from '../../models/booking.model.js';
import { Slot } from '../../models/slot.model.js';
import type { CreateBookingInput, ListBookingsInput } from './bookings.schema.js';

export interface BookingDto {
  id: string;
  slot_id: string;
  name: string;
  email: string;
  status: BookingStatus;
  created_at: string;
}

type StoredBooking = BookingDoc & { _id: string };

/** A scoped Idempotency-Key and the hash of the request body it arrived with. */
export interface IdempotencyContext {
  key: string;
  requestHash: string;
}

export interface CreateBookingResult {
  booking: BookingDto;
  /** True when this is a retry answered with the booking an earlier request created. */
  replayed: boolean;
}

const toBookingDto = (b: StoredBooking): BookingDto => ({
  id: b._id,
  slot_id: b.slotId,
  name: b.name,
  email: b.email,
  status: b.status,
  created_at: b.createdAt.toISOString(),
});

/**
 * Level 4: if this key already created a booking, returns that booking (a replay).
 * Throws 422 if the key was used with a different request body.
 */
export async function findIdempotentBooking({
  key,
  requestHash,
}: IdempotencyContext): Promise<BookingDto | null> {
  const booking = await Booking.findOne({ idempotencyKey: key }).lean();
  if (!booking) return null;
  if (booking.requestHash !== requestHash) {
    throw unprocessable('Idempotency-Key was already used with a different request body');
  }
  return toBookingDto(booking);
}

export async function createBooking(
  input: CreateBookingInput,
  idempotency?: IdempotencyContext,
): Promise<CreateBookingResult> {
  const slot = await Slot.findById(input.slot_id).lean();
  if (!slot) throw notFound('slot not found');
  if (slot.startAt.getTime() <= Date.now()) throw badRequest('slot has already started');

  try {
    // One document, one atomic write: the booking and its idempotency key are saved together.
    // Unique indexes decide every race: one confirmed booking per slot, one booking per key.
    const booking = await Booking.create({
      _id: `bk_${randomUUID()}`,
      slotId: input.slot_id,
      name: input.name,
      email: input.email,
      status: 'confirmed',
      createdAt: new Date(),
      ...(idempotency && {
        idempotencyKey: idempotency.key,
        requestHash: idempotency.requestHash,
      }),
    });
    return { booking: toBookingDto(booking.toObject()), replayed: false };
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;

    // Two retries with the same key raced and the other one won. The loser may be rejected
    // by *either* unique index (both target the same slot), so check the key first:
    // otherwise a retry could be told "slot is already booked" about its own booking.
    if (idempotency) {
      const winner = await findIdempotentBooking(idempotency);
      if (winner) return { booking: winner, replayed: true };
    }
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

/**
 * One person's bookings, oldest first, using keyset (cursor) pagination on (createdAt, id).
 * Unlike offset paging, pages don't shift or repeat when new bookings are added.
 */
export async function listBookings({ email, limit, cursor }: ListBookingsInput) {
  const filter: QueryFilter<StoredBooking> = { email };
  if (cursor !== undefined) {
    const after = decodeCursor(cursor);
    filter.$or = [
      { createdAt: { $gt: after.createdAt } },
      { createdAt: after.createdAt, _id: { $gt: after.id } },
    ];
  }

  // Fetch one extra row to learn whether there is another page.
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
