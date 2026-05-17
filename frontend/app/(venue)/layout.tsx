import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { RoleGuard } from '@/features/auth/role-guard';

export default function VenueLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRole="venue_manager">
      <AppShell role="venue_manager">{children}</AppShell>
    </RoleGuard>
  );
}
