interface MongoDuplicateKeyError {
  code: 11000;
  keyPattern?: Record<string, unknown>;
}

/**
 * MongoDB's error for a unique index violation. Pass `field` to only match
 * violations of an index on that field.
 */
export function isDuplicateKeyError(err: unknown, field?: string): err is MongoDuplicateKeyError {
  if (typeof err !== 'object' || err === null || !('code' in err) || err.code !== 11000)
    return false;
  if (field === undefined) return true;
  const { keyPattern } = err as MongoDuplicateKeyError;
  return keyPattern !== undefined && field in keyPattern;
}
