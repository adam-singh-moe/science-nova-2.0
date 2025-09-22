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

  // Check if user has privileged role that should see all content
  const isPrivileged = profile?.role && ['ADMIN', 'TEACHER', 'DEVELOPER'].includes(profile.role)
  
  // Only use grade level for filtering if user is not privileged
  const grade = useMemo(() => {
    if (isPrivileged) return undefined // Privileged users see all grades
    return profile?.grade_level ? Number(profile.grade_level) : undefined
  }, [profile?.grade_level, isPrivileged])

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true)
      try {
        const qs = new URLSearchParams({ 
          status: 'published', 
          limit: '50', 
          ...(grade ? { grade: String(grade) } : {}), 
          ...(q ? { search: q } : {}), 
          ...(group ? { group } : {}), 
          ...(sort ? { sort } : {}) 
        })
        const res = await fetch(`/api/lessons?${qs.toString()}`, { cache: 'no-store' })
        const json = await res.json()
        setLessons(Array.isArray(json.lessons) ? json.lessons : [])
      } finally {
        setLoading(false)
      }
    }
    fetchLessons()
  }, [grade, q, group, sort, isPrivileged])

  return (
    <VantaBackground effect="globe">
      <main className="min-h-screen py-10">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header Section with enhanced glassmorphism */}
          <div className="relative mb-6">
            {/* Glow effect background */}
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400/15 via-emerald-400/15 to-blue-400/15 rounded-3xl blur-xl"></div>
            
            <div className="relative bg-white/10 backdrop-blur-lg border border-white/25 rounded-2xl p-6 shadow-[0_8px_32px_rgba(56,189,248,0.25)]">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight mb-1 bg-gradient-to-r from-sky-400 via-emerald-400 to-blue-400 text-transparent bg-clip-text drop-shadow-[0_4px_20px_rgba(56,189,248,0.4)]">
                    Lessons
                  </h1>
                  {isPrivileged ? (
                    <p className="text-sm text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                      Showing all lessons from <span className="font-medium text-sky-300">all grade levels</span>.
                    </p>
                  ) : grade ? (
                    <p className="text-sm text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                      Showing lessons for <span className="font-medium text-sky-300">Grade {grade}</span>.
                    </p>
                  ) : (
                    <p className="text-sm text-amber-200 bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-2 inline-block backdrop-blur-sm drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                      Set your grade in your <Link href="/profile" className="underline text-amber-100 hover:text-white transition-colors">profile</Link> to see personalized lessons.
                    </p>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 px-3 py-2 shadow-sm">
                    <Search className="h-4 w-4 text-white/70" />
                    <input 
                      value={q} 
                      onChange={(e)=>setQ(e.target.value)} 
                      placeholder="Search lessons..." 
                      className="outline-none w-56 bg-transparent text-white placeholder-white/60" 
                    />
                  </div>
                  <select 
                    value={group} 
                    onChange={(e)=>setGroup(e.target.value)} 
                    className="border border-white/30 rounded-full px-3 py-2 bg-white/20 backdrop-blur-sm text-white"
                  >
                    <option value="" className="text-gray-800">All Topics</option>
                    <option value="meteorology" className="text-gray-800">Meteorology</option>
                    <option value="physics" className="text-gray-800">Physics</option>
                    <option value="chemistry" className="text-gray-800">Chemistry</option>
                    <option value="geography" className="text-gray-800">Geography</option>
                    <option value="biology" className="text-gray-800">Biology</option>
                    <option value="astronomy" className="text-gray-800">Astronomy</option>
                  </select>
                  <select 
                    value={sort} 
                    onChange={(e)=>setSort(e.target.value as any)} 
                    className="border border-white/30 rounded-full px-3 py-2 bg-white/20 backdrop-blur-sm text-white"
                  >
                    <option value="date" className="text-gray-800">Newest</option>
                    <option value="difficulty" className="text-gray-800">Difficulty</option>
                  </select>
                  <span className="hidden sm:inline-flex items-center gap-2 text-sm text-white/80">
                    <FilterIcon className="h-4 w-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"/> 
                    Filter
                  </span>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/15 to-purple-400/15 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/12 backdrop-blur-lg border border-white/25 rounded-2xl p-8 text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                Loading…
              </div>
            </div>
          ) : lessons.length===0 ? (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-400/15 to-slate-400/15 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/12 backdrop-blur-lg border border-white/25 rounded-2xl p-8 text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                No lessons found.
              </div>
            </div>
          ) : (
            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map((l) => {
                const meta = groupMeta(l.group)
                const Icon = meta.icon
                const difficulty = l.layout_json?.meta?.difficulty
                return (
                  <li key={l.id} className="group relative lesson-card-hover">
                    {/* Spaceship energy field effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-sky-400/0 via-sky-400/5 to-sky-400/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 transform group-hover:scale-110 group-hover:-translate-y-2"></div>
                    
                    {/* Lesson card with enhanced spaceship takeoff animation */}
                    <div className="relative rounded-2xl border border-white/25 bg-white/12 backdrop-blur-lg p-5 shadow-lg transition-all duration-500 hover:shadow-[0_20px_40px_rgba(56,189,248,0.4)] hover:-translate-y-8 hover:scale-105 transform-gpu group-hover:bg-white/18 cursor-pointer overflow-hidden">
                      {/* Rocket trail with enhanced effects */}
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none rocket-glow">
                        {/* Main thrust */}
                        <div className="w-2 h-12 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent animate-pulse group-hover:animate-none group-hover:h-16 transition-all duration-500"></div>
                        
                        {/* Particle effects */}
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-radial from-orange-400 to-transparent rounded-full animate-ping"></div>
                        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gradient-radial from-yellow-400 to-transparent rounded-full animate-ping delay-150"></div>
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gradient-radial from-red-400 to-transparent rounded-full animate-ping delay-300"></div>
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gradient-radial from-red-500 to-transparent rounded-full animate-ping delay-500"></div>
                        
                        {/* Side thrusters */}
                        <div className="absolute bottom-2 left-0 w-1 h-6 bg-gradient-to-t from-blue-400 to-transparent animate-pulse delay-200"></div>
                        <div className="absolute bottom-2 right-0 w-1 h-6 bg-gradient-to-t from-blue-400 to-transparent animate-pulse delay-400"></div>
                      </div>
                      
                      {/* Enhanced background stars field */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-1000 pointer-events-none">
                        <div className="absolute top-4 right-8 w-1 h-1 bg-white rounded-full star-sparkle"></div>
                        <div className="absolute top-12 left-12 w-0.5 h-0.5 bg-blue-300 rounded-full star-sparkle-delayed"></div>
                        <div className="absolute bottom-12 right-6 w-0.5 h-0.5 bg-purple-300 rounded-full star-sparkle-delayed-2"></div>
                        <div className="absolute top-6 left-20 w-1 h-1 bg-yellow-300 rounded-full star-sparkle"></div>
                        <div className="absolute top-16 right-12 w-0.5 h-0.5 bg-pink-300 rounded-full star-sparkle-delayed"></div>
                        <div className="absolute bottom-8 left-8 w-0.5 h-0.5 bg-cyan-300 rounded-full star-sparkle-delayed-2"></div>
                        
                        {/* Shooting stars */}
                        <div className="absolute top-8 left-4 w-8 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-16 transition-all duration-1000 delay-300"></div>
                        <div className="absolute bottom-16 right-8 w-6 h-0.5 bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-0 group-hover:opacity-100 group-hover:-translate-x-12 transition-all duration-800 delay-600"></div>
                      </div>

                      {/* Energy ripples */}
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
                        <div className="absolute inset-0 rounded-2xl border-2 border-sky-400/20 animate-ping"></div>
                        <div className="absolute inset-2 rounded-2xl border border-blue-400/30 animate-ping delay-200"></div>
                        <div className="absolute inset-4 rounded-2xl border border-purple-400/40 animate-ping delay-400"></div>
                      </div>

                      <Link href={`/lessons/${l.id}`} className="absolute inset-0 z-20" aria-label={`Open ${l.title || 'lesson'}`} />
                      
                      <div className="flex items-start justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-5 w-5 ${meta.iconColor} drop-shadow-[0_0_15px_rgba(56,189,248,0.6)] transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(56,189,248,0.8)]`} />
                          <h3 className="text-lg font-semibold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] group-hover:text-sky-200 transition-colors duration-300">
                            {l.title || 'Untitled Lesson'}
                          </h3>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full border border-sky-400/40 bg-sky-400/20 text-sky-200 backdrop-blur-sm group-hover:bg-sky-400/30 group-hover:border-sky-300/60 transition-all duration-300">
                          Grade {l.grade_level ?? '-'}
                        </span>
                      </div>
                      
                      {l.topic && (
                        <div className="text-sm text-white/80 mb-3 line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] group-hover:text-white/90 transition-colors duration-300">
                          {l.topic}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mb-2">
                        {l.group && (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-sm group-hover:bg-white/30 group-hover:border-white/40 transition-all duration-300">
                            {meta.label}
                          </span>
                        )}
                        {difficulty && (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-emerald-400/40 bg-emerald-400/20 text-emerald-200 backdrop-blur-sm group-hover:bg-emerald-400/30 group-hover:border-emerald-300/60 transition-all duration-300">
                            {difficulty===1? 'Easy' : difficulty===2? 'Moderate' : 'Challenging'}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-white/60 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] group-hover:text-white/70 transition-colors duration-300">
                        Updated {l.updated_at ? new Date(l.updated_at).toLocaleDateString() : ''}
                      </div>
                    </div>
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
