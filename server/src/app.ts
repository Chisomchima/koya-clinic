import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { connectDb } from './db/connection.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { apiRouter } from './routes/api.routes.js';
import { webRouter } from './routes/web.routes.js';

const DEFAULT_CLIENT_DIR = fileURLToPath(new URL('../../client/dist', import.meta.url));

// The React app's routes; they must not collide with API paths.
const CLIENT_ROUTES = ['/', '/book', '/booking/:id'];

export function createApp({ clientDir = DEFAULT_CLIENT_DIR } = {}): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY_HOPS); // real client IPs behind the host's proxy
  app.use(helmet());
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  // The database and its indexes must be ready before any data route runs.
  app.use(async (_req, _res, next) => {
    await connectDb();
    next();
  });

  app.use('/web', webRouter);

  // The built React app, served from the same origin.
  if (existsSync(clientDir)) {
    app.use(express.static(clientDir, { index: false, maxAge: '1h' }));
    app.get(CLIENT_ROUTES, (_req, res) => {
      res.sendFile(path.join(clientDir, 'index.html'));
    });
  }

  app.use(apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
