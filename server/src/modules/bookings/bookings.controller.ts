import type { RequestHandler } from 'express';
import { validate } from '../../lib/validate.js';
import { BookingIdParams, CreateBookingBody, ListBookingsQuery } from './bookings.schema.js';
import * as bookings from './bookings.service.js';

export const create: RequestHandler = async (req, res) => {
  const { booking, replayed } = await bookings.createBooking(
    validate(CreateBookingBody, req.body),
    res.locals.idempotency,
  );
  if (replayed) res.set('Idempotent-Replayed', 'true');
  res.status(201).json(booking);
};

export const list: RequestHandler = async (req, res) => {
  res.json(await bookings.listBookings(validate(ListBookingsQuery, req.query)));
};

export const getById: RequestHandler = async (req, res) => {
  res.json(await bookings.getBooking(validate(BookingIdParams, req.params).id));
};

export const cancel: RequestHandler = async (req, res) => {
  res.json(await bookings.cancelBooking(validate(BookingIdParams, req.params).id));
};
