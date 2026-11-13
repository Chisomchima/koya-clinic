import { Schema, model } from 'mongoose';

/** Recent attempt timestamps for one key, e.g. "email:ada@example.com". */
const rateLimitSchema = new Schema(
  {
    _id: { type: String, required: true },
    hits: { type: [Date], default: [] },
    allowed: Boolean,
    checkedAt: Date,
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit = model('RateLimit', rateLimitSchema);
