import { supabase } from '@/lib/supabase'
import { stableHash } from '@/lib/hash'

export interface DiscoveryFactMeta {
  id: string
  topic_id: string
  text: string
}

export async function fetchDiscoveryTopicCandidateIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('topic_content_entries')
    .select('topic_id')
    .eq('category', 'DISCOVERY')
    .eq('status', 'published')
  if (error) return []
  const set = new Set<string>()
  data.forEach(d => set.add(d.topic_id))
  return Array.from(set)
}

export function pickDeterministicDiscovery(topics: string[], userId: string, date: string) {
  if (topics.length === 0) return null
  const h = stableHash(`${userId}:DISCOVERY:${date}`)
  return topics[h % topics.length]
}

export async function fetchFactsForTopic(topicId: string): Promise<DiscoveryFactMeta[]> {
  const { data } = await supabase
    .from('topic_content_entries')
    .select('id, topic_id, payload')
    .eq('topic_id', topicId)
    .eq('category', 'DISCOVERY')
    .eq('status', 'published')
  return (data || []).map((r: any) => ({ id: r.id, topic_id: r.topic_id, text: r.payload?.text || '' }))
}
