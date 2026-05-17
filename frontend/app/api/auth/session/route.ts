import { NextResponse } from 'next/server';
import {
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  REFRESH_TOKEN_COOKIE,
} from '@/lib/auth-cookies';

export async function POST(request: Request) {
  const body = (await request.json()) as { refreshToken?: string };

  if (!body.refreshToken || typeof body.refreshToken !== 'string') {
    return NextResponse.json(
      { code: 'INVALID_BODY', message: 'refreshToken is required' },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE,
    value: body.refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
  });

  return response;
}
