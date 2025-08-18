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

  useEffect(() => {
    if (!user) {
      router.replace("/login")
      return
    }
    setFullName(profile?.full_name || "")
    setGradeLevel(String(profile?.grade_level ?? ""))
    setLearningPreference(profile?.learning_preference || "")
    setLoading(false)
  }, [user, profile, router])

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          grade_level: gradeLevel ? Number(gradeLevel) : null,
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
              <CardTitle className="text-2xl">Student Profile</CardTitle>
              <CardDescription>
                Keep your details up to date for personalized lessons.
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
                <div className="grid gap-2">
                  <Label>Grade level</Label>
                  <Select value={gradeLevel} onValueChange={setGradeLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((g) => (
                        <SelectItem key={g} value={g}>
                          Grade {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  <span className="text-gray-600">Grade</span>
                  <span className="font-medium">{gradeLevel ? `Grade ${gradeLevel}` : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Preference</span>
                  <span className="font-medium">{learningPreference || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </VantaBackground>
  )
}
