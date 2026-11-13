import { readFileSync } from 'node:fs';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

// The assessment's API contract as interactive docs. Reading them needs no key;
// "Authorize" with the API key to try requests.
const spec = JSON.parse(
  readFileSync(new URL('../../../docs/openapi.json', import.meta.url), 'utf8'),
) as swaggerUi.JsonObject;

export const docsRouter = Router();

docsRouter.use(swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: 'Koya Clinic API' }));
