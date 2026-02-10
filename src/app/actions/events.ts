'use server'

import { getEventsBySemester } from '@/lib/events'
import type { EventWithCount } from '@/types/events'

export async function getEventsBySemesterAction(
  semester: string
): Promise<EventWithCount[]> {
  return getEventsBySemester(semester)
}
