import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type StudentProfile = {
  id: string
  email: string
  full_name: string
  grade_level: number | null
  role: string
  created_at: string
  last_sign_in_at: string | null
}

export async function GET(req: NextRequest) {
  console.log('Students API called')
  
  try {
    // Get auth header
    const authHeader = req.headers.get('authorization')
    console.log('Auth header present:', !!authHeader)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid auth header')
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }
    const token = authHeader.substring(7)
    console.log('Token extracted, length:', token.length)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Supabase URL present:', !!supabaseUrl)
    console.log('Supabase anon key present:', !!supabaseAnonKey)
    console.log('Supabase service key present:', !!supabaseServiceKey)
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('Missing Supabase configuration')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
    }

    // Create user client to verify token
    console.log('Creating user Supabase client...')
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, { 
      global: { headers: { Authorization: authHeader } } 
    })
    
    console.log('Getting user from token...')
    const { data: { user }, error: userError } = await userSupabase.auth.getUser(token)
    console.log('User result:', !!user, 'Error:', userError)
    if (userError || !user) {
      console.log('Invalid user session:', userError)
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 })
    }

    // Create service client for admin operations (use service key if available, otherwise anon key)
    console.log('Creating service client...')
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)
    
    // Check user role
    console.log('Checking user role for user:', user.id)
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    console.log('User role:', profile?.role)
    if (!profile?.role || !['TEACHER', 'ADMIN', 'DEVELOPER'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')))
    const search = url.searchParams.get('search') || ''
    const sortBy = url.searchParams.get('sortBy') || 'created_at'
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    
    const offset = (page - 1) * limit

    // Build query for students - we can only access profiles table columns
    console.log('Building query for students...')
    let query = serviceClient
      .from('profiles')
      .select(`
        id,
        full_name,
        grade_level,
        role,
        created_at
      `)
      .eq('role', 'STUDENT')

    // Add search filter if provided
    if (search) {
      console.log('Adding search filter:', search)
      query = query.or(`full_name.ilike.%${search}%`)
    }

    // Add sorting
    console.log('Adding sort:', sortBy, sortOrder)
    if (sortBy === 'name') {
      query = query.order('full_name', { ascending: sortOrder === 'asc' })
    } else {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    // Get total count for pagination
    console.log('Getting total count...')
    const { count: totalCount, error: countError } = await serviceClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'STUDENT')

    if (countError) {
      console.error('Count query error:', countError)
      return NextResponse.json({ error: 'Failed to count students' }, { status: 500 })
    }
    console.log('Total count:', totalCount)

    // Get paginated results
    console.log('Fetching paginated results, offset:', offset, 'limit:', limit)
    const { data: rawStudents, error } = await query
      .range(offset, offset + limit - 1)

    console.log('Query completed. Students count:', rawStudents?.length, 'Error:', error)
    if (error) {
      console.error('Students fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    // Transform the data to match expected format
    const students = (rawStudents || []).map((student: any) => ({
      id: student.id,
      email: 'Email not available', // We can't access auth.users.email from profiles
      name: student.full_name,
      grade_level: student.grade_level,
      role: student.role,
      created_at: student.created_at,
      last_sign_in_at: null // We can't access auth.users.last_sign_in_at from profiles
    }))

    // Calculate pagination info
    const totalPages = Math.ceil((totalCount || 0) / limit)
    
    const response = {
      students: students || [],
      pagination: {
        page,
        limit,
        totalCount: totalCount || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }

    const res = NextResponse.json(response)
    res.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=300')
    res.headers.set('Vary', 'Authorization')
    return res

  } catch (error) {
    console.error('Admin students API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
