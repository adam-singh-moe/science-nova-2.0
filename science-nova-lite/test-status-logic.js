require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testStatusEndpointLogic() {
  try {
    console.log('--- Testing Status Endpoint Logic ---')
    
    // Fetch documents from storage buckets (same logic as status endpoint)
    const [curriculumResponse, textbooksResponse] = await Promise.all([
      supabase.storage.from('Curriculums').list(),
      supabase.storage.from('textbook_content').list()
    ])
    
    const allDocs = []
    
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
    
    console.log('Found documents:', allDocs.length)
    allDocs.forEach(doc => console.log(`- ${doc.name} (${doc.path})`))

    // Check which documents have embeddings (are processed)
    console.log('\n--- Checking Processing Status ---')
    const documentStatuses = []
    
    for (const doc of allDocs) {
      const { count, error } = await supabase
        .from('textbook_embeddings')
        .select('*', { count: 'exact', head: true })  
        .eq('file_name', doc.name)
      
      if (error) {
        console.error('Error checking embeddings for document:', doc.name, error)
        documentStatuses.push({ ...doc, processed: false, chunkCount: 0 })
      } else {
        const chunkCount = count || 0
        const processed = chunkCount > 0
        console.log(`${doc.name}: ${chunkCount} chunks (${processed ? 'PROCESSED' : 'NEEDS PROCESSING'})`)
        documentStatuses.push({ 
          ...doc, 
          processed, 
          chunkCount 
        })
      }
    }

    // Calculate summary statistics
    const summary = {
      total: documentStatuses.length,
      processed: documentStatuses.filter(doc => doc.processed).length,
      needsProcessing: documentStatuses.filter(doc => !doc.processed).length,
      totalChunks: documentStatuses.reduce((sum, doc) => sum + doc.chunkCount, 0)
    }

    console.log('\n--- Summary ---')
    console.log('Total documents:', summary.total)
    console.log('Processed:', summary.processed) 
    console.log('Needs processing:', summary.needsProcessing)
    console.log('Total chunks:', summary.totalChunks)

    const response = {
      documents: documentStatuses,
      summary
    }

    console.log('\n--- Final Response ---')
    console.log(JSON.stringify(response, null, 2))

  } catch (error) {
    console.error('Test error:', error)
  }
}

testStatusEndpointLogic()