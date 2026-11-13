import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { formatLongDay } from '../../lib/format';
import { MonthCalendar } from './MonthCalendar';

const day = (d: number) => new Date(2030, 0, d); // January 2030
const dayButton = (d: number, available = true) =>
  screen.getByRole('button', {
    name: `${formatLongDay(day(d))}${available ? '' : ', no times available'}`,
  });

function renderCalendar(onSelectDay = vi.fn()) {
  render(
    <MonthCalendar
      availableDays={new Set(['2030-01-15', '2030-01-16'])}
      selectedDay="2030-01-15"
      onSelectDay={onSelectDay}
      minMonth={day(1)}
      maxMonth={new Date(2030, 1, 1)}
    />,
  );
  return onSelectDay;
}

describe('MonthCalendar', () => {
  it('shows the month of the selected day', () => {
    renderCalendar();
    expect(screen.getByRole('heading', { name: /January 2030/ })).toBeInTheDocument();
  });

  it('only lets open days be picked, and marks the selected one', async () => {
    const user = userEvent.setup();
    const onSelectDay = renderCalendar();

    expect(dayButton(15)).toHaveAttribute('aria-pressed', 'true');
    expect(dayButton(10, false)).toBeDisabled();

    await user.click(dayButton(16));
    expect(onSelectDay).toHaveBeenCalledWith('2030-01-16');
  });

  it('pages between months, but not past the range that has slots', async () => {
    const user = userEvent.setup();
    renderCalendar();

    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(await screen.findByRole('heading', { name: /February 2030/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });
});
