'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { UserRole } from '@/lib/auth-types';
import { useAuth } from '@/features/auth/auth-context';
import { Button } from '@/components/ui/button';

interface AppShellProps {
  children: ReactNode;
  role: UserRole;
}

const NAV_BY_ROLE: Record<UserRole, { href: string; label: string }[]> = {
  player: [
    { href: '/player', label: 'Início' },
    { href: '/player/discover', label: 'Descobrir' },
    { href: '/player/matches', label: 'Os meus jogos' },
  ],
  venue_manager: [
    { href: '/venue/dashboard', label: 'Clube' },
    { href: '/venue/slots', label: 'Horários' },
  ],
};

export function AppShell({ children, role }: AppShellProps) {
  const { user, logout } = useAuth();
  const navItems = NAV_BY_ROLE[role];

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand">Beach Tennis</div>
        <nav className="app-shell__nav" aria-label="Principal">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="app-shell__nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="app-shell__actions">
          <span className="app-shell__user">{user?.email}</span>
          <Button variant="secondary" onClick={() => void logout()}>
            Sair
          </Button>
        </div>
      </header>
      <main className="app-shell__main">{children}</main>
    </div>
  );
}
