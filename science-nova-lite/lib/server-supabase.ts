import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export function getUserFromAuthHeader(authHeader?: string | null): { userId: string | null } {
  try {
    if (!authHeader) return { userId: null }
    const token = authHeader.replace('Bearer ', '')
    const payload = token.split('.')[1]
    if (!payload) return { userId: null }
    const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'))
    return { userId: json.sub || null }
  } catch {
    return { userId: null }
  }
}

export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'DEVELOPER'

export async function getProfileRole(userId: string): Promise<Role | null> {
  const svc = getServiceClient()
  if (!svc) return null
  const { data } = await svc.from('profiles').select('role').eq('id', userId).single()
  return (data?.role as Role) ?? null
}
