import { NextResponse } from 'next/server';
import { REFRESH_TOKEN_COOKIE } from '@/lib/auth-cookies';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
