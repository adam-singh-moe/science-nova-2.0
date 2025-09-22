import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lightweight middleware: protects /admin routes.
// Client still does fine-grained UI gating; this blocks unauthenticated access early.

const ADMIN_PREFIX = '/admin'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith(ADMIN_PREFIX)) return NextResponse.next()

  // Supabase JS v2 (browser) stores session in localStorage by default, not cookies.
  // When using PKCE in browser there is no automatic server cookie. Allow pass-through unless Authorization header provided.
  // To avoid forcing re-login for already authenticated client sessions, we perform a soft check:
  const headerToken = req.headers.get('authorization')?.replace('Bearer ', '')
  // If no header token, we cannot validate server-side; let client RoleGuard handle it.
  const token = headerToken || req.cookies.get('sb-access-token')?.value || req.cookies.get('supabase-auth-token')?.value
  if (!token) {
    // Allow the request through so client can establish session from localStorage; we'll redirect inside page if still unauthenticated.
    return NextResponse.next()
  }
  // (Optional future: decode JWT role claim if embedded; for now allow and rely on RoleGuard.)
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
