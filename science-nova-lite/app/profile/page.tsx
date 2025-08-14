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
    setGradeLevel(String(profile?.grade_level || ""))
    setLearningPreference(profile?.learning_preference || "")
    setLoading(false)
  }, [user, profile, router])

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const { error } = await supabase.from("profiles").update({ full_name: fullName, grade_level: Number(gradeLevel), learning_preference: learningPreference }).eq("id", user.id)
      if (error) throw error
      toast({ title: "Profile updated" })
      await refreshProfile?.()
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message || "Please try again.", variant: "destructive" })
    }
  }

  if (loading) {
    return <ScienceLoading message="Loading your profile..." />
  }

  return (
    <VantaBackground>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto border-2 border-gray-200">
          <CardHeader>
            <CardTitle>Student Profile</CardTitle>
            <CardDescription>Update your details and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSave} className="space-y-6">
              <div className="grid gap-2">
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="grid gap-2">
                <Label>Grade level</Label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((g) => (
                      <SelectItem key={g} value={g}>Grade {g}</SelectItem>
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
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </VantaBackground>
  )
}
