import type { RequestHandler } from 'express';
import { validate } from '../../lib/validate.js';
import { ResetBody } from './reset.schema.js';
import { resetAll } from './reset.service.js';

export const reset: RequestHandler = async (req, res) => {
  res.json(await resetAll(validate(ResetBody, req.body)));
};
