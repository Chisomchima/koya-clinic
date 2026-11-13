export const PAGINATION = { defaultLimit: 10, minLimit: 1, maxLimit: 50 } as const;

export const IDEMPOTENCY = {
  /** How long a stored response can be replayed. */
  ttlMs: 24 * 60 * 60 * 1000,
  /** A request still "in progress" after this long is assumed to have crashed. */
  staleAfterMs: 30_000,
  /** How long a concurrent retry waits for the first request to finish. */
  waitTimeoutMs: 10_000,
  pollIntervalMs: 50,
} as const;
