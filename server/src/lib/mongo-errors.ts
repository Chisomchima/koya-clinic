/** MongoDB's error for a unique index violation. */
export const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && 'code' in err && err.code === 11000;
