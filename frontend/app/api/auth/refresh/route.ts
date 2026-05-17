import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { REFRESH_TOKEN_COOKIE } from '@/lib/auth-cookies';

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
}

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { code: 'NO_REFRESH_TOKEN', message: 'Refresh token not found' },
      { status: 401 },
    );
  }

  const upstream = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!upstream.ok) {
    const body = await upstream.json().catch(() => ({}));
    return NextResponse.json(body, { status: upstream.status });
  }

  const data = (await upstream.json()) as { accessToken: string };
  return NextResponse.json(data);
}
