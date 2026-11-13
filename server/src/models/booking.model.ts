import { Schema, model, type InferSchemaType } from 'mongoose';

export const BOOKING_STATUSES = ['confirmed', 'cancelled'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

const bookingSchema = new Schema(
  {
    _id: { type: String, required: true },
    slotId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    status: { type: String, enum: BOOKING_STATUSES, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

/**
 * Level 3: the database refuses a second *confirmed* booking for a slot.
 * However many requests race, only one insert can succeed. Cancelled
 * bookings fall outside the index, so a cancelled slot can be booked again.
 */
bookingSchema.index(
  { slotId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'confirmed' },
    name: 'one_confirmed_per_slot',
  },
);

export type BookingDoc = InferSchemaType<typeof bookingSchema>;
export const Booking = model('Booking', bookingSchema);
