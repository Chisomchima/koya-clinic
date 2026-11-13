import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

const renderModal = (props: Partial<Parameters<typeof Modal>[0]> = {}) => {
  const onClose = vi.fn();
  render(
    <Modal open onClose={onClose} title="Enter your details" {...props}>
      <input aria-label="Name" />
      <button type="button">Save</button>
    </Modal>,
  );
  return { onClose };
};

describe('Modal', () => {
  it('renders an accessible dialog labelled by its title', () => {
    renderModal();
    expect(screen.getByRole('dialog', { name: 'Enter your details' })).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    renderModal({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('moves focus to the first field', () => {
    renderModal();
    expect(screen.getByLabelText('Name')).toHaveFocus();
  });

  it('closes on Escape and with the close button', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('cannot be dismissed while not dismissible (e.g. while saving)', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({ dismissible: false });
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('keeps Tab focus inside the dialog', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.tab(); // Name → Close
    await user.tab(); // Close → Save
    await user.tab(); // Save → wraps to Name
    expect(screen.getByLabelText('Name')).toHaveFocus();
  });

  it('locks page scrolling while open', () => {
    renderModal();
    expect(document.body.style.overflow).toBe('hidden');
  });
});
