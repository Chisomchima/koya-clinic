import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { TestProject } from 'vitest/node';
import { MongoMemoryServer } from 'mongodb-memory-server';

const TEST_API_KEY = 'test-api-key-123';

/**
 * Starts an in-memory MongoDB and the real Express app on a random port,
 * then hands the URL to the tests. Tests talk to it over HTTP, like real clients do.
 */
export default async function setup(project: TestProject) {
  const mongo = await MongoMemoryServer.create();

  Object.assign(process.env, {
    NODE_ENV: 'test',
    MONGODB_URI: mongo.getUri(),
    MONGODB_DB: 'koya_booking_test',
    API_KEY: TEST_API_KEY,
  });

  // Imported only after the env is set, because config/env.ts validates it on import.
  const { createApp } = await import('../../../src/app.js');
  const { connectDb, disconnectDb } = await import('../../../src/db/connection.js');
  await connectDb();

  // A stand-in for the built React app, to test that the server serves the page.
  const clientDir = await mkdtemp(path.join(tmpdir(), 'koya-client-'));
  await writeFile(path.join(clientDir, 'index.html'), '<!doctype html><title>Koya Clinic</title>');

  const server = createApp({ clientDir }).listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const { port } = server.address() as AddressInfo;

  project.provide('baseUrl', `http://127.0.0.1:${port}`);
  project.provide('apiKey', TEST_API_KEY);

  return async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDb();
    await mongo.stop();
    await rm(clientDir, { recursive: true, force: true });
  };
}

declare module 'vitest' {
  export interface ProvidedContext {
    baseUrl: string;
    apiKey: string;
  }
}
