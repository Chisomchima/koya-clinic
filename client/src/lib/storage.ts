/**
 * Small, failure-tolerant wrappers around localStorage. Storage can be unavailable
 * (private mode, blocked cookies), so every access is guarded and has a fallback.
 */
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore: this is only a convenience
  }
}

const ONBOARDED = 'koya:onboarded';
const RECENT = 'koya:recent-bookings';

export const onboarding = {
  isDone: () => read(ONBOARDED, false),
  markDone: () => write(ONBOARDED, true),
};

/** Bookings made on this device, so patients can find them again without the reference. */
export interface RecentBooking {
  id: string;
  provider: string;
  start: string;
  end: string;
}

export const recentBookings = {
  list: () => read<RecentBooking[]>(RECENT, []),
  add: (booking: RecentBooking) =>
    write(
      RECENT,
      [booking, ...recentBookings.list().filter((b) => b.id !== booking.id)].slice(0, 5),
    ),
};
