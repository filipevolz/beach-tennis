import { UserRole } from '@prisma/client';

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
  email: string;
  type?: 'access' | 'refresh';
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}
