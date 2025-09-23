"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sparkles, LogOut, User, Settings, Home, BookOpen, Trophy, LogIn, Crown, Star, Shield } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { theme } from "@/lib/theme"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

const mockUser = { full_name: "Science Explorer", email: "explorer@sciencenova.com" }
const mockProgress = { level: 3, totalXP: 1250, nextLevelXP: 1500, currentLevelXP: 1000 }

const getAvatarInitials = (name: string) => {
  const names = name.split(' ')
  return (names[0]?.[0] || 'S').toUpperCase() + (names[1]?.[0] || 'N').toUpperCase()
}
const getAvatarUrl = (name: string) => {
  const seedName = name.replace(/\s+/g, '+')
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seedName}&backgroundColor=f0f9ff,dbeafe,e0e7ff`
}

export function Navbar() {
  const pathname = usePathname()
  const { user, profile, signOut, loading } = useAuth()
  const [userProgress, setUserProgress] = useState<{ level: number; totalXP: number; nextLevelXP: number; currentLevelXP: number } | null>(null)
  
  // Check if user has privileged role
  const isPrivileged = profile?.role && ['ADMIN', 'TEACHER', 'DEVELOPER'].includes(profile.role)
  const [loadingProgress, setLoadingProgress] = useState(false)

  const displayUser = user && profile ? { full_name: profile.full_name || user.email?.split('@')[0] || "User", email: user.email || "user@example.com" } : mockUser
  const isAuthenticated = !!user
  const isDemoMode = !isAuthenticated
  
  // Check if user has admin access (ADMIN, TEACHER, or DEVELOPER roles)
  const hasAdminAccess = profile?.role && ['ADMIN', 'TEACHER', 'DEVELOPER'].includes(profile.role)

  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!isAuthenticated || !user) { setUserProgress(mockProgress); return }
      setLoadingProgress(true)
      try {
        const { data: progressData, error } = await supabase.from('user_progress').select('*').eq('user_id', user.id).single()
        if (error && (error as any).code !== 'PGRST116') { setUserProgress(mockProgress); return }
        const totalXP = progressData?.total_xp || 0
        const level = Math.floor(totalXP / 500) + 1
        const currentLevelXP = (level - 1) * 500
        const nextLevelXP = level * 500
        setUserProgress({ level, totalXP, nextLevelXP, currentLevelXP })
      } finally { setLoadingProgress(false) }
    }
    if (!loading) fetchUserProgress()
  }, [isAuthenticated, user, loading])

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/lessons", label: "Lessons", icon: BookOpen },
    { href: "/arcade", label: "Arcade", icon: Sparkles },
    { href: "/discovery", label: "Discovery", icon: Star },
    { href: "/achievements", label: "Achievements", icon: Trophy },
  ]

  const navRef = useRef<HTMLElement | null>(null)
  const [navHeight, setNavHeight] = useState<number>(80)
  // Solid navbar only on lesson content pages: /lessons/[id] and /lessons/preview
  const isStudentLessonPage = (() => {
    const p = pathname || ""
    if (p === "/lessons" || p === "/lessons/mine") return false
    if (p === "/lessons/preview") return true
    return p.startsWith("/lessons/") && p.split("/").length === 3
  })()

  useEffect(() => {
    const updateHeight = () => {
      if (navRef.current) setNavHeight(navRef.current.offsetHeight)
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  return (
    <>
      {/* Fixed header */}
      <nav
        ref={navRef as any}
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm ${theme.border.primary} border-b-2 border-white/20 bg-black/20`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
          <div className="group">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className={`h-8 w-8 text-blue-400 drop-shadow-lg group-hover:rotate-45 transition-transform duration-300`} />
              <span className={`text-2xl font-bold text-white drop-shadow-lg`}>Science Nova</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors border-2 backdrop-blur-sm ${isActive ? `bg-white/20 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] drop-shadow-lg` : `text-white/90 bg-white/10 border-white/20 hover:bg-white/20 hover:text-white hover:border-white/40 drop-shadow-md`}`}>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="text-right hidden sm:block"><p className={`text-white/80 text-sm drop-shadow-md`}>Loading...</p></div>
            ) : (
              <div className="text-right hidden sm:block">
                <p className={`text-white font-medium flex items-center gap-2 drop-shadow-lg`}>
                  {displayUser.full_name}
                  {isPrivileged ? (
                    <Badge variant="secondary" className="text-xs bg-blue-500/90 text-white border border-blue-300 drop-shadow-md">
                      <Shield className="h-3 w-3 mr-1" /> 
                      {profile?.role?.charAt(0).toUpperCase()}{profile?.role?.slice(1).toLowerCase()}
                    </Badge>
                  ) : profile?.grade_level && profile.grade_level >= 5 && (
                    <Badge variant="secondary" className="text-xs bg-yellow-400/90 text-yellow-900 border border-yellow-300 drop-shadow-md">
                      <Crown className="h-3 w-3 mr-1" /> Explorer
                    </Badge>
                  )}
                </p>
                <p className={`text-sm text-white/80 mb-1 drop-shadow-md`}>
                  {isDemoMode 
                    ? "Demo Mode • Visual learner" 
                    : profile 
                      ? isPrivileged 
                        ? `${profile.role?.charAt(0).toUpperCase()}${profile.role?.slice(1).toLowerCase()} • ${profile.learning_preference || 'Visual'} learner`
                        : `Grade ${profile.grade_level || 'N/A'} • ${profile.learning_preference || 'Visual'} learner`
                      : "Explorer • Visual learner"
                  }
                </p>
                {userProgress && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-400 drop-shadow-md" /><span className={`text-xs font-bold text-white drop-shadow-md`}>LVL {userProgress.level}</span></div>
                    <div className="flex-1 min-w-[60px]"><Progress value={((userProgress.totalXP - userProgress.currentLevelXP) / (userProgress.nextLevelXP - userProgress.currentLevelXP)) * 100} className="h-2 bg-white/20 progress-glow backdrop-blur-sm" /></div>
                    <span className={`text-xs text-white/80 drop-shadow-md`}>{userProgress.totalXP - userProgress.currentLevelXP}/{userProgress.nextLevelXP - userProgress.currentLevelXP} XP</span>
                  </div>
                )}
              </div>
            )}

            {!isAuthenticated && !loading && (
              <Button asChild variant="outline" className="mr-2 bg-white/20 border-white/40 text-white hover:bg-white/30 hover:border-white/60 backdrop-blur-sm drop-shadow-md">
                <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Sign In</Link>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`relative h-10 w-10 rounded-full border-2 border-white/40 backdrop-blur-sm drop-shadow-lg hover:border-white/60 transition-colors`}>
                  <Avatar className="h-10 w-10 border-4 border-white/30 drop-shadow-lg">
                    <AvatarImage src={getAvatarUrl(displayUser.full_name)} alt={displayUser.full_name} />
                    <AvatarFallback className={`bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold drop-shadow-md`}>{getAvatarInitials(displayUser.full_name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className={`w-56 bg-black/80 backdrop-blur-xl border-white/20 border-2 text-white drop-shadow-2xl`} align="end">
                <DropdownMenuLabel className={`text-white font-semibold`}>{isDemoMode ? "Demo Account" : "My Account"}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/20" />

                <div className="md:hidden">
                  {navItems.map((item) => { const Icon = item.icon; return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className={`text-white/90 hover:bg-white/10 hover:text-white rounded-lg cursor-pointer`}>
                        <Icon className="mr-2 h-4 w-4" />{item.label}
                      </Link>
                    </DropdownMenuItem>
                  )})}
                  <DropdownMenuSeparator className="bg-white/20" />
                </div>

                <DropdownMenuItem asChild>
                  <Link href="/profile" className={`text-white/90 hover:bg-white/10 hover:text-white rounded-lg cursor-pointer`}>
                    <User className="mr-2 h-4 w-4" /> Profile Settings
                  </Link>
                </DropdownMenuItem>

                {hasAdminAccess && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className={`text-white/90 hover:bg-white/10 hover:text-white rounded-lg cursor-pointer`}>
                      <Shield className="mr-2 h-4 w-4" /> Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-white/20" />
                {isAuthenticated ? (
                  <DropdownMenuItem onClick={signOut} className={`text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg cursor-pointer`}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/login" className={`text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 rounded-lg cursor-pointer`}>
                      <LogIn className="mr-2 h-4 w-4" /> Sign In
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          </div>
        </div>
      </nav>

  {/* Spacer to offset the fixed navbar height so content starts below it */}
  <div aria-hidden="true" style={{ height: navHeight }} />
    </>
  )
}
