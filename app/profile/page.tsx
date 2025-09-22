"use client"

import React from "react"
import { VantaBackground } from "@/components/vanta-background"
import { Navbar } from "@/components/layout/navbar"
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/layout/page-transition"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis } from "recharts"
import { ScienceLoading } from "@/components/ui/science-loading"
import { 
  User, 
  Save, 
  ArrowLeft, 
  LogIn, 
  Settings, 
  GraduationCap, 
  Brain, 
  Mail, 
  Shield, 
  Sparkles,
  Trophy,
  Star,
  Target,
  Palette,
  Rocket,
  Waves,
  FlaskConical,
  Atom,
  Microscope,
  Crown,
  Medal
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"

// Mock profile data (fallback when not authenticated)
const mockProfile = {
  full_name: "Science Explorer",
  learning_preference: "VISUAL",
  grade_level: 6,
  email: "explorer@sciencenova.com"
}

// Lab theme configurations
const LAB_THEMES = {
  space: {
    name: "Space Lab",
    icon: Rocket,
    colors: ["#1e1b4b", "#312e81", "#3730a3"],
    description: "Explore the cosmos"
  },
  ocean: {
    name: "Ocean Lab",
    icon: Waves,
    colors: ["#0c4a6e", "#0369a1", "#0284c7"],
    description: "Dive into marine science"
  },
  biolab: {
    name: "Bio Lab",
    icon: FlaskConical,
    colors: ["#166534", "#15803d", "#16a34a"],
    description: "Study life sciences"
  },
  physics: {
    name: "Physics Lab",
    icon: Atom,
    colors: ["#7c2d12", "#dc2626", "#f97316"],
    description: "Unlock the universe"
  }
}

// Avatar customization options
const AVATAR_THEMES = [
  { name: "Classic", seed: "classic", colors: ["#3b82f6", "#8b5cf6", "#10b981"] },
  { name: "Cosmic", seed: "cosmic", colors: ["#6366f1", "#8b5cf6", "#d946ef"] },
  { name: "Nature", seed: "nature", colors: ["#10b981", "#059669", "#16a34a"] },
  { name: "Fire", seed: "fire", colors: ["#f97316", "#dc2626", "#ea580c"] },
  { name: "Ocean", seed: "ocean", colors: ["#0ea5e9", "#0284c7", "#0369a1"] },
  { name: "Galaxy", seed: "galaxy", colors: ["#8b5cf6", "#a855f7", "#c084fc"] }
]

// Mock achievements data
const ACHIEVEMENTS = [
  {
    id: 1,
    title: "Science Explorer",
    description: "Completed 10 topics",
    icon: Microscope,
    earned: true,
    rarity: "gold"
  },
  {
    id: 2,
    title: "Quiz Master",
    description: "Perfect score on 5 quizzes",
    icon: Brain,
    earned: true,
    rarity: "gold"
  },
  {
    id: 3,
    title: "Lab Enthusiast",
    description: "Conducted 15 experiments",
    icon: FlaskConical,
    earned: true,
    rarity: "silver"
  },
  {
    id: 4,
    title: "Theory Expert",
    description: "Mastered complex concepts",
    icon: Crown,
    earned: true,
    rarity: "gold"
  },
  {
    id: 5,
    title: "Discovery Champion",
    description: "Found 3 hidden facts",
    icon: Star,
    earned: true,
    rarity: "bronze"
  }
]

// Mock user stats
const USER_STATS = {
  studyAreasExplored: [
    { name: "Physics", value: 15, fill: "#f97316" },
    { name: "Chemistry", value: 12, fill: "#10b981" },
    { name: "Biology", value: 18, fill: "#8b5cf6" },
    { name: "Earth Science", value: 8, fill: "#0ea5e9" },
    { name: "Astronomy", value: 10, fill: "#d946ef" }
  ],
  learningPreference: [
    { name: "Visual", value: 70, fill: "#8b5cf6" },
    { name: "Story", value: 20, fill: "#10b981" },
    { name: "Facts", value: 10, fill: "#f97316" }
  ],
  favoriteDiscovery: {
    title: "DNA Structure",
    subject: "Biology",
    views: 24,
    icon: "🧬",
    color: "#8b5cf6"
  }
}

// Utility function to get avatar URL
const getAvatarUrl = (seed: string, style: string = "avataaars") => {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=transparent`
}

export default function ProfilePage() {
  const { user, profile, loading } = useAuth()
  
  const isAuthenticated = !!user
  
  // Check if user is privileged (admin/teacher/developer)
  const isPrivileged = profile?.role === 'ADMIN' || profile?.role === 'TEACHER' || profile?.role === 'DEVELOPER'

  // Form state for editable fields - initialize once
  const [formData, setFormData] = useState({
    full_name: "",
    grade_level: "6",
    learning_preference: "VISUAL"
  })

  // Science Lab state
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof LAB_THEMES>("space")
  const [selectedAvatar, setSelectedAvatar] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('lab-theme') as keyof typeof LAB_THEMES
    const savedAvatar = localStorage.getItem('avatar-theme')
    
    if (savedTheme && LAB_THEMES[savedTheme]) {
      setSelectedTheme(savedTheme)
    }
    if (savedAvatar) {
      setSelectedAvatar(parseInt(savedAvatar) || 0)
    }
  }, [])

  // Initialize form data when user/profile data becomes available
  useEffect(() => {
    if (profile) {
      // For privileged users, don't show any grade for display purposes (they use 6 internally)
      let displayGradeLevel = "6"; // default
      if (isPrivileged) {
        displayGradeLevel = ""; // Don't show any grade for privileged users
      } else if (profile.grade_level && profile.grade_level > 0 && profile.grade_level <= 6) {
        displayGradeLevel = profile.grade_level.toString();
      } else if (!isPrivileged) {
        displayGradeLevel = "6"; // Default for students
      }
      
      setFormData({
        full_name: profile.full_name || user?.email?.split('@')[0] || "Science Explorer",
        grade_level: displayGradeLevel,
        learning_preference: profile.learning_preference || "VISUAL"
      })
    } else if (!loading) {
      // Use mock data for demo mode
      setFormData({
        full_name: mockProfile.full_name,
        grade_level: mockProfile.grade_level.toString(),
        learning_preference: mockProfile.learning_preference
      })
    }
  }, [user?.id, profile?.id, loading, isPrivileged]) // Use stable dependencies

  // Use real user data if available, otherwise fall back to mock data for demo
  const currentProfile = profile ? {
    full_name: profile.full_name || user?.email?.split('@')[0] || "Science Explorer",
    learning_preference: profile.learning_preference || "VISUAL",
    grade_level: profile.grade_level || 6,
    email: user?.email || "explorer@sciencenova.com"
  } : mockProfile

  const handleInputChange = (field: string, value: string) => {
    if (isAuthenticated) {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  // Save theme preference
  const handleThemeChange = (theme: keyof typeof LAB_THEMES) => {
    setSelectedTheme(theme)
    if (mounted) {
      localStorage.setItem('lab-theme', theme)
    }
  }

  // Save avatar preference
  const handleAvatarChange = (index: number) => {
    setSelectedAvatar(index)
    if (mounted) {
      localStorage.setItem('avatar-theme', index.toString())
    }
  }

  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSave = async () => {
    if (!isAuthenticated || !user) {
      return
    }

    setSaving(true)
    setSaveMessage(null)

    try {
      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      // For privileged users, save 0 as grade level to represent access to all grades
      const gradeToSave = isPrivileged ? 0 : parseInt(formData.grade_level);

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          grade_level: gradeToSave,
          learning_preference: formData.learning_preference
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile')
      }

      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' })
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null)
      }, 3000)
      
      // Refresh the profile in the auth context
      // This will ensure the UI reflects the updated data
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (error) {
      console.error('Error saving profile:', error)
      setSaveMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save profile'
      })
    } finally {
      setSaving(false)
    }
  }

  // Get top achievements
  const topAchievements = ACHIEVEMENTS
    .filter(achievement => achievement.earned)
    .sort((a, b) => {
      const rarityOrder = { gold: 3, silver: 2, bronze: 1 }
      return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder]
    })
    .slice(0, 5)

  const currentTheme = LAB_THEMES[selectedTheme]
  const currentAvatarTheme = AVATAR_THEMES[selectedAvatar]

  if (loading || !formData.full_name) {
    return (
      <>
        <VantaBackground />
        <Navbar />
        <PageTransition className="pt-20">
          <div className="min-h-screen p-6 flex items-center justify-center">
            <ScienceLoading />
          </div>
        </PageTransition>
      </>
    )
  }

  return (
    <>
      <VantaBackground />
      <Navbar />
      <PageTransition className="pt-20" variant="scientific">
        <div className="min-h-screen p-6">
          <div className="max-w-4xl mx-auto">
            <StaggerContainer>
              {/* Header Section */}
              <StaggerItem>
                <div className="mb-8">
                  <Link href="/">
                    <Button 
                      variant="outline" 
                      className="mb-6 bg-gradient-to-r from-cyan-500/40 to-blue-500/40 backdrop-blur-sm border-2 border-cyan-400/50 hover:bg-gradient-to-r hover:from-cyan-500/50 hover:to-blue-500/50 hover:border-cyan-400/70 text-white transition-all duration-300 shadow-lg hover:shadow-cyan-500/30"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Home
                    </Button>
                  </Link>
                  <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-pink-400 via-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      My Science Lab
                    </h1>
                    <p className="text-white/80 text-lg max-w-2xl mx-auto">
                      {isAuthenticated ? 
                        "Customize your learning journey, manage your lab, and showcase your achievements" :
                        "Explore your personal science laboratory in demo mode. Sign in to save your preferences."
                      }
                    </p>
                  </div>
                </div>
              </StaggerItem>

              {/* Demo Mode Alert */}
              {!isAuthenticated && (
                <StaggerItem>
                  <Card className="bg-gradient-to-r from-blue-500/50 via-cyan-500/50 to-purple-500/50 backdrop-blur-xl border-2 border-blue-400/70 mb-8 shadow-2xl shadow-blue-500/35">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gradient-to-r from-blue-400/50 to-cyan-400/50 rounded-xl shadow-lg">
                            <Sparkles className="h-6 w-6 text-blue-200" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-blue-100 text-lg">Demo Mode Active</h3>
                            <p className="text-blue-200/90 text-sm">Sign in to access your real profile and save changes.</p>
                          </div>
                        </div>
                        <Button 
                          asChild 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg hover:shadow-blue-500/40 transition-all duration-300"
                        >
                          <Link href="/login">
                            <LogIn className="h-4 w-4 mr-2" />
                            Sign In
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              )}

              <div className="grid xl:grid-cols-4 lg:grid-cols-3 gap-8">
                {/* Left Column - Avatar Customizer & Lab Theme */}
                <div className="xl:col-span-1 lg:col-span-1 space-y-6">
                  {/* Avatar Customizer */}
                  <StaggerItem>
                    <Card className="bg-gradient-to-br from-purple-500/40 via-pink-500/40 to-rose-500/40 backdrop-blur-2xl border-2 border-purple-400/60 shadow-2xl shadow-purple-500/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-3 text-lg">
                          <div className="p-2 bg-gradient-to-r from-purple-500/50 to-pink-500/50 rounded-lg">
                            <User className="h-5 w-5 text-purple-200" />
                          </div>
                          Avatar Lab
                        </CardTitle>
                        <CardDescription className="text-purple-200/80">
                          Customize your scientist avatar
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-r from-purple-400 to-pink-400 p-1">
                            <img
                              src={getAvatarUrl(currentAvatarTheme.seed)}
                              alt="Avatar"
                              className="w-full h-full rounded-full bg-white"
                            />
                          </div>
                          <h3 className="text-white font-semibold mb-2 text-sm">{currentAvatarTheme.name} Style</h3>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          {AVATAR_THEMES.map((theme, index) => (
                            <Button
                              key={theme.seed}
                              variant={selectedAvatar === index ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleAvatarChange(index)}
                              className={`h-10 p-1 ${
                                selectedAvatar === index
                                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                                  : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                              }`}
                            >
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{
                                  background: `linear-gradient(45deg, ${theme.colors[0]}, ${theme.colors[1]})`
                                }}
                              />
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>

                  {/* Lab Theme Selector */}
                  <StaggerItem>
                    <Card className="bg-gradient-to-br from-indigo-500/40 via-blue-500/40 to-cyan-500/40 backdrop-blur-2xl border-2 border-indigo-400/60 shadow-2xl shadow-indigo-500/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-3 text-lg">
                          <div className="p-2 bg-gradient-to-r from-indigo-500/50 to-blue-500/50 rounded-lg">
                            <Palette className="h-5 w-5 text-indigo-200" />
                          </div>
                          Lab Theme
                        </CardTitle>
                        <CardDescription className="text-indigo-200/80">
                          Choose your laboratory environment
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center mb-4">
                          <div className="flex justify-center mb-2">
                            {React.createElement(currentTheme.icon, {
                              className: "h-6 w-6 text-white"
                            })}
                          </div>
                          <h3 className="text-white font-semibold text-sm">{currentTheme.name}</h3>
                          <p className="text-white/70 text-xs">{currentTheme.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(LAB_THEMES).map(([key, theme]) => {
                            const IconComponent = theme.icon
                            return (
                              <Button
                                key={key}
                                variant={selectedTheme === key ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleThemeChange(key as keyof typeof LAB_THEMES)}
                                className={`h-12 flex flex-col gap-1 ${
                                  selectedTheme === key
                                    ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-0"
                                    : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                                }`}
                              >
                                <IconComponent className="h-4 w-4" />
                                <span className="text-xs">{theme.name.split(' ')[0]}</span>
                              </Button>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                </div>

                {/* Center Column - Profile Information */}
                <div className="xl:col-span-2 lg:col-span-2 space-y-6">
                  {/* Profile Information Card */}
                  <StaggerItem>
                    <Card className="bg-gradient-to-br from-indigo-500/40 via-purple-500/40 to-pink-500/40 backdrop-blur-2xl border-2 border-gradient-to-r border-indigo-400/60 shadow-2xl shadow-purple-500/30">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-white flex items-center gap-3 text-xl">
                          <div className="p-3 bg-gradient-to-r from-indigo-500/50 to-purple-500/50 rounded-xl shadow-lg">
                            <Settings className="h-6 w-6 text-indigo-200" />
                          </div>
                          Profile Information
                        </CardTitle>
                        <CardDescription className="text-white/70">
                          Update your personal information and learning preferences
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid gap-6">
                          {/* Full Name */}
                          <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-white/90 font-medium flex items-center gap-2">
                              <div className="p-1 bg-gradient-to-r from-emerald-500/50 to-teal-500/50 rounded-md">
                                <User className="h-4 w-4 text-emerald-300" />
                              </div>
                              Full Name
                            </Label>
                            <Input
                              id="fullName"
                              type="text"
                              value={formData.full_name}
                              onChange={(e) => handleInputChange('full_name', e.target.value)}
                              className="bg-gradient-to-r from-emerald-500/25 to-teal-500/25 border-2 border-emerald-400/50 rounded-xl text-white placeholder:text-white/50 focus:border-emerald-400 focus:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:border-emerald-400/70 transition-all duration-300"
                              readOnly={!isAuthenticated}
                              placeholder="Enter your full name"
                            />
                          </div>

                          {/* Email */}
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-white/90 font-medium flex items-center gap-2">
                              <div className="p-1 bg-gradient-to-r from-blue-500/50 to-cyan-500/50 rounded-md">
                                <Mail className="h-4 w-4 text-blue-300" />
                              </div>
                              Email Address
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={currentProfile.email}
                              className="bg-gradient-to-r from-blue-500/25 to-cyan-500/25 border-2 border-blue-400/50 rounded-xl text-white/70 placeholder:text-white/50"
                              readOnly
                              onChange={() => {}} // Prevent React warning for read-only field
                            />
                            <p className="text-blue-200/70 text-xs flex items-center gap-1">
                              <Shield className="h-3 w-3 text-blue-300" />
                              Email cannot be changed for security reasons
                            </p>
                          </div>

                          {/* Grade Level - Only show for students and only after profile is loaded */}
                          {!loading && !isPrivileged && (
                            <div className="space-y-2">
                              <Label htmlFor="gradeLevel" className="text-white/90 font-medium flex items-center gap-2">
                                <div className="p-1 bg-gradient-to-r from-orange-500/50 to-red-500/50 rounded-md">
                                  <GraduationCap className="h-4 w-4 text-orange-300" />
                                </div>
                                Grade Level
                              </Label>
                              <Select 
                                value={formData.grade_level} 
                                onValueChange={(value) => handleInputChange('grade_level', value)}
                                disabled={!isAuthenticated}
                              >
                                <SelectTrigger className="bg-gradient-to-r from-orange-500/25 to-red-500/25 border-2 border-orange-400/50 rounded-xl text-white hover:border-orange-400/70 focus:border-orange-400 focus:shadow-[0_0_20px_rgba(251,146,60,0.3)] transition-all duration-300">
                                  <SelectValue placeholder="Select grade level" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 6 }, (_, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                      {i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Grade
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Learning Preference */}
                          <div className="space-y-2">
                            <Label htmlFor="learningPreference" className="text-white/90 font-medium flex items-center gap-2">
                              <div className="p-1 bg-gradient-to-r from-purple-500/50 to-pink-500/50 rounded-md">
                                <Brain className="h-4 w-4 text-purple-300" />
                              </div>
                              Learning Style
                            </Label>
                            <Select 
                              value={formData.learning_preference} 
                              onValueChange={(value) => handleInputChange('learning_preference', value)}
                              disabled={!isAuthenticated}
                            >
                              <SelectTrigger className="bg-gradient-to-r from-purple-500/25 to-pink-500/25 border-2 border-purple-400/50 rounded-xl text-white hover:border-purple-400/70 focus:border-purple-400 focus:shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all duration-300">
                                <SelectValue placeholder="Select learning preference" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="VISUAL">🎨 Visual Learner</SelectItem>
                                <SelectItem value="AUDITORY">🎵 Auditory Learner</SelectItem>
                                <SelectItem value="KINESTHETIC">🏃 Kinesthetic Learner</SelectItem>
                                <SelectItem value="READING">📖 Reading/Writing Learner</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Save Button */}
                          <div className="pt-4">
                            <Button
                              type="button"
                              onClick={handleSave}
                              className="w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/40"
                              disabled={!isAuthenticated || saving}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              {saving ? "Saving..." : isAuthenticated ? "Save Changes" : "Demo Mode - Changes Not Saved"}
                            </Button>
                            
                            {/* Save Status Message */}
                            {saveMessage && (
                              <div className={`mt-3 p-3 rounded-lg text-sm ${
                                saveMessage.type === 'success' 
                                  ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-100' 
                                  : 'bg-red-500/20 border border-red-400/50 text-red-100'
                              }`}>
                                {saveMessage.text}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>

                  {/* Achievement Trophy Shelf */}
                  <StaggerItem>
                    <Card className="bg-gradient-to-br from-amber-500/40 via-yellow-500/40 to-orange-500/40 backdrop-blur-2xl border-2 border-amber-400/60 shadow-2xl shadow-amber-500/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-amber-500/50 to-yellow-500/50 rounded-lg">
                            <Trophy className="h-6 w-6 text-amber-200" />
                          </div>
                          Trophy Shelf
                        </CardTitle>
                        <CardDescription className="text-amber-200/80">
                          Your greatest scientific achievements
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {topAchievements.map((achievement) => {
                            const IconComponent = achievement.icon
                            return (
                              <div
                                key={achievement.id}
                                className="group relative text-center p-3 rounded-xl bg-gradient-to-b from-amber-400/30 to-yellow-500/30 hover:from-amber-400/50 hover:to-yellow-500/50 transition-all duration-300 hover:scale-105 cursor-pointer"
                              >
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400/20 to-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative">
                                  <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                                    achievement.rarity === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                                    achievement.rarity === 'silver' ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                                    'bg-gradient-to-r from-amber-600 to-orange-600'
                                  } group-hover:shadow-lg group-hover:shadow-amber-500/50 transition-all duration-300`}>
                                    <IconComponent className="h-5 w-5 text-white" />
                                  </div>
                                  <h4 className="text-white font-semibold text-xs mb-1">{achievement.title}</h4>
                                  <p className="text-amber-200/80 text-xs">{achievement.description}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>

                  {/* Study Areas Chart */}
                  <StaggerItem>
                    <Card className="bg-gradient-to-br from-emerald-500/40 via-teal-500/40 to-cyan-500/40 backdrop-blur-2xl border-2 border-emerald-400/60 shadow-2xl shadow-emerald-500/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-emerald-500/50 to-teal-500/50 rounded-lg">
                            <Target className="h-6 w-6 text-emerald-200" />
                          </div>
                          Topics Explored by Study Area
                        </CardTitle>
                        <CardDescription className="text-emerald-200/80">
                          Your learning journey across different sciences
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48">
                          <ChartContainer
                            config={{
                              value: {
                                label: "Topics Explored",
                              }
                            }}
                            className="h-full"
                          >
                            <BarChart data={USER_STATS.studyAreasExplored}>
                              <XAxis dataKey="name" fontSize={12} />
                              <YAxis fontSize={12} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar 
                                dataKey="value" 
                                fill="currentColor"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ChartContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                </div>

                {/* Right Column - Enhanced Profile Summary & Features */}
                <div className="xl:col-span-1 lg:col-span-1 space-y-6">
                  {/* Favorite Discovery */}
                  <StaggerItem>
                    <Card className="bg-gradient-to-br from-yellow-500/40 via-orange-500/40 to-red-500/40 backdrop-blur-2xl border-2 border-yellow-400/60 shadow-2xl shadow-yellow-500/30 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 animate-pulse" />
                      <CardHeader className="relative">
                        <CardTitle className="text-white flex items-center gap-2 text-lg">
                          <div className="p-2 bg-gradient-to-r from-yellow-500/50 to-orange-500/50 rounded-lg">
                            <Star className="h-5 w-5 text-yellow-200" />
                          </div>
                          Favorite Discovery!
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative space-y-3">
                        <div className="text-center">
                          <div className="text-3xl mb-2">{USER_STATS.favoriteDiscovery.icon}</div>
                          <h3 className="text-white font-bold text-sm">{USER_STATS.favoriteDiscovery.title}</h3>
                          <Badge 
                            className="mt-2 text-xs"
                            style={{ backgroundColor: `${USER_STATS.favoriteDiscovery.color}40`, color: USER_STATS.favoriteDiscovery.color }}
                          >
                            {USER_STATS.favoriteDiscovery.subject}
                          </Badge>
                          <p className="text-white/80 text-xs mt-1">
                            Explored {USER_STATS.favoriteDiscovery.views} times
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>

                  {/* Learning Style Donut Chart */}
                  <StaggerItem>
                    <Card className="bg-gradient-to-br from-rose-500/40 via-pink-500/40 to-purple-500/40 backdrop-blur-2xl border-2 border-rose-400/60 shadow-2xl shadow-rose-500/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2 text-lg">
                          <div className="p-2 bg-gradient-to-r from-rose-500/50 to-pink-500/50 rounded-lg">
                            <Brain className="h-5 w-5 text-rose-200" />
                          </div>
                          Learning Style
                        </CardTitle>
                        <CardDescription className="text-rose-200/80">
                          How you prefer to learn
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="h-32">
                            <ChartContainer
                              config={{
                                visual: { label: "Visual Learning" },
                                story: { label: "Story-based" },
                                facts: { label: "Fact-focused" }
                              }}
                              className="h-full"
                            >
                              <PieChart>
                                <Pie
                                  data={USER_STATS.learningPreference}
                                  dataKey="value"
                                  nameKey="name"
                                  innerRadius={20}
                                  outerRadius={50}
                                  paddingAngle={5}
                                >
                                  {USER_STATS.learningPreference.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent />} />
                              </PieChart>
                            </ChartContainer>
                          </div>
                          <div className="space-y-2">
                            {USER_STATS.learningPreference.map((item) => (
                              <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: item.fill }}
                                  />
                                  <span className="text-white/90 text-xs">{item.name}</span>
                                </div>
                                <span className="text-white font-semibold text-xs">{item.value}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>

                  {/* Enhanced Profile Summary */}
                  <StaggerItem>
                    <Card className="bg-gradient-to-br from-pink-500/40 via-rose-500/40 to-orange-500/40 backdrop-blur-2xl border-2 border-pink-400/60 shadow-2xl shadow-pink-500/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <div className="p-2 bg-gradient-to-r from-pink-500/50 to-rose-500/50 rounded-lg">
                            <User className="h-5 w-5 text-pink-200" />
                          </div>
                          Profile Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-pink-500/40">
                            <User className="h-10 w-10 text-white" />
                          </div>
                          <h3 className="text-white font-semibold text-lg">{currentProfile.full_name}</h3>
                          <p className="text-pink-200/90">{currentProfile.email}</p>
                        </div>
                        
                        <div className="space-y-3 pt-4 border-t border-pink-300/30">
                          <div className="flex justify-between items-center">
                            <span className="text-white/80 text-sm">Grade Level</span>
                            <Badge className="bg-gradient-to-r from-orange-500/50 to-red-500/50 text-orange-200 border-orange-400/60 shadow-lg">
                              Grade {currentProfile.grade_level}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/80 text-sm">Learning Style</span>
                            <Badge className="bg-gradient-to-r from-purple-500/50 to-pink-500/50 text-purple-200 border-purple-400/60 shadow-lg">
                              {currentProfile.learning_preference}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>

                  {/* Learning Progress Card */}
                  <StaggerItem>
                    <Card className="bg-gradient-to-br from-emerald-500/40 via-teal-500/40 to-cyan-500/40 backdrop-blur-2xl border-2 border-emerald-400/60 shadow-2xl shadow-emerald-500/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <div className="p-2 bg-gradient-to-r from-emerald-500/50 to-teal-500/50 rounded-lg">
                            <Sparkles className="h-5 w-5 text-emerald-200" />
                          </div>
                          Learning Progress
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-white/90">Profile Completion</span>
                            <span className="text-emerald-200 font-semibold">85%</span>
                          </div>
                          <Progress value={85} className="h-3 bg-emerald-900/50" />
                        </div>
                        <div className="text-center pt-4 border-t border-emerald-300/30">
                          <p className="text-emerald-200/90 text-sm">
                            Complete your profile to unlock personalized learning recommendations!
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>

                  {/* Demo Mode Info */}
                  {!isAuthenticated && (
                    <StaggerItem>
                      <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-2xl border-2 border-amber-400/30 shadow-2xl">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-amber-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Sparkles className="h-6 w-6 text-amber-300" />
                            </div>
                            <h3 className="text-amber-100 font-semibold mb-2">Demo Profile</h3>
                            <p className="text-amber-200/80 text-sm">
                              This is a demonstration showing how your profile would appear. Sign in to access real profile features and save your preferences.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </StaggerItem>
                  )}
                </div>
              </div>
            </StaggerContainer>
          </div>
        </div>
      </PageTransition>
    </>
  )
}
