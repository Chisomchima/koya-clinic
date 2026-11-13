import { z } from 'zod';

export const ListSlotsQuery = z.object({
  provider: z.string({ error: 'provider must be a single value' }).optional(),
});
