import { z } from 'zod';

const dateTime = (field: string) =>
  z
    .string({ error: `${field} must be a date-time string` })
    .refine((v) => !Number.isNaN(Date.parse(v)), `${field} must be a valid date-time`);

const SlotInput = z.object({
  id: z.union([z.string().min(1), z.number()], { error: 'slot id is required' }).transform(String),
  provider: z.string({ error: 'slot provider is required' }).min(1, 'slot provider is required'),
  start: dateTime('slot start'),
  end: dateTime('slot end'),
});

export const ResetBody = z
  .object(
    { slots: z.array(SlotInput, { error: 'slots must be an array' }) },
    {
      error: 'request body must be a JSON object',
    },
  )
  .refine(
    (b) => new Set(b.slots.map((s) => s.id)).size === b.slots.length,
    'slot ids must be unique',
  );

export type ResetInput = z.infer<typeof ResetBody>;
