'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { createApiClient } from '@/lib/api-client';
import { shouldRefreshToken } from '@/lib/jwt-utils';
import type { AuthUser, RegisterInput, UserRole } from '@/lib/auth-types';
import { createAuthApi } from './api';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserRole>;
  register: (input: RegisterInput) => Promise<UserRole>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
}

async function persistRefreshSession(refreshToken: string): Promise<void> {
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    credentials: 'same-origin',
  });
}

async function clearRefreshSession(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'same-origin',
  });
}

async function refreshAccessFromCookie(): Promise<string | null> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { accessToken: string };
  return data.accessToken;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);

  const setToken = useCallback((token: string | null) => {
    accessTokenRef.current = token;
    setAccessToken(token);
  }, []);

  const getAccessToken = useCallback(() => accessTokenRef.current, []);

  const refreshAccessToken = useCallback(async () => {
    const token = await refreshAccessFromCookie();
    if (token) {
      setToken(token);
    }
    return token;
  }, [setToken]);

  const apiClient = useMemo(
    () =>
      createApiClient({
        baseUrl: getApiBaseUrl(),
        getAccessToken,
        refreshAccessToken,
      }),
    [getAccessToken, refreshAccessToken],
  );

  const authApi = useMemo(() => createAuthApi(apiClient), [apiClient]);

  const applySession = useCallback(
    async (nextUser: AuthUser, tokens: { accessToken: string; refreshToken: string }) => {
      await persistRefreshSession(tokens.refreshToken);
      setUser(nextUser);
      setToken(tokens.accessToken);
    },
    [setToken],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await authApi.login(email, password);
      const nextUser: AuthUser = decodeUserFromAccessToken(tokens.accessToken, email);
      await applySession(nextUser, tokens);
      return nextUser.role;
    },
    [applySession, authApi],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const result = await authApi.register(input);
      await applySession(result.user, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      return result.user.role;
    },
    [applySession, authApi],
  );

  const logout = useCallback(async () => {
    await clearRefreshSession();
    setUser(null);
    setToken(null);
    router.replace('/login');
  }, [router, setToken]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = await refreshAccessFromCookie();
      if (cancelled) return;

      if (token) {
        setToken(token);
        const decoded = decodeUserFromAccessToken(token);
        setUser(decoded);
      }

      setIsLoading(false);
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [setToken]);

  useEffect(() => {
    if (!accessToken) return;

    const interval = window.setInterval(() => {
      if (shouldRefreshToken(accessToken)) {
        void refreshAccessToken();
      }
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [accessToken, refreshAccessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      login,
      register,
      logout,
      getAccessToken,
    }),
    [user, accessToken, isLoading, login, register, logout, getAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function decodeUserFromAccessToken(token: string, emailFallback?: string): AuthUser {
  const payloadPart = token.split('.')[1];
  if (!payloadPart) {
    throw new Error('Invalid access token');
  }

  const payload = JSON.parse(
    atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')),
  ) as {
    sub: string;
    role: UserRole;
    email?: string;
  };

  return {
    id: payload.sub,
    role: payload.role,
    email: payload.email ?? emailFallback ?? '',
  };
}
