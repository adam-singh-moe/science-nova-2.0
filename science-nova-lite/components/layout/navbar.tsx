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
  className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl ${theme.border.primary} border-b-2 border-white/10 ${isStudentLessonPage ? "bg-white/20" : theme.background.transparent}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
          <div className="group">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className={`h-8 w-8 ${theme.icon.warning} group-hover:rotate-45 transition-transform duration-300`} />
              <span className={`text-2xl font-bold text-transparent bg-clip-text ${theme.gradient.header}`}>Science Nova</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${theme.border.primary} border ${isActive ? `${theme.background.card} ${theme.text.primary} ${theme.border.accent} shadow-[0_0_15px_hsl(var(--accent))]` : `${theme.text.secondary} ${theme.hover.background} ${theme.hover.text} ${theme.hover.border}`}`}>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="text-right hidden sm:block"><p className={`${theme.text.secondary} text-sm`}>Loading...</p></div>
            ) : (
              <div className="text-right hidden sm:block">
                <p className={`${theme.text.primary} font-medium flex items-center gap-2`}>
                  {displayUser.full_name}
                  {profile?.grade_level && profile.grade_level >= 5 && (
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700"> <Crown className="h-3 w-3 mr-1" /> Explorer </Badge>
                  )}
                </p>
                <p className={`text-sm ${theme.text.secondary} mb-1`}>
                  {isDemoMode ? "Demo Mode • Visual learner" : profile ? `Grade ${profile.grade_level || 'N/A'} • ${profile.learning_preference || 'Visual'} learner` : "Explorer • Visual learner"}
                </p>
                {userProgress && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" /><span className={`text-xs font-bold ${theme.text.primary}`}>LVL {userProgress.level}</span></div>
                    <div className="flex-1 min-w-[60px]"><Progress value={((userProgress.totalXP - userProgress.currentLevelXP) / (userProgress.nextLevelXP - userProgress.currentLevelXP)) * 100} className="h-2 bg-gray-800/30 progress-glow" /></div>
                    <span className={`text-xs ${theme.text.secondary}`}>{userProgress.totalXP - userProgress.currentLevelXP}/{userProgress.nextLevelXP - userProgress.currentLevelXP} XP</span>
                  </div>
                )}
              </div>
            )}

            {!isAuthenticated && !loading && (
              <Button asChild variant="outline" className="mr-2">
                <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Sign In</Link>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`relative h-10 w-10 rounded-full ${theme.border.primary} border animate-pulse-slow`}>
                  <Avatar className="h-10 w-10 border-4 border-white/20">
                    <AvatarImage src={getAvatarUrl(displayUser.full_name)} alt={displayUser.full_name} />
                    <AvatarFallback className={`${theme.gradient.primary} text-white font-semibold`}>{getAvatarInitials(displayUser.full_name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className={`w-56 bg-card/80 backdrop-blur-xl border-white/10 border-2`} align="end">
                <DropdownMenuLabel className={theme.text.primary}>{isDemoMode ? "Demo Account" : "My Account"}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-400" />

                <div className="md:hidden">
                  {navItems.map((item) => { const Icon = item.icon; return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className={`${theme.text.secondary} hover:bg-accent/20 rounded-lg cursor-pointer`}>
                        <Icon className="mr-2 h-4 w-4" />{item.label}
                      </Link>
                    </DropdownMenuItem>
                  )})}
                  <DropdownMenuSeparator className="bg-gray-400" />
                </div>

                <DropdownMenuItem asChild>
                  <Link href="/profile" className={`${theme.text.secondary} hover:bg-accent/20 rounded-lg cursor-pointer`}>
                    <User className="mr-2 h-4 w-4" /> Profile Settings
                  </Link>
                </DropdownMenuItem>

                {hasAdminAccess && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className={`${theme.text.secondary} hover:bg-accent/20 rounded-lg cursor-pointer`}>
                      <Shield className="mr-2 h-4 w-4" /> Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-gray-400" />
                {isAuthenticated ? (
                  <DropdownMenuItem onClick={signOut} className={`${theme.text.accent} hover:bg-accent/20 hover:text-red-600 rounded-lg cursor-pointer`}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/login" className={`${theme.text.accent} hover:bg-accent/20 hover:text-blue-600 rounded-lg cursor-pointer`}>
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
