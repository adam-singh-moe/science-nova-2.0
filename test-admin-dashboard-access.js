require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceKey)

async function testAdminDashboardDataAccess() {
  console.log('🧪 Testing Admin Dashboard Data Access...\n')

  try {
    // Test what the admin dashboard should now see
    console.log('📚 Testing topics access...')
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select(`
        *,
        study_areas (
          id,
          name,
          vanta_effect
        )
      `)
      .order('created_at', { ascending: false })

    if (topicsError) {
      console.error('❌ Topics error:', topicsError)
    } else {
      console.log(`✅ Topics accessible: ${topics?.length || 0}`)
    }

    console.log('\n🔬 Testing study areas access...')
    const { data: studyAreas, error: studyAreasError } = await supabase
      .from('study_areas')
      .select('*')
      .order('name')

    if (studyAreasError) {
      console.error('❌ Study areas error:', studyAreasError)
    } else {
      console.log(`✅ Study areas accessible: ${studyAreas?.length || 0}`)
    }

    console.log('\n📖 Testing textbook uploads access...')
    const { data: uploads, error: uploadsError } = await supabase
      .from('textbook_uploads')
      .select('*')

    if (uploadsError) {
      console.error('❌ Uploads error:', uploadsError)
    } else {
      console.log(`✅ Textbook uploads accessible: ${uploads?.length || 0}`)
    }

    console.log('\n📝 Testing embeddings access...')
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('textbook_embeddings')
      .select('grade_level, file_name')

    if (embeddingsError) {
      console.error('❌ Embeddings error:', embeddingsError)
    } else {
      console.log(`✅ Textbook embeddings accessible: ${embeddings?.length || 0} chunks`)
      
      // Calculate grade stats like the admin dashboard will
      const gradeStats = embeddings?.reduce((acc, embedding) => {
        const existing = acc.find(stat => stat.grade === embedding.grade_level)
        if (existing) {
          existing.chunks += 1
          if (!existing.files.includes(embedding.file_name)) {
            existing.files.push(embedding.file_name)
          }
        } else {
          acc.push({
            grade: embedding.grade_level,
            files: [embedding.file_name],
            chunks: 1
          })
        }
        return acc
      }, []) || []

      console.log('\n📊 Grade-level breakdown:')
      gradeStats.forEach(stat => {
        console.log(`  Grade ${stat.grade}: ${stat.chunks} chunks from ${stat.files.length} files`)
      })
    }

    console.log('\n🎯 EXPECTED ADMIN DASHBOARD RESULTS:')
    console.log(`📚 Topics: ${topics?.length || 0}`)
    console.log(`🔬 Study Areas: ${studyAreas?.length || 0}`)
    console.log(`📝 Total Chunks: ${embeddings?.length || 0}`)
    console.log(`📖 Textbook Files: ${uploads?.length || 0}`)
    console.log('\n✅ All data should now be visible in the admin dashboard!')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testAdminDashboardDataAccess()
