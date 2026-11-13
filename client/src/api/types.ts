/** Shapes returned by the server (see docs/openapi.json). */

export interface Slot {
  id: string;
  provider: string;
  start: string;
  end: string;
  available: boolean;
}

export type BookingStatus = 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  slot_id: string;
  name: string;
  email: string;
  status: BookingStatus;
  created_at: string;
}

export interface NewBooking {
  slot_id: string;
  name: string;
  email: string;
}
