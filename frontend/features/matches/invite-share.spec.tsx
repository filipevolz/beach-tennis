import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InviteShare } from './invite-share';

describe('InviteShare', () => {
  beforeEach(() => {
    cleanup();
  });

  it('copies the correct invite URL to clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://app.beachtennis.pt' },
      writable: true,
      configurable: true,
    });

    render(<InviteShare inviteCode="abc123" />);

    const btn = screen.getByRole('button', { name: /copiar link de convite/i });
    await user.click(btn);

    expect(writeText).toHaveBeenCalledWith('https://app.beachtennis.pt/matches/invite/abc123');
  });

  it('shows "Copiado!" after copying', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });

    render(<InviteShare inviteCode="abc123" />);
    await user.click(screen.getByRole('button', { name: /copiar link de convite/i }));
    expect(screen.getByText('Copiado!')).toBeTruthy();
  });

  it('displays the invite URL in a readonly input', () => {
    render(<InviteShare inviteCode="token456" />);
    const input = screen.getByRole('textbox', { name: /url de convite/i }) as HTMLInputElement;
    expect(input.readOnly).toBe(true);
    expect(input.value).toContain('/matches/invite/token456');
  });
});
