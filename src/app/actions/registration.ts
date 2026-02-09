'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export type RegistrationResult = {
  success: boolean
  error?: string
  checkoutUrl?: string
}

export async function registerForEvent(formData: FormData): Promise<RegistrationResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const eventId = formData.get('eventId') as string
  const fullName = formData.get('fullName') as string
  const studentNumber = formData.get('studentNumber') as string
  const schoolEmail = formData.get('schoolEmail') as string
  const contactNumber = formData.get('contactNumber') as string
  const facebookLink = formData.get('facebookLink') as string
  const yearLevel = formData.get('yearLevel') as string
  const section = formData.get('section') as string
  const professor = formData.get('professor') as string
  const degreeProgram = formData.get('degreeProgram') as string

  try {
    const userId = user?.id || null
    if (userId) {
      const existing = await prisma.registration.findFirst({
        where: { eventId, userId },
      })
      if (existing) {
        return { success: false, error: 'You are already registered for this event.' }
      }
    } else {
      const existing = await prisma.registration.findFirst({
        where: {
          eventId,
          OR: [{ schoolEmail }, { studentNumber }],
        },
      })
      if (existing) {
        return { success: false, error: 'This email/student number is already registered for this event.' }
      }
    }

    const registration = await prisma.registration.create({
      data: {
        userId,
        eventId,
        fullName,
        studentNumber,
        schoolEmail,
        contactNumber,
        facebookLink,
        yearLevel: parseInt(yearLevel, 10),
        section,
        professor,
        degreeProgram,
        role: userId ? 'MEMBER' : 'NON_MEMBER',
      },
    })

    if (!userId) {
      const response = await fetch('https://api.paymongo.com/v1/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa((process.env.PAYMONGO_SECRET_KEY || '') + ':')}`,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: 10000,
              currency: 'PHP',
              type: 'gcash',
              redirect: {
                success: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?registrationId=${registration.id}`,
                failed: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-failed?registrationId=${registration.id}`,
              },
              metadata: {
                registrationId: registration.id,
                fullName,
                schoolEmail,
              },
            },
          },
        }),
      })

      const data = await response.json()
      const checkoutUrl = data?.data?.attributes?.redirect?.checkout_url
      if (checkoutUrl) {
        return { success: true, checkoutUrl }
      }
      return { success: false, error: 'Payment initialization failed.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Failed to register. Please try again.' }
  }
}
