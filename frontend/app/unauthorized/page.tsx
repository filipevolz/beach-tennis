import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <main className="auth-page">
      <div className="auth-card page-hero">
        <h1>Sem permissão</h1>
        <p>Não tem acesso a esta área com a sua conta atual.</p>
        <p>
          <Link href="/">Voltar ao início</Link>
        </p>
      </div>
    </main>
  );
}
