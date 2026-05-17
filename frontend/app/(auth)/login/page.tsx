import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/login-form';

export default function LoginPage() {
  return (
    <div className="auth-card">
      <Suspense fallback={<p className="page-center">A carregar…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
