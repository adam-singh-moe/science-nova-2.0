"use client"

import { useEffect, useState } from "react"
import { RoleGuard } from "@/components/layout/role-guard"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

type Lesson = { id: string; title: string; topic: string | null; grade_level: number | null; status: 'draft'|'published'; updated_at: string }

export default function AdminLessons() {
  const { session } = useAuth()
  const [drafts, setDrafts] = useState<Lesson[]>([])
  const [published, setPublished] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [offset, setOffset] = useState(0)
  const limit = 10

  const fetchLessons = async () => {
    if (!session) return
    setLoading(true)
    try {
      const token = session.access_token
      const qs = (status: string) => `/api/lessons?status=${status}&search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}`
      const [dRes, pRes] = await Promise.all([
        fetch(qs('draft'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(qs('published'), { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const dJson = await dRes.json()
      const pJson = await pRes.json()
      setDrafts(dJson.lessons || [])
      setPublished(pJson.lessons || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLessons() }, [session, search, offset])

  const onDelete = async (id: string) => {
    if (!session) return
    if (!confirm('Delete this lesson?')) return
    const token = session.access_token
    const res = await fetch('/api/lessons', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id }) })
    const json = await res.json()
    if (!res.ok) { alert(json?.error || 'Delete failed'); return }
    fetchLessons()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleGuard allowed={["TEACHER", "ADMIN", "DEVELOPER"]}>
        <main className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Lessons</h1>
            <div className="flex items-center gap-2">
              <input className="border rounded px-2 py-1" placeholder="Search title/topic" value={search} onChange={(e)=>{ setOffset(0); setSearch(e.target.value) }} />
              <Link href="/admin/lessons/builder" className="px-3 py-2 rounded border bg-white">+ New lesson</Link>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <section>
              <h2 className="font-semibold mb-2">Drafts</h2>
              <div className="rounded-lg border bg-white divide-y">
                {drafts.length===0 && <div className="p-4 text-sm text-gray-500">No drafts</div>}
                {drafts.map(l => (
                  <div key={l.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{l.title || 'Untitled Lesson'}</div>
                      <div className="text-xs text-gray-500">Grade {l.grade_level ?? '-'} • {new Date(l.updated_at).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/lessons/builder?id=${l.id}`} className="px-2 py-1 rounded border bg-white">Edit</Link>
                      <button onClick={()=>onDelete(l.id)} className="px-2 py-1 rounded border text-red-600">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h2 className="font-semibold mb-2">Published</h2>
              <div className="rounded-lg border bg-white divide-y">
                {published.length===0 && <div className="p-4 text-sm text-gray-500">No published lessons</div>}
                {published.map(l => (
                  <div key={l.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{l.title || 'Untitled Lesson'}</div>
                      <div className="text-xs text-gray-500">Grade {l.grade_level ?? '-'} • {new Date(l.updated_at).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/lessons/${l.id}`} target="_blank" className="px-2 py-1 rounded border bg-white">Open</Link>
                      <Link href={`/admin/lessons/builder?id=${l.id}`} className="px-2 py-1 rounded border bg-white">Edit</Link>
                      <button onClick={()=>onDelete(l.id)} className="px-2 py-1 rounded border text-red-600">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="mt-4 flex items-center justify-between">
            {loading ? <div className="text-sm text-gray-500">Loading…</div> : <div />}
            <div className="flex gap-2">
              <button disabled={offset===0} onClick={()=>setOffset(Math.max(0, offset - limit))} className="px-2 py-1 border rounded">Prev</button>
              <button onClick={()=>setOffset(offset + limit)} className="px-2 py-1 border rounded">Next</button>
            </div>
          </div>
        </main>
      </RoleGuard>
    </div>
  )
}
