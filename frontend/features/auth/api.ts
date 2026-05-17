import type { ApiClient } from '@/lib/api-client';
import type {
  AuthTokens,
  AuthUser,
  RegisterInput,
} from '@/lib/auth-types';

export type LoginResponse = AuthTokens;

export interface RegisterResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface PlayerProfileResponse {
  id: string;
  displayName: string;
  skillLevel: string;
}

export function createAuthApi(client: ApiClient) {
  return {
    login(email: string, password: string) {
      return client.request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },

    register(input: RegisterInput) {
      return client.request<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    getPlayerProfile() {
      return client.request<PlayerProfileResponse>('/players/me');
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
