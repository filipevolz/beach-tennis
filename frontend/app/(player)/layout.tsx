import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { RoleGuard } from '@/features/auth/role-guard';

export default function PlayerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRole="player">
      <AppShell role="player">{children}</AppShell>
    </RoleGuard>
  );
}
