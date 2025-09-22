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
  const [isSignUp, setIsSignUp] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        })
        if (error) throw error
        
        // Create profile for new user with STUDENT role
        if (data.user && !data.user.email_confirmed_at) {
          toast({ 
            title: "Check your email", 
            description: "Please check your email and click the confirmation link to complete registration." 
          })
        } else if (data.user) {
          // Auto-confirm for development - create profile immediately
          await createUserProfile(data.user.id, email)
          toast({ title: "Welcome!", description: "Your account has been created successfully." })
          router.push("/")
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast({ title: "Welcome back!", description: "You're now signed in." })
        router.push("/")
      }
    } catch (err: any) {
      toast({ 
        title: isSignUp ? "Sign up failed" : "Sign in failed", 
        description: err.message || "Please check your credentials.", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const createUserProfile = async (userId: string, userEmail: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: '',
          role: 'STUDENT', // This will be cast by PostgreSQL
          learning_preference: 'VISUAL', // This will be cast by PostgreSQL
          email: userEmail,
          grade_level: 3, // Default to grade 3
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (error && error.code !== '23505') { // Ignore duplicate key error (profile already exists)
        console.error('Error creating profile:', error)
        throw new Error(`Database error creating new user: ${error.message}`)
      }
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  }

  return (
    <VantaBackground>
      <Navbar />
      <div className="container mx-auto px-4 py-10 flex items-center justify-center">
        <Card className="w-full max-w-md border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-600" /> 
              {isSignUp ? "Create Account" : "Sign in"}
            </CardTitle>
            <CardDescription>
              {isSignUp ? "Join Science Nova and start your learning journey" : "Access your Science Nova account"}
            </CardDescription>
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
                  <Input 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="pl-9" 
                    placeholder="••••••••"
                    minLength={isSignUp ? 6 : undefined}
                  />
                </div>
                {isSignUp && (
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="h-4 w-4 mr-2" /> 
                {loading 
                  ? (isSignUp ? "Creating account..." : "Signing in...") 
                  : (isSignUp ? "Create Account" : "Sign in")
                }
              </Button>
            </form>
            <div className="text-sm text-center text-gray-600 mt-4">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <button 
                    type="button"
                    onClick={() => setIsSignUp(false)} 
                    className="text-blue-600 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button 
                    type="button"
                    onClick={() => setIsSignUp(true)} 
                    className="text-blue-600 hover:underline"
                  >
                    Create one
                  </button>
                </>
              )}
            </div>
            <div className="text-sm text-center text-gray-600 mt-2">
              Or <Link href="/" className="text-blue-600 hover:underline">return home</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </VantaBackground>
  )
}
