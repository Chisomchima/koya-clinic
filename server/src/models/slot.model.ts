import { Schema, model, type InferSchemaType } from 'mongoose';

const slotSchema = new Schema(
  {
    _id: { type: String, required: true },
    provider: { type: String, required: true },
    start: { type: String, required: true }, // echoed back exactly as sent
    end: { type: String, required: true },
    startAt: { type: Date, required: true }, // parsed `start`, for sorting and "has it started?"
  },
  { versionKey: false },
);

slotSchema.index({ startAt: 1, _id: 1 });
slotSchema.index({ provider: 1, startAt: 1, _id: 1 });

export type SlotDoc = InferSchemaType<typeof slotSchema>;
export const Slot = model('Slot', slotSchema);
