"use client"

import Link from "next/link"
import { VantaBackground } from "@/components/vanta-background"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useMemo, useState } from "react"
import { CloudSun, Atom, Globe2, Map, Leaf, Orbit, Filter as FilterIcon, Search } from "lucide-react"

type Lesson = {
  id: string
  title: string
  topic?: string | null
  grade_level?: number | null
  updated_at?: string | null
  layout_json?: any
  group?: string | null
}

function groupMeta(group?: string | null) {
  switch ((group || '').toLowerCase()) {
    case 'meteorology':
      return { label: 'Meteorology', text: 'text-sky-700', chipBg: 'bg-sky-50 text-sky-700 border-sky-200', icon: CloudSun, iconColor: 'text-sky-600' }
    case 'physics':
      return { label: 'Physics', text: 'text-violet-700', chipBg: 'bg-violet-50 text-violet-700 border-violet-200', icon: Atom, iconColor: 'text-violet-600' }
    case 'chemistry':
      return { label: 'Chemistry', text: 'text-rose-700', chipBg: 'bg-rose-50 text-rose-700 border-rose-200', icon: Atom, iconColor: 'text-rose-600' }
    case 'geography':
      return { label: 'Geography', text: 'text-emerald-700', chipBg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Globe2, iconColor: 'text-emerald-600' }
    case 'biology':
      return { label: 'Biology', text: 'text-green-700', chipBg: 'bg-green-50 text-green-700 border-green-200', icon: Leaf, iconColor: 'text-green-600' }
    case 'astronomy':
      return { label: 'Astronomy', text: 'text-indigo-700', chipBg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Orbit, iconColor: 'text-indigo-600' }
    default:
      return { label: 'General', text: 'text-gray-800', chipBg: 'bg-gray-50 text-gray-700 border-gray-200', icon: Map, iconColor: 'text-gray-500' }
  }
}

export default function LessonsIndex() {
  const { profile } = useAuth()
  const [q, setQ] = useState("")
  const [group, setGroup] = useState("")
  const [sort, setSort] = useState<'date'|'difficulty'>('date')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)

  const grade = useMemo(() => (profile?.grade_level ? Number(profile.grade_level) : undefined), [profile?.grade_level])

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true)
      try {
        const qs = new URLSearchParams({ status: 'published', limit: '50', ...(grade? { grade: String(grade) }: {}), ...(q? { search: q }: {}), ...(group? { group }: {}), ...(sort? { sort }: {}) })
        const res = await fetch(`/api/lessons?${qs.toString()}`, { cache: 'no-store' })
        const json = await res.json()
        setLessons(Array.isArray(json.lessons) ? json.lessons : [])
      } finally {
        setLoading(false)
      }
    }
    fetchLessons()
  }, [grade, q, group, sort])

  return (
    <VantaBackground effect="globe">
      <main className="min-h-screen py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white/80 backdrop-blur rounded-2xl border shadow-[0_0_20px_rgba(56,189,248,0.25)] p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-1 bg-gradient-to-r from-sky-500 to-emerald-500 text-transparent bg-clip-text">Lessons</h1>
                {grade ? (
                  <p className="text-sm text-gray-600">Showing lessons for <span className="font-medium">Grade {grade}</span>.</p>
                ) : (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">Set your grade in your <Link href="/profile" className="underline">profile</Link> to see personalized lessons.</p>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-2 bg-white rounded-full border px-3 py-2 shadow-sm">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search lessons..." className="outline-none w-56" />
                </div>
                <select value={group} onChange={(e)=>setGroup(e.target.value)} className="border rounded-full px-3 py-2">
                  <option value="">All Topics</option>
                  <option value="meteorology">Meteorology</option>
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="geography">Geography</option>
                  <option value="biology">Biology</option>
                  <option value="astronomy">Astronomy</option>
                </select>
                <select value={sort} onChange={(e)=>setSort(e.target.value as any)} className="border rounded-full px-3 py-2">
                  <option value="date">Newest</option>
                  <option value="difficulty">Difficulty</option>
                </select>
                <span className="hidden sm:inline-flex items-center gap-2 text-sm text-gray-500"><FilterIcon className="h-4 w-4"/> Filter</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white/75 backdrop-blur rounded-2xl border p-8 text-gray-600">Loading…</div>
          ) : lessons.length===0 ? (
            <div className="bg-white/75 backdrop-blur rounded-2xl border p-8 text-gray-600">No lessons found.</div>
          ) : (
            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map((l) => {
                const meta = groupMeta(l.group)
                const Icon = meta.icon
                const difficulty = l.layout_json?.meta?.difficulty
                return (
                  <li key={l.id} className="group relative rounded-2xl border bg-white/85 backdrop-blur p-5 shadow transition hover:shadow-[0_0_24px_rgba(56,189,248,0.35)] hover:-translate-y-0.5">
                    <Link href={`/lessons/${l.id}`} className="absolute inset-0" aria-label={`Open ${l.title || 'lesson'}`} />
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${meta.iconColor}`} />
                        <h3 className={`text-lg font-semibold tracking-tight ${meta.text}`}>{l.title || 'Untitled Lesson'}</h3>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700">Grade {l.grade_level ?? '-'}</span>
                    </div>
                    {l.topic && <div className="text-sm text-gray-700 mb-3 line-clamp-2">{l.topic}</div>}
                    <div className="flex items-center gap-2 mb-2">
                      {l.group && <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.chipBg}`}>{meta.label}</span>}
                      {difficulty && (
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700">
                          {difficulty===1? 'Easy' : difficulty===2? 'Moderate' : 'Challenging'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">Updated {l.updated_at ? new Date(l.updated_at).toLocaleDateString() : ''}</div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
    </VantaBackground>
  )
}
