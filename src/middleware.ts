import { auth } from '@/shared/lib/auth';
import { NextResponse } from 'next/server';

const publicRoutes = ['/login', '/register', '/api/auth', '/api/health'];

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 100;
const CLEANUP_INTERVAL = 5 * 60 * 1000;

let lastCleanup = Date.now();

function cleanupRateLimit() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) rateLimitMap.delete(key);
    }
    lastCleanup = now;
  }
}

// TODO: should probably use Redis for this in production
// but this works for now
function isRateLimited(identifier: string, max: number = RATE_LIMIT_MAX): boolean {
  cleanupRateLimit();
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (record.count >= max) return true;
  record.count++;
  return false;
}

function getSecurityHeaders() {
  const isDev = process.env.NODE_ENV !== 'production';
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'Content-Security-Policy': [
      "default-src 'self'",
      isDev
        ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
        : "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' ws://localhost:* ws://127.0.0.1:* wss://localhost:*",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  };
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isApiRoute = pathname.startsWith('/api/');
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  const identifier = req.auth?.user?.id
    || req.cookies.get('next-auth.session-token')?.value
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || '127.0.0.1';

  const isAuthRoute = pathname.startsWith('/api/auth/');
  if (!isAuthRoute) {
    const limit = RATE_LIMIT_MAX;
    if (isRateLimited(identifier, limit)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  }

  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
  }

  if (req.auth && isPublic && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
  }

  const response = NextResponse.next();
  const headers = getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  if (isApiRoute && isStateChanging && !isAuthRoute) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');

    if (!origin) {
      return NextResponse.json({ error: 'Missing origin header' }, { status: 403 });
    }

    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid origin header' }, { status: 403 });
    }
  }

  return response;
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)'],
};
