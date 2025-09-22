import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, getUserFromAuthHeader, getProfileRole } from '@/lib/server-supabase'

// GET /api/admin/study-areas - List all study areas
export async function GET(request: NextRequest) {
  try {
    const svc = getServiceClient()
    if (!svc) {
      return NextResponse.json({ error: 'Server client unavailable' }, { status: 500 })
    }

    // Check authentication
    const user = await getUserFromAuthHeader(request.headers.get('authorization'))
    if (!user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const role = await getProfileRole(user.userId)
    if (!role || !['ADMIN', 'DEVELOPER'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get study areas
    const { data: studyAreas, error } = await svc
      .from('study_areas')
      .select('id, name, vanta_effect')
      .order('name')

    if (error) {
      console.error('Study areas fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch study areas' }, { status: 500 })
    }

    return NextResponse.json({ studyAreas: studyAreas || [] })
  } catch (error) {
    console.error('Study areas API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
