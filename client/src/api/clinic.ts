import { request } from './http';
import type { Booking, NewBooking, Slot } from './types';

export const clinicApi = {
  listSlots: () => request<{ slots: Slot[] }>('/slots').then((r) => r.slots),

  getBooking: (id: string) => request<Booking>(`/bookings/${encodeURIComponent(id)}`),

  createBooking: (input: NewBooking, idempotencyKey: string) =>
    request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { 'Idempotency-Key': idempotencyKey },
    }),

  cancelBooking: (id: string) =>
    request<Booking>(`/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
