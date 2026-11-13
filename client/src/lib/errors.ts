import { ApiError } from '../api/http';

export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 409) return 'Someone just grabbed this time. Please pick another one.';
    if (err.status === 429) {
      const wait = err.retryAfterSeconds ? ` in ${err.retryAfterSeconds} seconds` : ' shortly';
      return `That's a lot of attempts! Please try again${wait}.`;
    }
    if (err.status >= 500) return 'Something went wrong on our side. Please try again.';
    return err.message.charAt(0).toUpperCase() + err.message.slice(1) + '.';
  }
  return "We couldn't reach the clinic. Check your connection and try again.";
}

export const isSlotTaken = (err: unknown) => err instanceof ApiError && err.status === 409;
