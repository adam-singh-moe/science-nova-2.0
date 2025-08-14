require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceKey)

async function checkTopicsSchema() {
  console.log('🔍 Checking topics table schema and data...\n')

  try {
    // Get sample topic to see structure
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('*')
      .limit(3)
    
    if (topicsError) {
      console.error('❌ Topics error:', topicsError)
      return
    }

    console.log('📚 Sample topics structure:')
    topics?.forEach((topic, index) => {
      console.log(`\n${index + 1}. ${topic.title}`)
      console.log('   Structure:', JSON.stringify(topic, null, 2))
    })

    // Check if there's a relationship table for topics and study areas
    try {
      const { data: relationships, error: relError } = await supabase
        .from('topic_study_areas')
        .select('*')
        .limit(3)
      
      if (!relError) {
        console.log('\n🔗 Topic-Study Area relationships found:')
        relationships?.forEach(rel => {
          console.log('   ', JSON.stringify(rel, null, 2))
        })
      }
    } catch (e) {
      console.log('\n❌ No topic_study_areas table found')
    }

    // Check textbook uploads structure
    console.log('\n📖 Sample textbook uploads:')
    const { data: uploads, error: uploadsError } = await supabase
      .from('textbook_uploads')
      .select('*')
      .limit(2)
    
    if (uploadsError) {
      console.error('❌ Uploads error:', uploadsError)
    } else {
      uploads?.forEach((upload, index) => {
        console.log(`\n${index + 1}. ${upload.name}`)
        console.log('   Structure:', JSON.stringify(upload, null, 2))
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkTopicsSchema()
