import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create the Supabase client with proper cookie-based configuration for Next.js 15
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    // Ensure cookies are used for session storage (default behavior)
    // This enables proper server-side authentication
    storageKey: 'supabase.auth.token',
  },
  // Configure for proper cookie handling
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
  },
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: "STUDENT" | "ADMIN"
          learning_preference: "STORY" | "VISUAL" | "FACTS"
          grade_level: number
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: "STUDENT" | "ADMIN"
          learning_preference?: "STORY" | "VISUAL" | "FACTS"
          grade_level: number
        }
        Update: {
          full_name?: string
          role?: "STUDENT" | "ADMIN"
          learning_preference?: "STORY" | "VISUAL" | "FACTS"
          grade_level?: number
        }
      }
      study_areas: {
        Row: {
          id: string
          name: string
          vanta_effect: string
          created_at: string
        }
      }
      topics: {
        Row: {
          id: string
          title: string
          grade_level: number
          study_area_id: string
          admin_prompt: string | null
          creator_id: string
          created_at: string
        }
        Insert: {
          title: string
          grade_level: number
          study_area_id: string
          admin_prompt?: string
          creator_id: string
        }
      }
      content_cache: {
        Row: {
          id: string
          topic_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          topic_id: string
          user_id: string
          content: string
        }
      }
    }
  }
}
