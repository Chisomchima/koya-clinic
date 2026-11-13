import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { Booking } from '../models/booking.model.js';
import { RateLimit } from '../models/rate-limit.model.js';
import { Slot } from '../models/slot.model.js';

mongoose.set('strictQuery', true);
// Indexes are created explicitly below, so they are guaranteed to exist
// (the double-booking guarantee depends on one) before any request is served.
mongoose.set('autoIndex', false);

let connecting: Promise<typeof mongoose> | undefined;

/**
 * Connects once per process and reuses the connection afterwards. That also makes it
 * safe on serverless hosts, where one warm instance serves many requests.
 */
export function connectDb(uri = env.MONGODB_URI, dbName = env.MONGODB_DB) {
  connecting ??= (async () => {
    const conn = await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10_000 });
    await Promise.all([Slot, Booking, RateLimit].map((m) => m.createIndexes()));
    logger.info({ db: dbName }, 'connected to MongoDB');
    return conn;
  })().catch((err: unknown) => {
    connecting = undefined;
    throw err;
  });
  return connecting;
}

export async function disconnectDb() {
  connecting = undefined;
  await mongoose.disconnect();
}
