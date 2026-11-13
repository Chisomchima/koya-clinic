# Koya Clinic Booking

A clinic booking API and the web page that uses it, built for Task 1 of the Koya assessment,
following the [spec](https://koyaacademy.com/assessment-api) (copy in [`docs/openapi.json`](docs/openapi.json)).

**Stack:** TypeScript · Express 5 · MongoDB Atlas (Mongoose) · zod · React 19 + Vite ·
TanStack Query · Tailwind · Motion · Vitest. One Express server runs both the API and the page.

## Run it

```bash
npm install
cp server/.env.example server/.env   # set MONGODB_URI and API_KEY
npm run dev                          # API :4000, page http://localhost:5173
npm run seed -w server               # a week of demo slots (wipes bookings)
npm test                             # all server and client tests
```

## How each level is solved

| Level | Approach                                                                                                                                                                                   | Code                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| 1     | Slots echo `start`/`end` exactly as sent and are sorted by a parsed copy.                                                                                                                  | [`modules/`](server/src/modules)                                 |
| 2     | `X-API-Key` is compared in constant time. zod validates and normalises input (trimmed, lower-cased email). Unknown slot → 404, started slot → 400.                                         | [`require-api-key.ts`](server/src/middleware/require-api-key.ts) |
| 3     | A **partial unique index** allows one _confirmed_ booking per slot, so the database decides every race (25 simultaneous bookings → one 201, 24 × 409). Cancelling is one atomic update.    | [`booking.model.ts`](server/src/models/booking.model.ts)         |
| 4     | The `Idempotency-Key` is **stored on the booking** with a unique index (see below). Pagination is keyset-based on `(createdAt, _id)`, with an opaque cursor.                               | [`idempotency.ts`](server/src/middleware/idempotency.ts)         |
| 5     | A **sliding window**: at most 5 attempts per email per minute, failures included, done in one atomic MongoDB update using the database clock. The 6th attempt gets 429 with `Retry-After`. | [`rate-limiter.ts`](server/src/lib/rate-limiter.ts)              |

## Key decisions

**1. The database enforces the rules.** Double booking, idempotency and rate limits are all
decided by unique indexes and single-document atomic updates, never by "check, then write" code
that concurrent requests can slip through. They hold across any number of server instances.

**2. The idempotency key lives on the booking.** The first version kept keys in their own
collection, but then the booking and its key were two separate writes, so a crash in between
turned a retry into a 409. Storing the key on the booking makes it one atomic write.
Simultaneous retries are settled by the unique index, and the loser returns the winner's
booking. Failed requests are re-run rather than replayed; nothing was created, so the answer
is the same.

**Also:**

- The web page calls key-less `/web/*` routes on the same server (a _backend-for-frontend_), so
  the API key never reaches the browser. Those routes expose only patient actions (no `/reset`,
  no listing by email) and add a per-IP limit.
- I wrote the rate limiter instead of using a library because the common ones count in fixed
  windows, which can let ~10 attempts through in 2 seconds around a window reset.

## Project layout

```
server/src/
  modules/{slots,bookings,reset}/   schema (zod) → controller → service
  middleware/                       API key, idempotency, rate limiting, errors
  routes/api.routes.ts              the spec's API (X-API-Key)
  routes/web.routes.ts              the page's key-less subset
  models/  lib/  config/  db/
server/tests/{unit,e2e}/            unit tests, and the real app over HTTP on in-memory MongoDB
client/src/
  pages/  features/  components/    landing, booking flow, manage booking
  api/                              fetch client + React Query hooks
```

## Tests

`npm test` runs the following:

- **Server:** unit tests, plus end-to-end tests per level, including the concurrency cases:
  simultaneous bookings, same-key retries, simultaneous cancels, a rate-limit burst, and spoofed
  `X-Forwarded-For` headers.
- **Client:** the modal's accessibility, the calendar and booking flow, and that a retried
  booking reuses the same idempotency key.

To run the end-to-end suite against a live deployment (warning: it calls `/reset`):
`TEST_BASE_URL=… TEST_API_KEY=… npm run test:remote -w server`.

## Deploy

**Vercel:** import the repo; [`vercel.json`](vercel.json) builds both packages, serves the React
app as static files, and routes every other request to the Express app in
[`api/index.js`](api/index.js). Set `MONGODB_URI` and `API_KEY` in the project's environment
variables. **Render:** a [`render.yaml`](render.yaml) blueprint runs it as one Node server.

Either way, allow network access from `0.0.0.0/0` in Atlas (both hosts use changing IPs).
Optional variables are listed in [`server/.env.example`](server/.env.example).

## What I'd do next

- Confirm the patient's email before cancelling (today the booking reference is enough).
- Give each client its own API key, and send confirmation emails through a queue.
- Move rate limiting to Redis at higher traffic (idempotency stays next to the bookings).
- Add Playwright browser tests and CI.
