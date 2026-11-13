import { Router } from 'express';
import * as bookings from '../modules/bookings/bookings.controller.js';
import * as resetController from '../modules/reset/reset.controller.js';
import * as slots from '../modules/slots/slots.controller.js';

/** The API from the spec (docs/openapi.json). */
export const apiRouter = Router();

apiRouter.post('/reset', resetController.reset);
apiRouter.get('/slots', slots.list);
apiRouter.post('/bookings', bookings.create);
apiRouter.get('/bookings/:id', bookings.getById);
