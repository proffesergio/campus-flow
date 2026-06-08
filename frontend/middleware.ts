import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/login', '/register', '/legal', '/offline', '/_next', '/favicon.ico',
  '/manifest.webmanifest', '/icon.svg', '/sw.js', '/api',
];

type Role = 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student' | 'finance';

const ROLE_HOME: Record<Role, string> = {
  super_admin: '/dashboard',
  school_admin: '/dashboard',
  teacher: '/dashboard/teacher',
  student: '/student',
  finance: '/dashboard/finance',
  parent: '/parent',
};

function roleHome(role: Role): string {
  return ROLE_HOME[role] ?? '/dashboard';
}

function isAllowed(role: Role, pathname: string): boolean {
  if (role === 'super_admin') return true;

  if (pathname.startsWith('/student')) return role === 'student';
  if (pathname.startsWith('/parent')) return role === 'parent';

  if (pathname.startsWith('/dashboard')) {
    if (role === 'student' || role === 'parent') return false;
    if (role === 'finance') return pathname.startsWith('/dashboard/finance');
    if (role === 'teacher') {
      // Teachers handle academics but not admin-only areas.
      if (pathname.startsWith('/dashboard/settings')) return false;
      if (pathname.startsWith('/dashboard/finance')) return false;
      return true;
    }
    // school_admin
    return true;
  }

  return true;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass through public and static paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Role for UX routing comes from the `cf_role` cookie set on THIS (frontend) domain
  // at login. The real auth credential is an httpOnly cookie on the API's own domain,
  // which this edge middleware cannot read in a split frontend/backend deployment.
  // This is routing only — security is enforced server-side: every API request verifies
  // the JWT (see backend/src/middleware/auth.ts).
  const role = req.cookies.get('cf_role')?.value as Role | undefined;

  if (!role) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Role-based routing ─────────────────────────────────────────────────────
  // Teachers/finance landing on the bare dashboard go to their own home.
  if (pathname === '/dashboard' && (role === 'teacher' || role === 'finance')) {
    return NextResponse.redirect(new URL(roleHome(role), req.url));
  }
  if (!isAllowed(role, pathname)) {
    return NextResponse.redirect(new URL(roleHome(role), req.url));
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
