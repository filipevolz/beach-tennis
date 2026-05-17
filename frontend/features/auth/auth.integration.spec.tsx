import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './auth-context';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

const replaceMock = vi.fn();
const fetchMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeAccessToken(role: 'player' | 'venue_manager', email: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: 'user-1',
      role,
      email,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  );
  return `${header}.${payload}.signature`;
}

describe('auth UI flows', () => {
  beforeEach(() => {
    cleanup();
    vi.stubGlobal('fetch', fetchMock);
    replaceMock.mockReset();
    fetchMock.mockReset();
    process.env.NEXT_PUBLIC_API_URL = 'http://api.test/api/v1';
  });

  it('registers as player and redirects to player area', async () => {
    const user = userEvent.setup();

    fetchMock.mockImplementation(async (input: RequestInfo) => {
      const url = String(input);

      if (url.endsWith('/auth/register')) {
        return jsonResponse(
          {
            user: { id: 'user-1', email: 'player@test.com', role: 'player' },
            accessToken: makeAccessToken('player', 'player@test.com'),
            refreshToken: 'refresh-player',
          },
          201,
        );
      }

      if (url.endsWith('/api/auth/session')) {
        return jsonResponse({ ok: true });
      }

      return jsonResponse({}, 404);
    });

    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('radio', { name: /^jogador$/i }));
    await user.type(screen.getByLabelText(/nome a mostrar/i), 'Player One');
    await user.type(screen.getByLabelText(/^email$/i), 'player@test.com');
    await user.type(screen.getByLabelText(/palavra-passe/i), 'password12');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/player');
    });
  });

  it('registers as venue manager and redirects to venue area', async () => {
    const user = userEvent.setup();

    fetchMock.mockImplementation(async (input: RequestInfo) => {
      const url = String(input);

      if (url.endsWith('/auth/register')) {
        return jsonResponse(
          {
            user: { id: 'user-2', email: 'venue@test.com', role: 'venue_manager' },
            accessToken: makeAccessToken('venue_manager', 'venue@test.com'),
            refreshToken: 'refresh-venue',
          },
          201,
        );
      }

      if (url.endsWith('/api/auth/session')) {
        return jsonResponse({ ok: true });
      }

      return jsonResponse({}, 404);
    });

    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('radio', { name: /gestor de clube/i }));
    await user.type(screen.getByLabelText(/nome a mostrar/i), 'Club Manager');
    await user.type(screen.getByLabelText(/^email$/i), 'venue@test.com');
    await user.type(screen.getByLabelText(/palavra-passe/i), 'password12');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/venue');
    });
  });

  it('shows API error on invalid login without crashing', async () => {
    const user = userEvent.setup();

    fetchMock.mockImplementation(async (input: RequestInfo) => {
      const url = String(input);

      if (url.endsWith('/auth/login')) {
        return jsonResponse(
          { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
          401,
        );
      }

      if (url.endsWith('/api/auth/refresh')) {
        return jsonResponse({ code: 'NO_REFRESH_TOKEN' }, 401);
      }

      return jsonResponse({}, 404);
    });

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText(/^email$/i), 'bad@test.com');
    await user.type(screen.getByLabelText(/palavra-passe/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /^entrar$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('logout clears session and redirects to login', async () => {
    const user = userEvent.setup();

    fetchMock.mockImplementation(async (input: RequestInfo) => {
      const url = String(input);

      if (url.endsWith('/api/auth/refresh')) {
        return jsonResponse({ accessToken: makeAccessToken('player', 'player@test.com') });
      }

      if (url.endsWith('/api/auth/logout')) {
        return jsonResponse({ ok: true });
      }

      return jsonResponse({}, 404);
    });

    function LogoutProbe() {
      const { logout } = useAuth();
      return (
        <button type="button" onClick={() => void logout()}>
          Sair agora
        </button>
      );
    }

    render(
      <AuthProvider>
        <LogoutProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sair agora/i })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: /sair agora/i }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });

  it('refresh renews access token for subsequent /players/me call', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith('/api/auth/refresh')) {
        return jsonResponse({ accessToken: makeAccessToken('player', 'player@test.com') });
      }

      if (url.endsWith('/players/me')) {
        const auth = new Headers(init?.headers).get('Authorization');
        if (auth === `Bearer ${makeAccessToken('player', 'player@test.com')}`) {
          return jsonResponse({ id: 'profile-1', displayName: 'Player', skillLevel: 'beginner' });
        }
        return jsonResponse({ code: 'UNAUTHORIZED' }, 401);
      }

      return jsonResponse({}, 404);
    });

    const { createApiClient } = await import('@/lib/api-client');
    let token: string | null = null;

    const refreshAccessToken = async () => {
      const response = await fetch('/api/auth/refresh', { method: 'POST' });
      const data = (await response.json()) as { accessToken: string };
      token = data.accessToken;
      return token;
    };

    const client = createApiClient({
      baseUrl: 'http://api.test/api/v1',
      getAccessToken: () => token,
      refreshAccessToken,
    });

    await refreshAccessToken();
    const profile = await client.request<{ displayName: string }>('/players/me');
    expect(profile.displayName).toBe('Player');
  });
});
