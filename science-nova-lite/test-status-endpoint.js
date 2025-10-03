require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Service Key exists:', !!supabaseServiceKey)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testStatus() {
  try {
    console.log('\n--- Checking textbook_embeddings table ---')
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('textbook_embeddings')
      .select('document_name, created_at')
      .limit(10)

    if (embeddingsError) {
      console.error('Error fetching embeddings:', embeddingsError)
    } else {
      console.log('Embeddings found:', embeddings?.length || 0)
      embeddings?.forEach(e => console.log(`- ${e.document_name} (${e.created_at})`))
    }

    console.log('\n--- Checking textbook_content bucket ---')
    const { data: textbookFiles, error: textbookError } = await supabase.storage
      .from('textbook_content')
      .list()

    if (textbookError) {
      console.error('Error listing textbook files:', textbookError)
    } else {
      console.log('Textbook folders found:', textbookFiles?.length || 0)
      for (const folder of textbookFiles || []) {
        if (folder.name.startsWith('grade_')) {
          const { data: gradeFiles } = await supabase.storage
            .from('textbook_content')
            .list(folder.name)
          
          console.log(`\n${folder.name}:`)
          gradeFiles?.forEach(file => {
            if (file.name.endsWith('.pdf')) {
              console.log(`  - ${file.name}`)
            }
          })
        }
      }
    }

    // Test the status logic
    console.log('\n--- Testing document status logic ---')
    const testDoc = 'Science Around Us Book 1.pdf'
    const { count, error } = await supabase
      .from('textbook_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('document_name', testDoc)

    if (error) {
      console.error('Error checking embeddings count:', error)
    } else {
      console.log(`${testDoc} has ${count} chunks`)
    }

  } catch (error) {
    console.error('Test error:', error)
  }
}

testStatus()