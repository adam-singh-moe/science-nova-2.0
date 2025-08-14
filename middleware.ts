import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple, minimal middleware that avoids compatibility issues
export default function middleware(request: NextRequest) {
  return NextResponse.next()
}

// Only match specific paths to avoid performance issues
export const config = {
  matcher: []  // Empty matcher means middleware won't run - remove this line to enable
}
