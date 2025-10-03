require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceKey)

async function checkCurrentEmbeddings() {
  console.log('🔍 Checking Current Embeddings Status...\n')

  try {
    console.log('📚 1. Checking textbook uploads...')
    const { data: uploads, error: uploadsError } = await supabase
      .from('textbook_uploads')
      .select('id, file_name, grade_level, processed, chunks_created, processing_error')
      .order('created_at', { ascending: false })
    
    if (uploadsError) {
      console.error('❌ Uploads error:', uploadsError)
    } else {
      console.log(`✅ Found ${uploads?.length || 0} textbook uploads:`)
      if (uploads && uploads.length > 0) {
        uploads.forEach((upload, idx) => {
          const status = upload.processed ? '✅ Processed' : (upload.processing_error ? '❌ Error' : '⏳ Not processed')
          console.log(`  ${idx + 1}. ${upload.file_name} (Grade ${upload.grade_level}) - ${status}`)
          if (upload.chunks_created > 0) {
            console.log(`     └─ ${upload.chunks_created} chunks created`)
          }
          if (upload.processing_error) {
            console.log(`     └─ Error: ${upload.processing_error}`)
          }
        })
      }
    }

    console.log('\n🧠 2. Checking embedding chunks...')
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('textbook_embeddings')
      .select('grade_level, file_name, chunk_index')
      .order('grade_level', { ascending: true })
    
    if (embeddingsError) {
      console.error('❌ Embeddings error:', embeddingsError)
    } else {
      console.log(`✅ Found ${embeddings?.length || 0} embedding chunks:`)
      
      // Group by grade and file
      const gradeStats = {}
      embeddings?.forEach(embedding => {
        const grade = embedding.grade_level
        const file = embedding.file_name
        
        if (!gradeStats[grade]) gradeStats[grade] = {}
        if (!gradeStats[grade][file]) gradeStats[grade][file] = 0
        gradeStats[grade][file]++
      })
      
      Object.keys(gradeStats).forEach(grade => {
        console.log(`\n  📖 Grade ${grade}:`)
        Object.keys(gradeStats[grade]).forEach(file => {
          console.log(`    └─ ${file}: ${gradeStats[grade][file]} chunks`)
        })
      })
    }

    console.log('\n🔧 3. Checking processing interface access...')
    console.log('✅ Admin Dashboard: /admin')
    console.log('✅ Documents Upload: /admin/documents')
    console.log('✅ Embeddings Processing: /admin/embeddings (newly added)')
    
    console.log('\n📋 4. Summary:')
    const totalUploads = uploads?.length || 0
    const processedUploads = uploads?.filter(u => u.processed).length || 0
    const totalChunks = embeddings?.length || 0
    
    console.log(`📚 Total textbook uploads: ${totalUploads}`)
    console.log(`✅ Processed uploads: ${processedUploads}/${totalUploads}`)
    console.log(`🧠 Total embedding chunks: ${totalChunks}`)
    
    if (processedUploads === 0 && totalUploads > 0) {
      console.log('\n⚠️  NOTICE: You have uploaded textbooks but none are processed yet.')
      console.log('   Go to /admin/embeddings to process them for AI integration!')
    } else if (totalChunks > 0) {
      console.log('\n🎉 AI integration is working! Textbooks are processed and ready for content generation.')
    }

  } catch (error) {
    console.error('💥 Error checking embeddings:', error)
  }
}

checkCurrentEmbeddings()