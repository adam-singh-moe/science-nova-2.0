import { getServiceClient } from '@/lib/server-supabase'

export async function assertWithinAiRateLimit(userId: string, endpoint: string, limitPerMinute = 8) {
  const svc = getServiceClient(); if (!svc) throw new Error('Service client unavailable')
  const { data, error } = await svc.rpc('increment_ai_generation_usage', { p_user_id: userId, p_endpoint: endpoint, p_limit: limitPerMinute, p_window_seconds: 60 })
  if (error) throw new Error('Rate limit check failed: ' + error.message)
  if (data !== true) throw new Error('Rate limit exceeded for AI generation; please wait a minute and try again.')
}
