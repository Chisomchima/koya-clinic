/** An error that maps directly to an HTTP response: `{ "error": message }`. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly headers: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const unauthorized = (message = 'missing or invalid API key') => new HttpError(401, message);
export const notFound = (message = 'not found') => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);
export const unprocessable = (message: string) => new HttpError(422, message);
export const tooManyRequests = (message: string, retryAfterSeconds: number) =>
  new HttpError(429, message, { 'Retry-After': String(retryAfterSeconds) });
