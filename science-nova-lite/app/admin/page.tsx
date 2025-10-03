"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { RoleGuard } from "@/components/layout/role-guard"
import { useAuth } from "@/contexts/auth-context"
import { EngagementChart, TopicChart } from "@/components/admin/dashboard-charts"
import { ArcadeDiscoveryEngagement } from '@/components/admin/arcade-discovery-engagement'
import { DashboardStat } from "@/components/admin/dashboard-stat"
import { BarChart2, BookOpen, CircleDollarSign, LineChart, Plus, Rocket, Eye, Users, TrendingUp, Award, Activity, FileText, BarChart3 } from "lucide-react"

type Lesson = { id: string; title: string; status: "draft" | "published"; updated_at: string; grade_level: number | null }

export default function AdminHome() {
  const { session } = useAuth()
  const [recent, setRecent] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)

  // Live analytics state
  const [stats, setStats] = useState<Array<{ label: string; value: number; delta: number; suffix?: string; icon?: any; description?: string }>>([
    { label: "Active Students", value: 0, delta: 0, icon: Users, description: "Students who engaged with lessons this week" },
    { label: "Average Quiz Score", value: 0, delta: 0, suffix: "%", icon: Award, description: "Mean quiz performance across all attempts" },
    { label: "Lessons Viewed", value: 0, delta: 0, icon: Eye, description: "Total lesson views in the past 7 days" },
    { label: "Student Engagement", value: 0, delta: 0, suffix: "%", icon: Activity, description: "Percentage of registered students who were active" },
  ])
  const [engagementData, setEngagementData] = useState<Array<{ day: string; views: number; quizzes: number }>>([])
  const [topicData, setTopicData] = useState<Array<{ name: string; value: number; color: string }>>([])
  const [contentEngagement, setContentEngagement] = useState<{ topics: any[]; entries: any[] }>({ topics: [], entries: [] })

  useEffect(() => {
    if (!session) return
    const run = async () => {
      try {
        setLoading(true)
        const token = session.access_token
        // Load dashboard metrics
        const m = await fetch(`/api/admin-metrics`, { headers: { Authorization: `Bearer ${token}` } })
        if (m.ok) {
          const js = await m.json()
          const st = js?.stats || {}
          setStats([
            { label: 'Active Students', value: Number(st?.activeStudents?.value || 0), delta: Number(st?.activeStudents?.delta || 0), icon: Users, description: "Students who engaged with lessons this week" },
            { label: 'Average Quiz Score', value: Number(st?.avgQuizScore?.value || 0), delta: Number(st?.avgQuizScore?.delta || 0), suffix: '%', icon: Award, description: "Mean quiz performance across all attempts" },
            { label: 'Lessons Viewed', value: Number(st?.lessonsViewed?.value || 0), delta: Number(st?.lessonsViewed?.delta || 0), icon: Eye, description: "Total lesson views in the past 7 days" },
            { label: 'Student Engagement', value: Number(st?.engagement?.value || 0), delta: Number(st?.engagement?.delta || 0), suffix: '%', icon: Activity, description: "Percentage of registered students who were active" },
          ])
          setEngagementData(Array.isArray(js?.engagementData) ? js.engagementData : [])
          setTopicData(Array.isArray(js?.topicData) ? js.topicData : [])
        }
        const res = await fetch(`/api/lessons?limit=5&offset=0&status=published`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const res2 = await fetch(`/api/lessons?limit=5&offset=0&status=draft`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        // content engagement
        fetch(`/api/admin/content-engagement`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r=>r.json()).then(js=>{ if (js.topics || js.entries) setContentEngagement({ topics: js.topics||[], entries: js.entries||[] }) })
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
          {/* Admin navigation */}
          <div className="sticky top-0 z-10 mb-6 rounded-2xl border bg-white/70 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-lg">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-sky-500/10 px-3 py-2 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:from-indigo-500/15 hover:to-sky-500/15"><BarChart3 className="h-4 w-4"/>Dashboard</Link>
              <Link href="/admin/lessons" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"><BookOpen className="h-4 w-4"/> Lessons Manager</Link>
              <Link href="/admin/documents" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"><FileText className="h-4 w-4"/> Textbooks & Curriculum</Link>
              <Link href="/admin/content" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"><Rocket className="h-4 w-4"/> Content Manager</Link>
              <RoleGuard allowed={["ADMIN", "DEVELOPER"]}>
                <Link href="/admin/topics" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"><BarChart2 className="h-4 w-4"/> Topics Manager</Link>
              </RoleGuard>
              <Link href="/admin/students" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"><Users className="h-4 w-4"/> Students</Link>
              <Link href="/lessons" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"><Eye className="h-4 w-4"/> Student View</Link>
            </div>
          </div>

          {/* Greeting card */}
          <div className="mb-8 rounded-3xl border bg-gradient-to-r from-indigo-100 via-sky-100 to-fuchsia-100 p-8 shadow-lg">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-indigo-900 md:text-4xl">Science Nova Admin Dashboard</h1>
                <p className="mt-2 max-w-2xl text-base text-indigo-900/70 md:text-lg">
                  Comprehensive admin system for managing lessons, students, content, and analytics. Create engaging science lessons with interactive elements.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Link
                  href="/admin/students"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-tr from-violet-500 to-purple-500 px-6 py-3 text-white shadow-lg hover:brightness-105 transition-all hover:shadow-xl"
                >
                  <Users className="h-5 w-5" /> View Students
                </Link>
                <Link
                  href="/admin/lessons/builder"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-500 px-6 py-3 text-white shadow-lg hover:brightness-105 transition-all hover:shadow-xl"
                >
                  <Plus className="h-5 w-5" /> Create Lesson
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 rounded-3xl border bg-white/80 backdrop-blur shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/admin/lessons/builder"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Create New Lesson</div>
                  <div className="text-sm text-white/90">Build interactive lessons</div>
                </div>
              </Link>
              
              <Link
                href="/admin/content"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
              >
                <Rocket className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Content Manager</div>
                  <div className="text-sm text-white/90">Manage arcade & discovery</div>
                </div>
              </Link>
              
              <Link
                href="/admin/documents"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl"
              >
                <FileText className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Upload & Process Content</div>
                  <div className="text-sm text-white/90">Add textbooks & enable AI processing</div>
                </div>
              </Link>
              
              <Link
                href="/admin/students"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl"
              >
                <Users className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">View Students</div>
                  <div className="text-sm text-white/90">Monitor progress</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <DashboardStat
                key={s.label}
                label={s.label}
                value={s.value}
                delta={s.delta}
                suffix={s.suffix}
                icon={s.icon}
                description={s.description}
                isLoading={loading}
              />
            ))}
          </section>

          {/* Charts */}
          <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Engagement Chart - Takes up 8 columns */}
            <div className="rounded-2xl border bg-white/80 p-6 backdrop-blur shadow-lg lg:col-span-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Weekly Learning Activity</h3>
                  <p className="text-sm text-gray-600">Lesson views and quiz attempts over the past 7 days</p>
                </div>
                <div className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                  Last 7 days
                </div>
              </div>
              <EngagementChart data={engagementData} isLoading={loading} />
            </div>

            {/* Topic Distribution Chart - Takes up 4 columns, aligns with rightmost stats */}
            <div className="rounded-2xl border bg-white/80 p-6 backdrop-blur shadow-lg lg:col-span-4">
              <div className="mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Subject Focus</h3>
                  <p className="text-sm text-gray-600">Distribution of topics viewed</p>
                </div>
                <div className="mt-2 rounded-lg bg-green-50 px-3 py-1 text-xs font-medium text-green-700 inline-block">
                  Last 30 days
                </div>
              </div>
              <TopicChart data={topicData} isLoading={loading} />
            </div>
          </section>

          {/* Arcade & Discovery Engagement */}
          <section className="mt-8">
            <ArcadeDiscoveryEngagement data={contentEngagement} loading={loading} />
          </section>

          {/* Recent lessons */}
          <section className="mt-8 rounded-2xl border bg-white/80 p-6 backdrop-blur shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Lessons</h3>
                <p className="text-sm text-gray-600">Your most recently created and updated lessons</p>
              </div>
              <Link 
                href="/admin/lessons" 
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                View all
                <Eye className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-2">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading lessons...</span>
                </div>
              )}
              {!loading && recent.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mb-3" />
                  <h4 className="text-sm font-medium text-gray-900 mb-1">No lessons yet</h4>
                  <p className="text-sm text-gray-500 mb-4">Create your first lesson to get started!</p>
                  <Link 
                    href="/admin/lessons/builder"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Create Lesson
                  </Link>
                </div>
              )}
              {recent.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${l.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{l.title}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <div className={`h-2 w-2 rounded-full ${l.status === 'published' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                          {l.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                        <span>Grade {l.grade_level ?? "—"}</span>
                        <span>{new Date(l.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  {l.status === "published" ? (
                    <Link 
                      href={`/lessons/${l.id}`} 
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  ) : (
                    <Link 
                      href={`/admin/lessons/builder?id=${l.id}`} 
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <BarChart2 className="h-4 w-4" />
                      Edit
                    </Link>
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
