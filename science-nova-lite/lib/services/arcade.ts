import { supabase } from '@/lib/supabase'
import { stableHash } from '@/lib/hash'

interface ArcadeEntryMeta {
  id: string
  subtype: string
  title: string | null
  topic_id: string
}

export async function fetchArcadeTopicCandidateIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('topic_content_entries')
    .select('topic_id')
    .eq('category', 'ARCADE')
    .eq('status', 'published')
  if (error) return []
  const set = new Set<string>()
  data.forEach(d => set.add(d.topic_id))
  return Array.from(set)
}

export function pickDeterministicTopic(topics: string[], userId: string, date: string, category: 'ARCADE' | 'DISCOVERY') {
  if (topics.length === 0) return null
  const hash = stableHash(`${userId}:${category}:${date}`)
  return topics[hash % topics.length]
}

export async function fetchArcadeEntriesForTopic(topicId: string): Promise<ArcadeEntryMeta[]> {
  const { data } = await supabase
    .from('topic_content_entries')
    .select('id, subtype, title, topic_id')
    .eq('topic_id', topicId)
    .eq('category', 'ARCADE')
    .eq('status', 'published')
  return (data as ArcadeEntryMeta[]) || []
}
