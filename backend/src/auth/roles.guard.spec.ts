import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createContext = (user?: { id: string; role: UserRole; email: string }) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when role matches', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.player]);

    expect(
      guard.canActivate(
        createContext({
          id: '1',
          role: UserRole.player,
          email: 'p@example.com',
        }),
      ),
    ).toBe(true);
  });

  it('blocks venue_manager on player-only route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.player]);

    expect(() =>
      guard.canActivate(
        createContext({
          id: '2',
          role: UserRole.venue_manager,
          email: 'm@example.com',
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
