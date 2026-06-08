// `cf_role` — a small, non-sensitive routing cookie set on the FRONTEND domain so the
// Next.js edge middleware can do role-based routing.
//
// In production the API (Render) and frontend (Vercel) are different sites, so the
// backend's httpOnly auth cookie lives on the API domain and the edge middleware can
// never read it. This cookie carries ONLY the user's role for UX routing — it is not a
// credential and authorizes nothing. Every API call is still verified server-side
// against the real JWT (see backend/src/middleware/auth.ts).
const ROLE_COOKIE = 'cf_role';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days, matching the refresh-token lifetime

export function setRoleCookie(role: string): void {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${ROLE_COOKIE}=${role}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${secure}`;
}

export function clearRoleCookie(): void {
  document.cookie = `${ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
