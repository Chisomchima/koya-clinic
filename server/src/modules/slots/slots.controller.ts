import type { RequestHandler } from 'express';
import { validate } from '../../lib/validate.js';
import { ListSlotsQuery } from './slots.schema.js';
import { listSlots } from './slots.service.js';

export const list: RequestHandler = async (req, res) => {
  res.json(await listSlots(validate(ListSlotsQuery, req.query)));
};
