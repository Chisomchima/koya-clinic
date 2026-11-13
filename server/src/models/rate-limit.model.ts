import { Schema, model } from 'mongoose';

/** One document per rate-limited key, holding the timestamps of recent attempts. */
const rateLimitSchema = new Schema(
  {
    _id: { type: String, required: true },
    hits: { type: [Date], default: [] },
    allowed: { type: Boolean },
    checkedAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit = model('RateLimit', rateLimitSchema);
