import { Schema, model, type InferSchemaType } from 'mongoose';

const idempotencyKeySchema = new Schema(
  {
    /** The Idempotency-Key header value. Unique by virtue of being the _id. */
    _id: { type: String, required: true },
    /** SHA-256 of the request body, to detect a key reused with a different body. */
    requestHash: { type: String, required: true },
    state: { type: String, enum: ['in_progress', 'completed'], required: true },
    lockedAt: { type: Date, required: true },
    responseStatus: { type: Number },
    responseBody: { type: Schema.Types.Mixed },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false, minimize: false },
);

idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type IdempotencyKeyDoc = InferSchemaType<typeof idempotencyKeySchema>;
export const IdempotencyKey = model('IdempotencyKey', idempotencyKeySchema);
