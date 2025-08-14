"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { LogIn, Mail, Lock, Rocket } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Navbar } from "@/components/layout/navbar"
import { VantaBackground } from "@/components/vanta-background"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast({ title: "Welcome back!", description: "You're now signed in." })
      router.push("/")
    } catch (err: any) {
      toast({ title: "Sign in failed", description: err.message || "Please check your credentials.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <VantaBackground>
      <Navbar />
      <div className="container mx-auto px-4 py-10 flex items-center justify-center">
        <Card className="w-full max-w-md border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-600" /> Sign in
            </CardTitle>
            <CardDescription>Access your Science Nova account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" placeholder="••••••••" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="h-4 w-4 mr-2" /> {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <div className="text-sm text-center text-gray-600 mt-4">
              Don't have an account? <Link href="/" className="text-blue-600 hover:underline">Return home</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </VantaBackground>
  )
}
