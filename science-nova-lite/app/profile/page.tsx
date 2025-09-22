"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScienceLoading } from "@/components/ui/science-loading"
import { useToast } from "@/hooks/use-toast"
import { Navbar } from "@/components/layout/navbar"
import { VantaBackground } from "@/components/vanta-background"

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [fullName, setFullName] = useState("")
  const [gradeLevel, setGradeLevel] = useState<string>("")
  const [learningPreference, setLearningPreference] = useState<string>("")
  const [loading, setLoading] = useState(true)

  // Check if user is privileged (admin/teacher/developer)
  const isPrivileged = profile?.role === 'ADMIN' || profile?.role === 'TEACHER' || profile?.role === 'DEVELOPER'

  useEffect(() => {
    if (!user) {
      router.replace("/login")
      return
    }
    setFullName(profile?.full_name || "")
    // Handle grade level initialization - don't show grade for privileged users
    let initialGradeLevel = ""
    if (isPrivileged) {
      initialGradeLevel = "" // Don't show any grade for privileged users
    } else if (profile?.grade_level && profile.grade_level >= 1 && profile.grade_level <= 6) {
      initialGradeLevel = String(profile.grade_level)
    } else if (!isPrivileged) {
      initialGradeLevel = ""
    }
    setGradeLevel(initialGradeLevel)
    setLearningPreference(profile?.learning_preference || "")
    setLoading(false)
  }, [user, profile, router])

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      // For privileged users, save 0 as grade level to represent access to all grades
      let gradeToSave: string | number | null = null
      
      if (isPrivileged) {
        gradeToSave = 0
      } else if (gradeLevel && gradeLevel !== "all_grades") {
        gradeToSave = Number(gradeLevel)
      }
      
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          grade_level: gradeToSave,
          learning_preference: learningPreference || null,
        })
        .eq("id", user.id)

      if (error) throw error

      await refreshProfile?.()
      toast({ title: "Profile updated", description: "Your settings have been saved." })
    } catch (err: any) {
      toast({
        title: "Couldn't save profile",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <ScienceLoading />
      </div>
    )
  }

  return (
    <VantaBackground>
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl">
                {isPrivileged ? `${profile?.role} Profile` : 'Student Profile'}
              </CardTitle>
              <CardDescription>
                {isPrivileged 
                  ? 'Manage your account settings and preferences.'
                  : 'Keep your details up to date for personalized lessons.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSave} className="grid gap-6 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <Label>Full name</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                
                {/* Grade level - Only show for students */}
                {!isPrivileged && (
                  <div className="grid gap-2">
                    <Label>
                      Grade level 
                    </Label>
                    <Select value={gradeLevel} onValueChange={setGradeLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 6 }, (_, i) => String(i + 1)).map((g) => (
                          <SelectItem key={g} value={g}>
                            Grade {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label>Learning preference</Label>
                  <Select value={learningPreference} onValueChange={setLearningPreference}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        { label: "Visual", value: "VISUAL" },
                        { label: "Story", value: "STORY" },
                        { label: "Facts", value: "FACTS" },
                      ].map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit">Save changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <Card className="border bg-white/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Your Settings</CardTitle>
              <CardDescription>Current profile snapshot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name</span>
                  <span className="font-medium">{fullName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium">{user?.email || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Role</span>
                  <span className="font-medium capitalize">{profile?.role?.toLowerCase() || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Grade</span>
                  <span className="font-medium">
                    {isPrivileged 
                      ? (gradeLevel && gradeLevel !== "all_grades" ? `Grade ${gradeLevel}` : "All Grades") 
                      : (gradeLevel ? `Grade ${gradeLevel}` : "—")
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Preference</span>
                  <span className="font-medium">{learningPreference || "—"}</span>
                </div>
                {isPrivileged && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700">
                      <strong>Access Level:</strong> You have {profile?.role?.toLowerCase()} privileges and can access all content regardless of grade level settings.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </VantaBackground>
  )
}
