import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PUT(request: NextRequest) {
  try {
    const { full_name, grade_level, learning_preference } = await request.json()
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }
    const token = authHeader.substring(7)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const userSupabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } })

    const { data: { user } } = await userSupabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Invalid user session' }, { status: 401 })

    // Get user's current role to determine if grade level is required
    const { data: currentProfile } = await userSupabase.from('profiles').select('role').eq('id', user.id).single()
    const userRole = currentProfile?.role || 'STUDENT'
    const isPrivileged = userRole === 'ADMIN' || userRole === 'TEACHER' || userRole === 'DEVELOPER'

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }
    
    // Grade level is only required for students
    if (!isPrivileged && grade_level && (typeof grade_level !== 'number' || grade_level < 1 || grade_level > 12)) {
      return NextResponse.json({ error: 'Grade level must be between 1 and 12' }, { status: 400 })
    }
    
    // Allow privileged users to have null grade level
    if (isPrivileged && grade_level && (typeof grade_level !== 'number' || grade_level < 1 || grade_level > 12)) {
      return NextResponse.json({ error: 'If specified, grade level must be between 1 and 12' }, { status: 400 })
    }

    const { data, error } = await userSupabase
      .from('profiles')
      .update({ 
        full_name: full_name.trim(), 
        grade_level: grade_level || null, 
        learning_preference: learning_preference || null, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: data, message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Profile update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }
    const token = authHeader.substring(7)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const userSupabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } })

    const { data: { user } } = await userSupabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Invalid user session' }, { status: 401 })

    const { data: profile, error } = await userSupabase.from('profiles').select('*').eq('id', user.id).single()
    if (error) {
      console.error('Profile fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Profile fetch API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
