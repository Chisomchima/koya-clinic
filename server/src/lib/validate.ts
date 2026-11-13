import type { z } from 'zod';
import { badRequest } from './http-error.js';

/** Parses `input` with `schema`, turning the first problem into a 400 `{ error }`. */
export function validate<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  throw badRequest(result.error.issues[0]?.message ?? 'invalid request');
}
