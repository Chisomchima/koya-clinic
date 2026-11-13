import { z } from 'zod';

/** Trims, then lower-cases. Used for storing and for matching (and rate-limiting) emails. */
export const normalizeEmail = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const requiredText = (field: string) =>
  z
    .string({
      error: (issue) =>
        issue.input === undefined || issue.input === null
          ? `${field} is required`
          : `${field} must be a string`,
    })
    .trim()
    .min(1, `${field} must not be empty`);

export const CreateBookingBody = z.object(
  {
    slot_id: requiredText('slot_id'),
    name: requiredText('name').max(200, 'name must be at most 200 characters'),
    email: requiredText('email')
      .toLowerCase()
      .max(254, 'email is not valid')
      .pipe(z.email('email is not valid')),
  },
  { error: 'request body must be a JSON object' },
);

export const BookingIdParams = z.object({ id: z.string().min(1) });

export type CreateBookingInput = z.infer<typeof CreateBookingBody>;
