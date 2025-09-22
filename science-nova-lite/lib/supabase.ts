import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Role } from "@/types/domain"

let _client: SupabaseClient | null = null
function initClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: 'supabase.auth.token',
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web',
      },
    },
  })
}

// Lazy proxy so importing this module doesn't require env at build time.
export const supabase = new Proxy({}, {
  get(_target, prop) {
    if (!_client) {
      _client = initClient()
    }
    // @ts-ignore - dynamic proxy to underlying client
    return (_client as any)[prop]
  },
}) as unknown as SupabaseClient

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: Role
          learning_preference: "STORY" | "VISUAL" | "FACTS"
          grade_level: number
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: Role
          learning_preference?: "STORY" | "VISUAL" | "FACTS"
          grade_level: number
        }
        Update: {
          full_name?: string
          role?: Role
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
