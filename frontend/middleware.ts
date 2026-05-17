import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { REFRESH_TOKEN_COOKIE } from '@/lib/auth-cookies';

const AUTH_ROUTES = ['/login', '/register'];
const PROTECTED_PREFIXES = ['/player', '/venue'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshCookie = Boolean(request.cookies.get(REFRESH_TOKEN_COOKIE)?.value);

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isAuthRoute && hasRefreshCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isProtected && !hasRefreshCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register', '/player/:path*', '/venue/:path*'],
};
