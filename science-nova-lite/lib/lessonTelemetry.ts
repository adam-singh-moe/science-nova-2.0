"use client"

import { supabase } from '@/lib/supabase'

export async function postLessonEvent(input: {
  lessonId: string
  blockId?: string
  toolKind?: string
  eventType: string
  data?: any
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return
    await fetch('/api/lesson-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(input),
      keepalive: true,
    })
  } catch {}
}

export function startLessonHeartbeat(lessonId: string) {
  let alive = true
  const tick = async () => {
    if (!alive) return
    await postLessonEvent({ lessonId, eventType: 'lesson_heartbeat', data: { sec: 60 } })
  }
  const id = setInterval(tick, 60000)
  return () => { alive = false; clearInterval(id) }
}
