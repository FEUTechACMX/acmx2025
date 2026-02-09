'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type AuthResult = {
  success: boolean
  error?: string
}

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signupAction(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const studentId = formData.get('studentId') as string
  const firstName = formData.get('firstName') as string
  const middleName = (formData.get('middleName') as string) || ''
  const lastName = formData.get('lastName') as string
  const suffix = (formData.get('suffix') as string) || ''
  const yearLevel = parseInt((formData.get('yearLevel') as string) || '1', 10)
  const degreeProgram = (formData.get('degreeProgram') as string) || ''
  const contactNumber = (formData.get('contactNumber') as string) || ''
  const facebookLink = (formData.get('facebookLink') as string) || ''
  const discordName = (formData.get('discordName') as string) || ''

  if (!email || !password || !studentId || !firstName || !lastName) {
    return { success: false, error: 'Required fields are missing' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        studentId,
        firstName,
        middleName,
        lastName,
        suffix,
        yearLevel,
        degreeProgram,
        contactNumber,
        facebookLink,
        discordName,
        role: 'MEMBER',
        points: 0,
      },
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
