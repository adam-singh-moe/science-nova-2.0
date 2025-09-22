// Central app constants (routes, cache keys, etc.)
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  PROFILE: '/profile',
  LESSONS: '/lessons',
  ADMIN: '/admin',
  ADMIN_LESSON_BUILDER: '/admin/lessons/builder',
  ADMIN_LESSONS_SAVED: '/admin/lessons/saved',
  ADMIN_LESSONS_PUBLISHED: '/admin/lessons/published',
  ADMIN_DOCUMENTS: '/admin/documents',
  ADMIN_STUDENTS: '/admin/students',
}

export const CACHE_KEYS = {
  ADMIN_METRICS: 'admin:metrics',
  TOPIC_CONTENT: (topicId: string, userId: string) => `topic:${topicId}:user:${userId}:content`,
}

export const FEATURE_FLAGS = {
  ENABLE_AI_CHAT: true,
  ENABLE_EXPERIMENTAL_LESSON_BUILDER: true,
}
