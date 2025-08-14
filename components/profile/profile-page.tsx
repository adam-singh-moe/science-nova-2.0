"use client"

import React, { useState, useEffect } from "react"
import { VantaBackground } from "@/components/vanta-background"
import { Navbar } from "@/components/layout/navbar"
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/layout/page-transition"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ScienceLoading } from "@/components/ui/science-loading"
import { 
  User, 
  Settings, 
  Trophy, 
  Star, 
  Sparkles, 
  Palette, 
  Rocket,
  Waves,
  FlaskConical,
  Atom,
  Microscope,
  Brain,
  Heart,
  Zap,
  Crown,
  Medal,
  Target
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

// Lab theme configurations
const LAB_THEMES = {
  space: {
    name: "Space Lab",
    icon: Rocket,
    vantaType: "BIRDS", // Can be customized based on Vanta implementation
    colors: ["#1e1b4b", "#312e81", "#3730a3"],
    description: "Explore the cosmos"
  },
  ocean: {
    name: "Ocean Lab",
    icon: Waves,
    vantaType: "WAVES",
    colors: ["#0c4a6e", "#0369a1", "#0284c7"],
    description: "Dive into marine science"
  },
  biolab: {
    name: "Bio Lab",
    icon: FlaskConical,
    vantaType: "CELLS",
    colors: ["#166534", "#15803d", "#16a34a"],
    description: "Study life sciences"
  },
  physics: {
    name: "Physics Lab",
    icon: Atom,
    vantaType: "TRUNK",
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
    { area: "Physics", count: 15, color: "#f97316" },
    { area: "Chemistry", count: 12, color: "#10b981" },
    { area: "Biology", count: 18, color: "#8b5cf6" },
    { area: "Earth Science", count: 8, color: "#0ea5e9" },
    { area: "Astronomy", count: 10, color: "#d946ef" }
  ],
  learningPreference: {
    visual: 70,
    story: 20,
    facts: 10
  },
  favoriteTopics: [
    {
      title: "DNA Structure",
      subject: "Biology",
      views: 24,
      icon: "🧬",
      color: "#8b5cf6"
    },
    {
      title: "Solar System",
      subject: "Astronomy", 
      views: 18,
      icon: "🪐",
      color: "#d946ef"
    }
  ]
}

// Utility function to get avatar URL
const getAvatarUrl = (seed: string, style: string = "avataaars") => {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=transparent`
}

export function ProfilePage() {
  const { user, profile, loading } = useAuth()
  
  // State management
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

  // Prepare chart data
  const studyAreasData = USER_STATS.studyAreasExplored.map(area => ({
    name: area.area,
    value: area.count,
    fill: area.color
  }))

  const learningPreferenceData = [
    { name: "Visual", value: USER_STATS.learningPreference.visual, fill: "#8b5cf6" },
    { name: "Story", value: USER_STATS.learningPreference.story, fill: "#10b981" },
    { name: "Facts", value: USER_STATS.learningPreference.facts, fill: "#f97316" }
  ]

  // Get top achievements
  const topAchievements = ACHIEVEMENTS
    .filter(achievement => achievement.earned)
    .sort((a, b) => {
      const rarityOrder = { gold: 3, silver: 2, bronze: 1 }
      return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder]
    })
    .slice(0, 5)

  // Get favorite topic
  const favoriteDiscovery = USER_STATS.favoriteTopics[0]

  const currentTheme = LAB_THEMES[selectedTheme]
  const currentAvatarTheme = AVATAR_THEMES[selectedAvatar]

  if (loading) {
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
          <div className="max-w-7xl mx-auto">
            <StaggerContainer>
              {/* Header Section */}
              <StaggerItem>
                <div className="text-center mb-8">
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-pink-400 via-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    My Science Lab
                  </h1>
                  <p className="text-white/80 text-lg max-w-3xl mx-auto">
                    Welcome to your personal laboratory! Customize your space, track your discoveries, and showcase your achievements.
                  </p>
                </div>
              </StaggerItem>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column - Profile & Customization */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Avatar Customizer */}
                  <StaggerItem>
                    <Card className="bg-gradient-to-br from-purple-500/40 via-pink-500/40 to-rose-500/40 backdrop-blur-2xl border-2 border-purple-400/60 shadow-2xl shadow-purple-500/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-3">
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
                          <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-r from-purple-400 to-pink-400 p-1">
                            <img
                              src={getAvatarUrl(currentAvatarTheme.seed)}
                              alt="Avatar"
                              className="w-full h-full rounded-full bg-white"
                            />
                          </div>
                          <h3 className="text-white font-semibold mb-2">{currentAvatarTheme.name} Style</h3>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          {AVATAR_THEMES.map((theme, index) => (
                            <Button
                              key={theme.seed}
                              variant={selectedAvatar === index ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleAvatarChange(index)}
                              className={`h-12 ${
                                selectedAvatar === index
                                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                                  : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                              }`}
                            >
                              <div 
                                className="w-6 h-6 rounded-full"
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
                        <CardTitle className="text-white flex items-center gap-3">
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
                              className: "h-8 w-8 text-white"
                            })}
                          </div>
                          <h3 className="text-white font-semibold">{currentTheme.name}</h3>
                          <p className="text-white/70 text-sm">{currentTheme.description}</p>
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
                                className={`h-16 flex flex-col gap-1 ${
                                  selectedTheme === key
                                    ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-0"
                                    : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                                }`}
                              >
                                <IconComponent className="h-5 w-5" />
                                <span className="text-xs">{theme.name.split(' ')[0]}</span>
                              </Button>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>

                  {/* Favorite Discovery */}
                  <StaggerItem>
                    <Card className="bg-gradient-to-br from-yellow-500/40 via-orange-500/40 to-red-500/40 backdrop-blur-2xl border-2 border-yellow-400/60 shadow-2xl shadow-yellow-500/30 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 animate-pulse" />
                      <CardHeader className="relative">
                        <CardTitle className="text-white flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-yellow-500/50 to-orange-500/50 rounded-lg">
                            <Star className="h-5 w-5 text-yellow-200" />
                          </div>
                          Your Favorite Discovery!
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative space-y-3">
                        <div className="text-center">
                          <div className="text-4xl mb-2">{favoriteDiscovery.icon}</div>
                          <h3 className="text-white font-bold text-lg">{favoriteDiscovery.title}</h3>
                          <Badge 
                            className="mt-2"
                            style={{ backgroundColor: `${favoriteDiscovery.color}40`, color: favoriteDiscovery.color }}
                          >
                            {favoriteDiscovery.subject}
                          </Badge>
                          <p className="text-white/80 text-sm mt-2">
                            Explored {favoriteDiscovery.views} times
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                </div>

                {/* Center Column - Trophy Shelf & Charts */}
                <div className="lg:col-span-2 space-y-6">
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
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {topAchievements.map((achievement) => {
                            const IconComponent = achievement.icon
                            return (
                              <div
                                key={achievement.id}
                                className="group relative text-center p-4 rounded-xl bg-gradient-to-b from-amber-400/30 to-yellow-500/30 hover:from-amber-400/50 hover:to-yellow-500/50 transition-all duration-300 hover:scale-105 cursor-pointer"
                              >
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400/20 to-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative">
                                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                                    achievement.rarity === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                                    achievement.rarity === 'silver' ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                                    'bg-gradient-to-r from-amber-600 to-orange-600'
                                  } group-hover:shadow-lg group-hover:shadow-amber-500/50 transition-all duration-300`}>
                                    <IconComponent className="h-6 w-6 text-white" />
                                  </div>
                                  <h4 className="text-white font-semibold text-sm mb-1">{achievement.title}</h4>
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
                        <div className="h-64">
                          <ChartContainer
                            config={{
                              value: {
                                label: "Topics Explored",
                              }
                            }}
                            className="h-full"
                          >
                            <BarChart data={studyAreasData}>
                              <XAxis dataKey="name" />
                              <YAxis />
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

                  {/* Learning Style Donut Chart */}
                  <StaggerItem>
                    <Card className="bg-gradient-to-br from-rose-500/40 via-pink-500/40 to-purple-500/40 backdrop-blur-2xl border-2 border-rose-400/60 shadow-2xl shadow-rose-500/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-rose-500/50 to-pink-500/50 rounded-lg">
                            <Brain className="h-6 w-6 text-rose-200" />
                          </div>
                          Learning Style Analysis
                        </CardTitle>
                        <CardDescription className="text-rose-200/80">
                          How you prefer to learn science
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-6 items-center">
                          <div className="h-48">
                            <ChartContainer
                              config={{
                                visual: {
                                  label: "Visual Learning"
                                },
                                story: {
                                  label: "Story-based"
                                },
                                facts: {
                                  label: "Fact-focused"
                                }
                              }}
                              className="h-full"
                            >
                              <PieChart>
                                <Pie
                                  data={learningPreferenceData}
                                  dataKey="value"
                                  nameKey="name"
                                  innerRadius={40}
                                  outerRadius={80}
                                  paddingAngle={5}
                                >
                                  {learningPreferenceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent />} />
                              </PieChart>
                            </ChartContainer>
                          </div>
                          <div className="space-y-3">
                            {learningPreferenceData.map((item) => (
                              <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.fill }}
                                  />
                                  <span className="text-white/90 text-sm">{item.name}</span>
                                </div>
                                <span className="text-white font-semibold">{item.value}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                </div>
              </div>
            </StaggerContainer>
          </div>
        </div>
      </PageTransition>
    </>
  )
}
