import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  console.log('🔍 DEBUG: Testing API access...')
  
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header', step: 1 }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', step: 2, authError: authError?.message }, { status: 401 })
    }    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ 
        error: 'Profile lookup failed', 
        step: 3, 
        profileError: profileError.message 
      }, { status: 500 })
    }

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Admin access required', 
        step: 4, 
        userRole: profile?.role || 'not found',
        userId: user.id 
      }, { status: 403 })
    }

    // Test textbook_uploads table
    const { data: textbooks, error: textbookError } = await supabase
      .from('textbook_uploads')
      .select('id, file_name, created_at')
      .limit(1)

    if (textbookError) {
      return NextResponse.json({ 
        error: 'Textbook table query failed', 
        step: 5, 
        textbookError: textbookError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'All checks passed',
      user: { id: user.id, email: user.email },
      profile: profile,
      textbookCount: textbooks?.length || 0,
      sampleTextbook: textbooks?.[0] || null
    })

  } catch (error: any) {
    console.error('💥 Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', step: 'catch', details: error.message },
      { status: 500 }
    )
  }
}
