"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { RoleGuard } from "@/components/layout/role-guard"
import { useAuth } from "@/contexts/auth-context"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  Cell,
} from "recharts"
import { BarChart2, BookOpen, CircleDollarSign, LineChart, Plus, Rocket } from "lucide-react"

type Lesson = { id: string; title: string; status: "draft" | "published"; updated_at: string; grade_level: number | null }

export default function AdminHome() {
  const { session } = useAuth()
  const [recent, setRecent] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)

  // Mock analytics (can be replaced with API later)
  const stats = useMemo(
    () => ([
      { label: "Active Students", value: 824, delta: +6.2, icon: Rocket },
      { label: "Avg Quiz Score", value: 78, delta: +2.1, suffix: "%", icon: LineChart },
      { label: "Lessons Viewed", value: 4212, delta: +8.3, icon: BookOpen },
      { label: "Engagement", value: 38, delta: -1.4, suffix: "%", icon: BarChart2 },
    ]),
    []
  )

  const engagementData = useMemo(
    () => [
      { day: "Mon", views: 420, quizzes: 90 },
      { day: "Tue", views: 520, quizzes: 110 },
      { day: "Wed", views: 480, quizzes: 100 },
      { day: "Thu", views: 610, quizzes: 140 },
      { day: "Fri", views: 560, quizzes: 120 },
      { day: "Sat", views: 390, quizzes: 70 },
      { day: "Sun", views: 430, quizzes: 85 },
    ],
    []
  )

  const topicData = useMemo(
    () => [
      { name: "Biology", value: 32, color: "#60a5fa" },
      { name: "Physics", value: 26, color: "#a78bfa" },
      { name: "Chemistry", value: 22, color: "#34d399" },
      { name: "Earth Sci.", value: 20, color: "#f59e0b" },
    ],
    []
  )

  useEffect(() => {
    if (!session) return
    const run = async () => {
      try {
        setLoading(true)
        const token = session.access_token
        const res = await fetch(`/api/lessons?limit=5&offset=0&status=published`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const res2 = await fetch(`/api/lessons?limit=5&offset=0&status=draft`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const p = await res.json()
        const d = await res2.json()
        const items: Lesson[] = [
          ...(p.lessons || []).map((l: any) => ({
            id: l.id,
            title: l.title || "Untitled Lesson",
            status: "published" as const,
            updated_at: l.updated_at,
            grade_level: l.grade_level ?? null,
          })),
          ...(d.lessons || []).map((l: any) => ({
            id: l.id,
            title: l.title || "Untitled Lesson",
            status: "draft" as const,
            updated_at: l.updated_at,
            grade_level: l.grade_level ?? null,
          })),
        ]
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 8)
        setRecent(items)
      } catch {
        // fall back to placeholders if API fails
        setRecent([
          { id: "m1", title: "Exploring Cells", status: "published", updated_at: new Date().toISOString(), grade_level: 4 },
          { id: "m2", title: "States of Matter", status: "draft", updated_at: new Date().toISOString(), grade_level: 3 },
        ])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [session])

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-sky-50 via-violet-50 to-fuchsia-50"
      style={{
        backgroundImage:
          "radial-gradient(40rem 40rem at -10% -10%, rgba(59,130,246,0.18), transparent), radial-gradient(36rem 36rem at 120% 10%, rgba(168,85,247,0.16), transparent)",
      }}
    >
      <RoleGuard allowed={["TEACHER", "ADMIN", "DEVELOPER"]}>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          {/* Admin mini-nav */}
      <div className="sticky top-0 z-10 mb-6 rounded-2xl border bg-white/70 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-sky-500/10 px-3 py-2 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:from-indigo-500/15 hover:to-sky-500/15"
              >
                <LineChart className="h-4 w-4" /> Dashboard
              </Link>
              <Link
                href="/admin/lessons/builder"
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" /> New Lesson
              </Link>
              <Link
        href="/admin/lessons/saved"
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"
              >
                <BarChart2 className="h-4 w-4" /> Saved Lessons
              </Link>
              <Link
        href="/admin/lessons/published"
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"
              >
                <BookOpen className="h-4 w-4" /> Published Lessons
              </Link>
            </div>
          </div>

          {/* Greeting card */}
          <div className="mb-6 rounded-3xl border bg-gradient-to-r from-indigo-100 via-sky-100 to-fuchsia-100 p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-indigo-900 md:text-3xl">Welcome to your teaching hub</h1>
                <p className="mt-1 max-w-2xl text-sm text-indigo-900/70">
                  Track engagement and jump back into your lessons. Use the quick links above to build or manage.
                </p>
              </div>
              <Link
                href="/admin/lessons/builder"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-500 px-4 py-2 text-white shadow hover:brightness-105"
              >
                <Plus className="h-4 w-4" /> Create Lesson
              </Link>
            </div>
          </div>

          {/* Stats */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border bg-white/70 p-4 backdrop-blur transition hover:bg-white/80"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">{s.label}</div>
                  {s.icon ? <s.icon className="h-4 w-4 text-indigo-500" /> : null}
                </div>
                <div className="mt-2 flex items-end gap-2">
                  <div className="text-2xl font-semibold">
                    {s.value.toLocaleString()}
                    {s.suffix ? <span className="text-lg font-medium">{s.suffix}</span> : null}
                  </div>
                  <span className={`text-xs ${s.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {s.delta >= 0 ? "+" : ""}
                    {s.delta}%
                  </span>
                </div>
              </div>
            ))}
          </section>

          {/* Charts */}
          <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-white/70 p-4 backdrop-blur md:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Lesson Engagement</h3>
                <span className="text-xs text-gray-500">Last 7 days</span>
              </div>
              <ChartContainer
                config={{ views: { label: "Views", color: "#6366f1" }, quizzes: { label: "Quiz Attempts", color: "#22c55e" } }}
                className="h-64"
              >
                <AreaChart data={engagementData} margin={{ left: 12, right: 12 }}>
                  <defs>
                    <linearGradient id="fillViews" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillQuizzes" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="views" stroke="#6366f1" fill="url(#fillViews)" strokeWidth={2} />
                  <Area type="monotone" dataKey="quizzes" stroke="#22c55e" fill="url(#fillQuizzes)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </div>

            <div className="rounded-2xl border bg-white/70 p-4 backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Topic Focus</h3>
                <span className="text-xs text-gray-500">Distribution</span>
              </div>
              <ChartContainer config={{}} className="h-64">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={topicData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
                    {topicData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </div>
          </section>

          {/* Recent lessons */}
          <section className="mt-6 rounded-2xl border bg-white/70 p-4 backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Recent Lessons</h3>
              <Link href="/admin/lessons/saved" className="text-sm text-indigo-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y">
              {loading && <div className="p-3 text-sm text-gray-500">Loading…</div>}
              {!loading && recent.length === 0 && (
                <div className="p-3 text-sm text-gray-500">No lessons yet. Create your first lesson!</div>
              )}
              {recent.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 rounded-xl">
                  <div>
                    <div className="font-medium text-gray-900">{l.title}</div>
                    <div className="text-xs text-gray-500">Grade {l.grade_level ?? "-"} • {new Date(l.updated_at).toLocaleString()}</div>
                  </div>
                  {l.status === "published" ? (
                    <Link href={`/lessons/${l.id}`} className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Open</Link>
                  ) : (
                    <Link href={`/admin/lessons/builder?id=${l.id}`} className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Edit</Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>
      </RoleGuard>
    </div>
  )
}
