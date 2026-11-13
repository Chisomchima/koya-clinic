import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { formatTime } from '../lib/format';
import { jsonResponse, renderWithProviders, slotIn } from '../test/render';
import { BookPage } from './BookPage';

const slots = [
  slotIn(24, { id: 'a1', provider: 'Dr Ade' }),
  slotIn(26, { id: 'b1', provider: 'Dr Bello' }),
  slotIn(27, { id: 'a2', provider: 'Dr Ade' }),
  slotIn(28, { id: 'a3', provider: 'Dr Ade', available: false }),
];

function renderBookPage(route = '/book') {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { slots })));
  renderWithProviders(
    <Routes>
      <Route path="/book" element={<BookPage />} />
    </Routes>,
    { route },
  );
}

describe('BookPage', () => {
  it('starts by asking which doctor, with their next available time', async () => {
    renderBookPage();

    expect(
      await screen.findByRole('heading', { name: 'Who would you like to see?' }),
    ).toBeInTheDocument();
    const ade = screen.getByRole('button', { name: /^Dr Ade/ });
    expect(ade).toHaveTextContent(formatTime(slots[0]!.start));
    expect(ade).toHaveTextContent('2 open times'); // the booked slot isn't counted
    expect(screen.getByRole('button', { name: /First available doctor/ })).toBeInTheDocument();
  });

  it('walks from doctor to time to the details form', async () => {
    const user = userEvent.setup();
    renderBookPage();

    await user.click(await screen.findByRole('button', { name: /^Dr Ade/ }));
    expect(
      await screen.findByRole('heading', { name: 'Select a date & time' }),
    ).toBeInTheDocument();

    // Only Dr Ade's open times are offered.
    await user.click(screen.getByRole('button', { name: formatTime(slots[0]!.start) }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    const dialog = await screen.findByRole('dialog', { name: 'Enter your details' });
    expect(within(dialog).getByText(/Dr Ade · 30 min/)).toBeInTheDocument();
  });

  it('opens straight on the calendar when the doctor is in the URL', async () => {
    renderBookPage(`/book?provider=${encodeURIComponent('Dr Bello')}`);
    expect(
      await screen.findByRole('heading', { name: 'Select a date & time' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: formatTime(slots[1]!.start) })).toBeInTheDocument();
  });

  it('shows a friendly error with a retry when slots cannot load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    renderWithProviders(
      <Routes>
        <Route path="/book" element={<BookPage />} />
      </Routes>,
      { route: '/book' },
    );
    expect(await screen.findByText("We couldn't load available times")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
