import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') // DISCOVERY, ARCADE, LESSONS
    const subtype = searchParams.get('subtype') // Content type/game type/lesson type
    const status = searchParams.get('status') || 'published'
    const grade = searchParams.get('grade')
    const topic_id = searchParams.get('topic_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    let allResults: any[] = []
    let totalCount = 0

    // Query each table based on category filter or query all if no category specified
    const categoriesToQuery = category ? [category] : ['DISCOVERY', 'ARCADE', 'LESSONS']

    for (const cat of categoriesToQuery) {
      let query: any
      let table: string
      let subtypeField: string

      switch (cat) {
        case 'DISCOVERY':
          table = 'discovery_content'
          subtypeField = 'content_type'
          break
        case 'ARCADE':
          table = 'arcade_games'
          subtypeField = 'game_type'
          break
        case 'LESSONS':
          table = 'lessons'
          subtypeField = 'lesson_type'
          break
        default:
          continue
      }

      query = supabase
        .from(table)
        .select(`
          *,
          topics:topic_id (
            id,
            title,
            grade_level,
            study_area_id,
            study_areas:study_area_id (
              id,
              name
            )
          ),
          profiles:created_by (
            id,
            full_name
          )
        `)
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (subtype) {
        query = query.eq(subtypeField, subtype)
      }
      if (topic_id) {
        query = query.eq('topic_id', topic_id)
      }
      if (grade) {
        query = query.eq('topics.grade_level', parseInt(grade))
      }
      if (search) {
        query = query.ilike('title', `%${search}%`)
      }

      const { data, error, count } = await query

      if (error) {
        console.error(`${cat} content fetch error:`, error)
        continue // Skip this category on error
      }

      if (data) {
        // Add category field to each result for frontend identification
        const categorizedData = data.map((item: any) => ({
          ...item,
          category: cat,
          subtype: item[subtypeField]
        }))
        allResults.push(...categorizedData)
        totalCount += count || 0
      }
    }

    // Sort all results by created_at descending
    allResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply pagination to combined results
    const paginatedResults = allResults.slice(offset, offset + limit)

    return NextResponse.json({
      data: paginatedResults,
      total: totalCount,
      limit,
      offset
    })
  } catch (error) {
    console.error('Content API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category, ...contentData } = body

    // Validate required fields
    if (!category) {
      return NextResponse.json(
        { error: 'Missing required field: category' },
        { status: 400 }
      )
    }

    // Route to appropriate endpoint based on category
    let apiEndpoint: string
    switch (category) {
      case 'DISCOVERY':
        apiEndpoint = '/api/admin/discovery'
        break
      case 'ARCADE':
        apiEndpoint = '/api/admin/arcade'
        break
      case 'LESSONS':
        apiEndpoint = '/api/admin/lessons'
        break
      default:
        return NextResponse.json(
          { error: `Invalid category ${category}. Valid categories: DISCOVERY, ARCADE, LESSONS` },
          { status: 400 }
        )
    }

    // Forward the request to the appropriate specialized endpoint
    const baseUrl = new URL(request.url).origin
    const response = await fetch(`${baseUrl}${apiEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contentData)
    })

    const result = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Content creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, category, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ error: 'Category is required for updates' }, { status: 400 })
    }

    // Route to appropriate endpoint based on category
    let apiEndpoint: string
    switch (category) {
      case 'DISCOVERY':
        apiEndpoint = '/api/admin/discovery'
        break
      case 'ARCADE':
        apiEndpoint = '/api/admin/arcade'
        break
      case 'LESSONS':
        apiEndpoint = '/api/admin/lessons'
        break
      default:
        return NextResponse.json(
          { error: `Invalid category ${category}. Valid categories: DISCOVERY, ARCADE, LESSONS` },
          { status: 400 }
        )
    }

    // Forward the request to the appropriate specialized endpoint
    const baseUrl = new URL(request.url).origin
    const response = await fetch(`${baseUrl}${apiEndpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...updateData })
    })

    const result = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Content update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')

    if (!id) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ error: 'Category is required for deletion' }, { status: 400 })
    }

    // Route to appropriate endpoint based on category
    let apiEndpoint: string
    switch (category) {
      case 'DISCOVERY':
        apiEndpoint = '/api/admin/discovery'
        break
      case 'ARCADE':
        apiEndpoint = '/api/admin/arcade'
        break
      case 'LESSONS':
        apiEndpoint = '/api/admin/lessons'
        break
      default:
        return NextResponse.json(
          { error: `Invalid category ${category}. Valid categories: DISCOVERY, ARCADE, LESSONS` },
          { status: 400 }
        )
    }

    // Forward the request to the appropriate specialized endpoint
    const baseUrl = new URL(request.url).origin
    const response = await fetch(`${baseUrl}${apiEndpoint}?id=${id}`, {
      method: 'DELETE'
    })

    const result = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Content deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}