import { Schema, model, type InferSchemaType } from 'mongoose';

const bookingSchema = new Schema(
  {
    _id: { type: String, required: true },
    slotId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    status: { type: String, enum: ['confirmed', 'cancelled'] as const, required: true },
    createdAt: { type: Date, required: true },
    // Level 4: the Idempotency-Key that created this booking, and a hash of its request body.
    // Saved in the same write as the booking, so the two can never get out of step.
    idempotencyKey: String,
    requestHash: String,
  },
  { versionKey: false },
);

// Level 3: at most one *confirmed* booking per slot. The database decides every race.
bookingSchema.index(
  { slotId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'confirmed' },
    name: 'one_confirmed_per_slot',
  },
);

// Level 4: each Idempotency-Key creates at most one booking.
bookingSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string' } },
    name: 'one_booking_per_idempotency_key',
  },
);

// Level 4: a person's bookings, oldest first.
bookingSchema.index({ email: 1, createdAt: 1, _id: 1 });

export type BookingDoc = InferSchemaType<typeof bookingSchema>;
export const Booking = model('Booking', bookingSchema);
