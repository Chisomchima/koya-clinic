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

export type BookingDoc = InferSchemaType<typeof bookingSchema>;
export const Booking = model('Booking', bookingSchema);
