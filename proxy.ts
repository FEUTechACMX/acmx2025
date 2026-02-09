import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request)
  const url = request.nextUrl.clone()

  // Protect admin-only routes
  if (
    url.pathname.startsWith('/scanner') ||
    url.pathname.startsWith('/admin')
  ) {
    if (!user) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Check admin role from user metadata
    const role = user.user_metadata?.role
    if (role !== 'ADMIN') {
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Protect authenticated routes
  if (url.pathname.startsWith('/settings')) {
    if (!user) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
