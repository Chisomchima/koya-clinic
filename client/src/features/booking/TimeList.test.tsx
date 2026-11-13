import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Slot } from '../../api/types';
import { formatTime } from '../../lib/format';
import { slotIn } from '../../test/render';
import { TimeList } from './TimeList';

function Harness({ slots, onConfirm }: { slots: Slot[]; onConfirm: (slot: Slot) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <TimeList
      slots={slots}
      selectedId={selected}
      showProvider
      onSelect={(s) => setSelected(s.id)}
      onConfirm={onConfirm}
    />
  );
}

describe('TimeList', () => {
  const slots = [slotIn(24), slotIn(25, { provider: 'Dr Bello' })];

  it('lists each time with its doctor', () => {
    render(<Harness slots={slots} onConfirm={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: new RegExp(formatTime(slots[1]!.start)) }),
    ).toHaveTextContent('Dr Bello');
  });

  it('reveals "Next" for the picked time, and confirms that slot', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Harness slots={slots} onConfirm={onConfirm} />);

    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: new RegExp(formatTime(slots[0]!.start)) }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(onConfirm).toHaveBeenCalledWith(slots[0]);
  });
});
