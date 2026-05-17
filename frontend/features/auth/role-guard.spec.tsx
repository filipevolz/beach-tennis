import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRole } from '@/lib/auth-types';
import { RoleGuard } from './role-guard';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => '/venue',
}));

const useAuthMock = vi.fn();

vi.mock('./auth-context', () => ({
  useAuth: () => useAuthMock(),
}));

describe('RoleGuard', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    useAuthMock.mockReset();
  });

  it('redirects unauthenticated users to login', async () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false });

    render(
      <RoleGuard allowedRole="player">
        <p>Secret</p>
      </RoleGuard>,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login?next=%2Fvenue');
    });
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });

  it('redirects cross-role access to unauthorized', async () => {
    useAuthMock.mockReturnValue({
      user: { id: '1', email: 'p@test.com', role: 'player' as UserRole },
      isLoading: false,
    });

    render(
      <RoleGuard allowedRole="venue_manager">
        <p>Secret</p>
      </RoleGuard>,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/unauthorized');
    });
  });

  it('renders children for matching role', () => {
    useAuthMock.mockReturnValue({
      user: { id: '1', email: 'p@test.com', role: 'player' as UserRole },
      isLoading: false,
    });

    render(
      <RoleGuard allowedRole="player">
        <p>Secret</p>
      </RoleGuard>,
    );

    expect(screen.getByText('Secret')).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
