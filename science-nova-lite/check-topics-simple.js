const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTopics() {
  try {
    const { data: topics, error } = await supabase
      .from('topics')
      .select('*')
      .order('title')

    if (error) {
      console.error('Error:', error.message)
      return
    }

    console.log('📚 Topics in database:')
    topics.forEach(topic => {
      console.log(`- ${topic.title} (Grade ${topic.grade_level}) - ID: ${topic.id}`)
    })

    // Check specifically for Chemistry
    const chemTopics = topics.filter(t => t.title.toLowerCase().includes('chemistry'))
    console.log('\n🧪 Chemistry topics:')
    chemTopics.forEach(topic => {
      console.log(`- ${topic.title} (Grade ${topic.grade_level}) - ID: ${topic.id}`)
    })

  } catch (error) {
    console.error('Unexpected error:', error.message)
  }
}

checkTopics()
