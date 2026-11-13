/** Level 5: at most this many booking attempts per email in a sliding window. */
export const EMAIL_RATE_LIMIT = { limit: 5, windowMs: 60_000 } as const;

/** Extra protection for the public web page: booking attempts per IP address. */
export const WEB_IP_RATE_LIMIT = { limit: 20, windowMs: 60_000 } as const;

export const PAGINATION = { defaultLimit: 10, minLimit: 1, maxLimit: 50 } as const;
