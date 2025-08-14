import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const gradeLevel = formData.get('gradeLevel') as string
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!gradeLevel || !name?.trim()) {
      return NextResponse.json({ error: 'Name and grade level are required' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 50MB' }, { status: 400 })
    }    // Generate file path: grade_{level}/{sanitized_name}_{timestamp}.pdf
    const timestamp = Date.now()
    const sanitizedName = name.trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')
    const filePath = `grade_${gradeLevel}/${sanitizedName}_${timestamp}.pdf`

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(buffer)

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('textbook_content')
      .upload(filePath, fileBuffer, {
        contentType: 'application/pdf',        metadata: {
          name,
          gradeLevel,
          description: description || '',
          originalName: file.name,
          uploadedBy: user.id,
          uploadedAt: new Date().toISOString(),
        },
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }    // Log the upload in database
    const { error: logError } = await supabase
      .from('textbook_uploads')
      .insert({
        name: name.trim(),
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        grade_level: parseInt(gradeLevel),
        description: description || null,
        uploaded_by: user.id,
        processed: false,
      })

    if (logError) {
      console.error('Database log error:', logError)
      // Don't fail the upload if logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Textbook uploaded successfully',
      filePath,
      fileSize: file.size,
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  console.log('🔍 GET /api/upload-textbook called')
  
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    console.log('🔐 Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.log('❌ No authorization header')
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('👤 Profile lookup result:', profile)
    
    if (!profile || profile.role !== 'ADMIN') {
      console.log('❌ Admin access denied. Profile:', profile, 'Role:', profile?.role)
      return NextResponse.json({ error: 'Admin access required', userRole: profile?.role || 'not found' }, { status: 403 })
    }

    console.log('✅ Admin access confirmed')
    
    // Get uploaded textbooks from database
    // Try with name field first, fallback if it doesn't exist
    console.log('🗄️ Querying textbook_uploads table...')
    let { data: textbooks, error } = await supabase
      .from('textbook_uploads')
      .select(`
        id,
        name,
        file_name,
        file_path,
        file_size,
        grade_level,
        description,
        processed,        chunks_created,
        created_at,
        uploader:profiles!uploaded_by (
          full_name
        )
      `)
      .order('created_at', { ascending: false })

    // If name column doesn't exist, fallback to basic query
    if (error && error.message?.includes('column "name" does not exist')) {
      console.log('Name column not found, falling back to basic query')
      const fallbackResult = await supabase
        .from('textbook_uploads')
        .select(`
          id,
          file_name,
          file_path,
          file_size,
          grade_level,
          description,
          processed,
          chunks_created,          created_at,
          uploader:profiles!uploaded_by (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
      
      textbooks = fallbackResult.data?.map(textbook => ({
        ...textbook,
        name: textbook.file_name || 'Untitled Textbook' // Use filename as fallback name
      })) || null
      error = fallbackResult.error
    }

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch textbooks', 
        details: error.message 
      }, { status: 500 })
    }

    console.log('Fetched textbooks:', textbooks?.length || 0, 'records')

    // Get storage files to cross-reference
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('textbook_content')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (storageError) {
      console.error('Storage error:', storageError)
    }

    return NextResponse.json({
      uploads: textbooks || [], // Use 'uploads' to match admin dashboard expectations
      textbooks: textbooks || [], // Keep both for compatibility
      storageFiles: storageFiles || [],
    })

  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get file path from request
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    const textbookId = searchParams.get('id')

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('textbook_content')
      .remove([filePath])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      return NextResponse.json({ error: 'Failed to delete file from storage' }, { status: 500 })
    }

    // Delete from database if textbook ID provided
    if (textbookId) {
      const { error: dbError } = await supabase
        .from('textbook_uploads')
        .delete()
        .eq('id', textbookId)

      if (dbError) {
        console.error('Database delete error:', dbError)
        // Don't fail if database delete fails, file is already deleted from storage
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Textbook deleted successfully',
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
