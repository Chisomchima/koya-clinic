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
    /**
     * Level 4: the Idempotency-Key that created this booking (scoped, e.g. "api:<key>"),
     * and a hash of the request body it came with. Stored on the booking itself so the
     * booking and its key are saved in one atomic write and can never get out of step.
     */
    idempotencyKey: { type: String },
    requestHash: { type: String },
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

/** Level 4: each Idempotency-Key can create at most one booking. */
bookingSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string' } },
    name: 'one_booking_per_idempotency_key',
  },
);

/** Level 4: a person's bookings, oldest first, for cursor pagination. */
bookingSchema.index({ email: 1, createdAt: 1, _id: 1 });

export type BookingDoc = InferSchemaType<typeof bookingSchema>;
export const Booking = model('Booking', bookingSchema);
