import { Schema, model, type InferSchemaType } from 'mongoose';

const slotSchema = new Schema(
  {
    _id: { type: String, required: true },
    provider: { type: String, required: true },
    /** `start` / `end` are echoed back exactly as the client sent them. */
    start: { type: String, required: true },
    end: { type: String, required: true },
    /** Parsed copies, used for sorting and "has this slot started?" checks. */
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
  },
  { versionKey: false },
);

slotSchema.index({ startAt: 1, _id: 1 });
slotSchema.index({ provider: 1, startAt: 1, _id: 1 });

export type SlotDoc = InferSchemaType<typeof slotSchema>;
export const Slot = model('Slot', slotSchema);
