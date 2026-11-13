import { randomUUID } from 'node:crypto';
import { notFound } from '../../lib/http-error.js';
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

  const booking = await Booking.create({
    _id: `bk_${randomUUID()}`,
    slotId: input.slot_id,
    name: input.name,
    email: input.email,
    status: 'confirmed',
    createdAt: new Date(),
  });
  return toBookingDto(booking.toObject());
}

export async function getBooking(id: string): Promise<BookingDto> {
  const booking = await Booking.findById(id).lean();
  if (!booking) throw notFound('booking not found');
  return toBookingDto(booking);
}
