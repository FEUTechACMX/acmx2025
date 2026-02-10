import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type SafeUser = {
  id: string
  email: string
  name: string
  studentId: string
  role: 'ADMIN' | 'JUNIOR_OFFICER' | 'MEMBER' | 'EXECUTIVES'
  points: number
}

/**
 * Get the current authenticated user from Supabase Auth.
 * For use in Server Components, Server Actions, and Route Handlers.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Map Supabase user to our app's user shape using user_metadata
  const meta = user.user_metadata || {}
  return {
    id: user.id,
    email: user.email || '',
    name: [meta.firstName, meta.middleName, meta.lastName, meta.suffix].filter(Boolean).join(' '),
    studentId: meta.studentId || '',
    role: meta.role || 'MEMBER',
    points: meta.points || 0,
  }
}

/**
 * Require authentication. Redirects to login if not authenticated.
 * For use in protected Server Component pages.
 */
export async function requireAuth(): Promise<SafeUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/')
  return user
}

/**
 * Require admin role. Redirects to home if not admin.
 */
export async function requireAdmin(): Promise<SafeUser> {
  const user = await requireAuth()
  if (user.role !== 'ADMIN') redirect('/')
  return user
}
