require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFullAdminIntegration() {
  console.log('🧪 Testing Complete Admin Integration...\n')

  try {
    // First, let's verify we can see the existing data through direct DB access
    console.log('📊 EXISTING DATA VERIFICATION:')
    
    // Use service role for direct access
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Get existing topics
    const { data: existingTopics } = await serviceSupabase
      .from('topics')
      .select(`
        id, title, grade_level, admin_prompt,
        study_areas (name, vanta_effect)
      `)

    console.log(`✅ Found ${existingTopics?.length || 0} existing topics:`)
    existingTopics?.forEach(topic => {
      console.log(`  - "${topic.title}" (Grade ${topic.grade_level})`)
      console.log(`    Study Area: ${topic.study_areas?.name || 'None'}`)
    })

    // Get existing textbook uploads
    const { data: existingUploads } = await serviceSupabase
      .from('textbook_uploads')
      .select('name, grade_level, chunks_created, processed')

    console.log(`\n✅ Found ${existingUploads?.length || 0} textbook uploads:`)
    const totalChunks = existingUploads?.reduce((sum, upload) => sum + (upload.chunks_created || 0), 0) || 0
    existingUploads?.forEach(upload => {
      console.log(`  - "${upload.name}" (Grade ${upload.grade_level}) - ${upload.chunks_created} chunks`)
    })
    console.log(`📊 Total chunks: ${totalChunks}`)

    // Get study areas
    const { data: studyAreas } = await serviceSupabase
      .from('study_areas')
      .select('name, vanta_effect')

    console.log(`\n✅ Found ${studyAreas?.length || 0} study areas:`)
    studyAreas?.forEach(area => {
      console.log(`  - ${area.name} (${area.vanta_effect})`)
    })

    console.log('\n' + '='.repeat(50))
    console.log('🎯 SUMMARY:')
    console.log(`📚 Topics: ${existingTopics?.length || 0}`)
    console.log(`📖 Textbooks: ${existingUploads?.length || 0}`)
    console.log(`📝 Chunks: ${totalChunks}`)
    console.log(`🔬 Study Areas: ${studyAreas?.length || 0}`)
    console.log('='.repeat(50))

    console.log('\n✅ The admin dashboard should now display this existing data!')
    console.log('🌐 Visit: http://localhost:3000/admin')
    console.log('📋 Expected to see:')
    console.log(`   - ${existingTopics?.length || 0} topics in the topics section`)
    console.log(`   - ${totalChunks} textbook chunks in stats`)
    console.log(`   - ${studyAreas?.length || 0} study areas available`)
    console.log(`   - Functional Create Topic, Upload Textbook, and Process buttons`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testFullAdminIntegration()
