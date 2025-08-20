"use client"

import { useEffect } from 'react'
import { postLessonEvent, startLessonHeartbeat } from '@/lib/lessonTelemetry'

export default function LessonActivityClient({ lessonId }: { lessonId: string }) {
  useEffect(() => {
    if (!lessonId) return
    postLessonEvent({ lessonId, eventType: 'lesson_view', toolKind: 'LESSON' })
    const stop = startLessonHeartbeat(lessonId)
    return () => stop()
  }, [lessonId])
  return null
}
