import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ONBOARDING_COOKIE = 'onboarding_complete';
const GUEST_COOKIE = 'guest_mode';
const SESSION_COOKIE = 'better-auth.session_token';
const KEEP_SIGNED_IN_COOKIE = 'keep_signed_in';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes, Next.js internals, and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/static')) {
    return NextResponse.next();
  }

  const isWelcomeRoute = pathname === '/' || pathname.startsWith('/welcome');
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE));
  const hasOnboarded = request.cookies.get(ONBOARDING_COOKIE)?.value === 'true';
  const isGuest = request.cookies.get(GUEST_COOKIE)?.value === 'true';
  const keepSignedIn = request.cookies.get(KEEP_SIGNED_IN_COOKIE)?.value === 'true';
  const forceWelcome = request.nextUrl.searchParams.get('auth') === '1';

  const response = NextResponse.next();

  // If user has a session, set onboarding cookie
  if (hasSession) {
    response.cookies.set(ONBOARDING_COOKIE, 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    response.cookies.delete(GUEST_COOKIE);
  }

  // If user has access (session, onboarded, or guest), check if they want to skip welcome
  const hasAccess = hasOnboarded || hasSession || isGuest;

  // If user doesn't have access and is not on welcome page, redirect to welcome
  if (!hasAccess && !isWelcomeRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Show welcome page at every start unless "keep me signed in" is checked
  // Only auto-redirect to dashboard if:
  // 1. User explicitly wants to skip welcome (forceWelcome=false via keep_signed_in)
  // 2. User has access AND keepSignedIn is true AND not forcing welcome
  if (isWelcomeRoute && hasAccess && keepSignedIn && !forceWelcome) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // If user is on welcome route without keep_signed_in, clear onboarding to show welcome again
  if (isWelcomeRoute && !keepSignedIn && hasOnboarded && !hasSession && !isGuest) {
    response.cookies.delete(ONBOARDING_COOKIE);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

