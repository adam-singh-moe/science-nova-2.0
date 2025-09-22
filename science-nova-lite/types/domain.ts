// Central domain types to keep role/profile shapes consistent across app & server utilities.
// Add new roles here and they propagate everywhere.
export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'DEVELOPER'

export interface Profile {
  id: string
  full_name: string | null
  role: Role | null
  grade_level: number | null
  learning_preference: string | null
  created_at: string
  updated_at: string
  email: string | null
}

export interface LessonSummary {
  id: string
  title: string
  status: 'draft' | 'published'
  updated_at: string
  grade_level: number | null
}

export const ALL_ROLES: Role[] = ['STUDENT', 'TEACHER', 'ADMIN', 'DEVELOPER']
