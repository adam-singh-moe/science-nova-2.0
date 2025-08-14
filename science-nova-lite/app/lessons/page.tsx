import Link from "next/link"
import { VantaBackground } from "@/components/vanta-background"
import { headers } from "next/headers"

async function fetchLessons(grade?: number, q?: string, sort?: 'date'|'difficulty', group?: string) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const qs = new URLSearchParams({ status: 'published', limit: '50', ...(grade? { grade: String(grade) }: {}), ...(q? { search: q }: {}), ...(group? { group }: {}), ...(sort? { sort }: {}) })
  const res = await fetch(`${base}/api/lessons?${qs.toString()}`, { cache: 'no-store' })
  const json = await res.json()
  return Array.isArray(json.lessons) ? json.lessons : []
}

export default async function LessonsIndex({ searchParams }: { searchParams?: { [k: string]: string | string[] | undefined } }) {
  const grade = typeof searchParams?.grade === 'string' && searchParams.grade ? Number(searchParams.grade) : undefined
  const q = typeof searchParams?.q === 'string' ? searchParams.q : undefined
  const sort = typeof searchParams?.sort === 'string' && (searchParams.sort==='date' || searchParams.sort==='difficulty') ? searchParams.sort : undefined
  const group = typeof searchParams?.group === 'string' ? searchParams.group : undefined
  const lessons = await fetchLessons(grade, q, sort, group)
  return (
    <VantaBackground effect="globe">
      <main className="min-h-screen py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white/80 backdrop-blur rounded-2xl border shadow-[0_0_20px_rgba(56,189,248,0.25)] p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-1 bg-gradient-to-r from-sky-500 to-emerald-500 text-transparent bg-clip-text">Lessons</h1>
                <p className="text-sm text-gray-600">Explore published lessons. Use search and filters to find what you need.</p>
              </div>
              <div className="flex gap-2 items-center">
                <form action="/lessons" method="get" className="flex gap-2">
                  <input name="q" placeholder="Search lessons..." className="border rounded-full px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-sky-300" />
                  <select name="group" className="border rounded-full px-3 py-2">
                    <option value="">All Topics</option>
                    <option value="meteorology">Meteorology</option>
                    <option value="physics">Physics</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="geography">Geography</option>
                    <option value="biology">Biology</option>
                    <option value="astronomy">Astronomy</option>
                  </select>
                  <select name="sort" className="border rounded-full px-3 py-2">
                    <option value="date">Newest</option>
                    <option value="difficulty">Difficulty</option>
                  </select>
                  <button className="px-4 py-2 rounded-full border bg-white hover:bg-gray-50">Filter</button>
                </form>
              </div>
            </div>
          </div>

          {lessons.length===0 ? (
            <div className="bg-white/75 backdrop-blur rounded-2xl border p-8 text-gray-600">No published lessons yet.</div>
          ) : (
            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map((l:any) => (
                <li key={l.id} className="group rounded-2xl border bg-white/85 backdrop-blur p-5 shadow transition hover:shadow-[0_0_20px_rgba(56,189,248,0.35)]">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold tracking-tight group-hover:text-sky-600">{l.title || 'Untitled Lesson'}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700">Grade {l.grade_level ?? '-'}</span>
                  </div>
                  {l.topic && <div className="text-sm text-gray-600 mb-3">{l.topic}</div>}
                  {l.group && (
                    <div className="text-xs mb-2">
                      <span className="px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700">{String(l.group).charAt(0).toUpperCase()+String(l.group).slice(1)}</span>
                    </div>
                  )}
                  {l.layout_json?.meta?.difficulty && (
                    <div className="text-xs mb-2">
                      <span className="px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700">{l.layout_json.meta.difficulty===1? 'Easy' : l.layout_json.meta.difficulty===2? 'Moderate' : 'Challenging'}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">Updated {l.updated_at ? new Date(l.updated_at).toLocaleDateString() : ''}</div>
                    <Link href={`/lessons/${l.id}`} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white hover:bg-gray-50">
                      Open
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </VantaBackground>
  )
}
