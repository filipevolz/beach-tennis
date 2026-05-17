import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './login-form';

const loginMock = vi.fn();
const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams('next=%2Fplayer%2Fmatches'),
}));

vi.mock('./auth-context', () => ({
  useAuth: () => ({ login: loginMock }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    cleanup();
    loginMock.mockReset();
    replaceMock.mockReset();
  });

  it('redirects to next path after successful login', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue('player');

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/^email$/i), 'player@test.com');
    await user.type(screen.getByLabelText(/palavra-passe/i), 'password12');
    await user.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/player/matches');
    });
  });
});
