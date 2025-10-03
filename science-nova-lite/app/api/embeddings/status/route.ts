import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/server-supabase'

interface Document {
  id: string
  name: string  
  path: string
}

interface DocumentStatus extends Document {
  processed: boolean
  chunkCount: number
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    // Fetch documents from storage buckets (same logic as documents API)
    const [curriculumResponse, textbooksResponse] = await Promise.all([
      supabase.storage.from('Curriculums').list(),
      supabase.storage.from('textbook_content').list()
    ])
    
    const allDocs: Document[] = []
    
    // Process curriculum documents
    if (curriculumResponse.data) {
      for (const folder of curriculumResponse.data) {
        if (folder.name.startsWith('grade_')) {
          // Get files within each grade folder
          const { data: gradeFiles } = await supabase.storage
            .from('Curriculums')
            .list(folder.name)
          
          if (gradeFiles) {
            for (const file of gradeFiles) {
              if (file.name.endsWith('.pdf')) {
                allDocs.push({
                  id: `${folder.name}/${file.name}`,
                  name: file.name,
                  path: `${folder.name}/${file.name}`
                })
              }
            }
          }
        }
      }
    }
    
    // Process textbook documents
    if (textbooksResponse.data) {
      for (const folder of textbooksResponse.data) {
        if (folder.name.startsWith('grade_')) {
          // Get files within each grade folder
          const { data: gradeFiles } = await supabase.storage
            .from('textbook_content')
            .list(folder.name)
          
          if (gradeFiles) {
            for (const file of gradeFiles) {
              if (file.name.endsWith('.pdf')) {
                allDocs.push({
                  id: `${folder.name}/${file.name}`, 
                  name: file.name,
                  path: `${folder.name}/${file.name}`
                })
              }
            }
          }
        }
      }
    }

    // Check which documents have embeddings (are processed)
    const documentStatuses: DocumentStatus[] = await Promise.all(
      allDocs.map(async (doc: Document) => {
        const { count, error } = await supabase
          .from('textbook_embeddings')
          .select('*', { count: 'exact', head: true })  
          .eq('file_name', doc.name)
        
        if (error) {
          console.error('Error checking embeddings for document:', doc.name, error)
          return { ...doc, processed: false, chunkCount: 0 }
        }
        
        const chunkCount = count || 0
        return { 
          ...doc, 
          processed: chunkCount > 0, 
          chunkCount 
        }
      })
    )

    // Calculate summary statistics
    const summary = {
      total: documentStatuses.length,
      processed: documentStatuses.filter((doc: DocumentStatus) => doc.processed).length,
      needsProcessing: documentStatuses.filter((doc: DocumentStatus) => !doc.processed).length,
      totalChunks: documentStatuses.reduce((sum: number, doc: DocumentStatus) => sum + doc.chunkCount, 0)
    }

    return NextResponse.json({
      documents: documentStatuses,
      summary
    })

  } catch (error) {
    console.error('Error in embeddings status endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}