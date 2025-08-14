import Link from "next/link"
import { VantaBackground } from "@/components/vanta-background"
import { cookies, headers } from "next/headers"

async function fetchLessonsByGrade(grade?: number) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const params: Record<string,string> = { status: 'published', limit: '50' }
  if (grade) params.grade = String(grade)
  const qs = new URLSearchParams(params)
  const res = await fetch(`${base}/api/lessons?${qs.toString()}`, { cache: 'no-store' })
  const json = await res.json()
  return Array.isArray(json.lessons) ? json.lessons : []
}

export default async function MyGradeLessons() {
  const cookieStore = await cookies()
  const gradeCookie = cookieStore.get('sn-grade')?.value
  const grade = gradeCookie ? Number(gradeCookie) : undefined
  const lessons = await fetchLessonsByGrade(grade)
  return (
    <VantaBackground effect="halo">
      <main className="min-h-screen py-12">
        <div className="max-w-5xl mx-auto bg-white/75 backdrop-blur rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">My Grade Lessons {grade? `(Grade ${grade})`: ''}</h1>
            <Link href="/profile" className="text-sm underline">Change grade</Link>
          </div>
          {lessons.length===0 ? (
            <div className="text-gray-600">No published lessons for your grade yet.</div>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-4">
              {lessons.map((l:any) => (
                <li key={l.id} className="rounded-lg border bg-white/85 p-4">
                  <div className="text-lg font-semibold mb-1">{l.title}</div>
                  {l.topic && <div className="text-sm text-gray-600 mb-2">{l.topic}</div>}
                  <div className="text-xs text-gray-500 mb-3">Grade {l.grade_level ?? '-'}</div>
                  <Link href={`/lessons/${l.id}`} className="inline-block px-3 py-1 border rounded">Open</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </VantaBackground>
  )
}
