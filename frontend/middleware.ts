import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/_next', '/favicon.ico', '/api'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass through public and static paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get('access_token')?.value;

  if (!accessToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Inject school slug from subdomain into a header for server components
  const host = req.headers.get('host') ?? '';
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'campusflow.app';
  const slug = host.endsWith(`.${appDomain}`) ? host.replace(`.${appDomain}`, '') : null;

  const response = NextResponse.next();
  if (slug) response.headers.set('x-school-slug', slug);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
