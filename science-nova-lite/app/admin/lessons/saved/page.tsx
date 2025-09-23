"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { RoleGuard } from "@/components/layout/role-guard"
import { useAuth } from "@/contexts/auth-context"
import { Plus, Search, PenSquare, Trash2, BarChart3, BookOpen } from "lucide-react"
import { useConfirm } from "@/hooks/use-confirm"
import { toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

export default function SavedLessonsPage() {
  const { session } = useAuth()
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [offset, setOffset] = useState(0)
  const limit = 10
  const confirmDialog = useConfirm()

  const fetchDrafts = async () => {
    if (!session) return
    setLoading(true)
    try {
      const token = session.access_token
      const res = await fetch(`/api/lessons?status=draft&search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}`,
        { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      setLessons(json.lessons || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { 
    fetchDrafts() 
  }, [session, search, offset])

  const onDelete = async (id: string) => {
    if (!session) return
    const confirm = await confirmDialog({
      title: "Delete draft?",
      description: "This action cannot be undone.",
      actionText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    })
    if (!confirm) return
    const token = session.access_token
    const prev = lessons
    // Optimistic update
    setLessons(prev.filter(l => l.id !== id))
    const res = await fetch('/api/lessons', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id }) })
    const json = await res.json()
    if (!res.ok) {
      setLessons(prev) // revert optimistic
      toast({ title: 'Delete failed', description: json?.error || 'Could not delete the draft.', variant: 'destructive' })
      return
    }
    const t = toast({
      title: 'Draft deleted',
      description: 'The draft was removed.',
      variant: 'success',
      action: (
        <ToastAction altText="Undo" onClick={() => {
          setLessons(prev)
          t.dismiss()
          toast({ title: 'Delete undone', description: 'The draft was restored locally.', variant: 'info' })
        }}>Undo</ToastAction>
      )
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-violet-50 to-fuchsia-50">
      <RoleGuard allowed={["TEACHER","ADMIN","DEVELOPER"]}>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          {/* Navigation */}
          <div className="sticky top-0 z-10 mb-6 rounded-2xl border bg-white/70 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 flex flex-wrap items-center gap-2 md:gap-3">
            <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"><BarChart3 className="h-4 w-4"/>Dashboard</Link>
            <Link href="/admin/lessons/saved" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-sky-500/10 px-3 py-2 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:from-indigo-500/15 hover:to-sky-500/15"><BookOpen className="h-4 w-4"/>Textbooks & Curriculum</Link>
          </div>

          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">Saved Lessons</h1>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e)=>{ setOffset(0); setSearch(e.target.value) }} placeholder="Search title/topic" className="h-9 w-64 rounded-xl border px-8 text-sm shadow-sm placeholder:text-gray-400" />
              </div>
              <Link href="/admin/lessons/builder" className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-medium text-white shadow hover:brightness-105"><Plus className="h-4 w-4"/> New</Link>
            </div>
          </div>

          {/* List */}
          <div className="rounded-2xl border bg-white/70 backdrop-blur">
            {loading && <div className="p-4 text-sm text-gray-500">Loading…</div>}
            {!loading && lessons.length===0 && <div className="p-4 text-sm text-gray-500">No saved lessons.</div>}
            <div className="divide-y">
              {lessons.map((l)=> (
                <div key={l.id} className="flex items-center justify-between gap-3 p-4 hover:bg-white/80">
                  <div>
                    <div className="font-medium text-gray-900">{l.title || 'Untitled Lesson'}</div>
                    <div className="text-xs text-gray-500">Grade {l.grade_level ?? '-'} • {new Date(l.updated_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/lessons/builder?id=${l.id}`} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"><PenSquare className="h-4 w-4"/> Edit</Link>
                    <button onClick={()=>onDelete(l.id)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4"/> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pager */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button disabled={offset===0} onClick={()=>setOffset(Math.max(0, offset - limit))} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Prev</button>
            <button onClick={()=>setOffset(offset + limit)} className="rounded-lg border px-3 py-1.5 text-sm">Next</button>
          </div>
        </main>
      </RoleGuard>
    </div>
  )
}
