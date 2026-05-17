import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateMatchForm } from './create-match-form';

const createMatchMock = vi.fn();

vi.mock('@/lib/use-api', () => ({
  useApi: () => ({
    matches: { createMatch: createMatchMock },
  }),
}));

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'player', email: 'p@test.com' } }),
}));

describe('CreateMatchForm', () => {
  beforeEach(() => {
    cleanup();
    createMatchMock.mockReset();
  });

  it('submits form with correct data', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    createMatchMock.mockResolvedValue({ id: 'match-new', status: 'forming', spots: [], format: 'doubles', visibility: 'public', skillLevel: 'intermediate', creatorId: 'u1', createdAt: '' });

    render(<CreateMatchForm defaultLat={38.7} defaultLng={-9.1} onSuccess={onSuccess} />);

    await user.click(screen.getByRole('button', { name: /criar jogo/i }));

    expect(createMatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        format: 'doubles',
        visibility: 'public',
        skillLevel: 'intermediate',
        latitude: 38.7,
        longitude: -9.1,
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('with visibility "invite" does not show public discovery option selected', async () => {
    const user = userEvent.setup();
    render(<CreateMatchForm onSuccess={vi.fn()} />);

    const inviteRadio = screen.getByRole('radio', { name: /apenas por convite/i });
    await user.click(inviteRadio);

    expect(inviteRadio).toBeChecked();
    const publicRadio = screen.getByRole('radio', { name: /público/i });
    expect(publicRadio).not.toBeChecked();

    // Info message appears for invite
    expect(screen.getByText(/não aparecerá nos resultados de descoberta pública/i)).toBeTruthy();
  });

  it('shows error when coordinates are invalid', async () => {
    const user = userEvent.setup();
    render(<CreateMatchForm onSuccess={vi.fn()} />);

    const latInput = screen.getByLabelText(/latitude do jogo/i);
    await user.clear(latInput);
    await user.type(latInput, 'abc');

    await user.click(screen.getByRole('button', { name: /criar jogo/i }));

    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
