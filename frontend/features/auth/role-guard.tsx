'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { UserRole } from '@/lib/auth-types';
import { useAuth } from './auth-context';

interface RoleGuardProps {
  children: ReactNode;
  allowedRole: UserRole;
}

export function RoleGuard({ children, allowedRole }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user.role !== allowedRole) {
      router.replace('/unauthorized');
    }
  }, [allowedRole, isLoading, pathname, router, user]);

  if (isLoading || !user || user.role !== allowedRole) {
    return (
      <div className="role-guard-loading" aria-live="polite">
        A carregar…
      </div>
    );
  }

  return <>{children}</>;
}
