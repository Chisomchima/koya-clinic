import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithProviders, slotIn } from '../../test/render';
import { DetailsModal } from './DetailsModal';

const slot = slotIn(24, { id: 's1' });
const booking = {
  id: 'KC-7KQ2M-9XH4P',
  slot_id: 's1',
  name: 'Ada Obi',
  email: 'ada@example.com',
  status: 'confirmed',
  created_at: new Date().toISOString(),
};

function setup(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock);
  const props = { onClose: vi.fn(), onBooked: vi.fn(), onSlotTaken: vi.fn() };
  renderWithProviders(<DetailsModal slot={slot} {...props} />);
  return props;
}

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Full name'), 'Ada Obi');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.click(screen.getByRole('button', { name: 'Schedule appointment' }));
  return user;
}

const sentKey = (call: unknown[]) =>
  ((call[1] as RequestInit).headers as Record<string, string>)['Idempotency-Key'];

describe('DetailsModal', () => {
  it('books the slot with an Idempotency-Key and reports the booking', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, booking));
    const { onBooked } = setup(fetchMock);

    await fillAndSubmit();

    await waitFor(() => expect(onBooked).toHaveBeenCalledWith(booking, slot));
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/web/bookings');
    expect(JSON.parse(init.body)).toEqual({
      slot_id: 's1',
      name: 'Ada Obi',
      email: 'ada@example.com',
    });
    expect(sentKey(fetchMock.mock.calls[0]!)).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('retries a network failure with the same Idempotency-Key, so it can never book twice', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse(201, booking));
    const { onBooked } = setup(fetchMock);

    await fillAndSubmit();

    await waitFor(() => expect(onBooked).toHaveBeenCalled(), { timeout: 4000 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sentKey(fetchMock.mock.calls[1]!)).toBe(sentKey(fetchMock.mock.calls[0]!));
  });

  it('does not retry a 4xx answer, and shows the message', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(400, { error: 'email is not valid' }));
    setup(fetchMock);

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Email is not valid.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('offers another time when the slot was just taken', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(409, { error: 'slot is already booked' }));
    const { onSlotTaken, onBooked } = setup(fetchMock);

    const user = await fillAndSubmit();
    await user.click(await screen.findByRole('button', { name: 'Choose another time' }));

    expect(onSlotTaken).toHaveBeenCalled();
    expect(onBooked).not.toHaveBeenCalled();
  });
});
