import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/server-supabase'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const topicId = params.id
    const url = new URL(req.url)
    const exclude = url.searchParams.get('exclude') || ''
    const limit = Math.min(10, Number(url.searchParams.get('limit') || 4))
    const svc = getServiceClient()
    if (!svc) return NextResponse.json({ error: 'Server unavailable' }, { status: 500 })
    const q = svc.from('topic_content_entries')
      .select('id,title,subtype')
      .eq('topic_id', topicId)
      .eq('status','published')
      .order('updated_at', { ascending: false })
      .limit(limit)
    if (exclude) q.neq('id', exclude)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ items: data || [] })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
