const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkContent() {
  try {
    // First get all topics
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('*')
      .order('title')

    if (topicsError) {
      console.error('Topics Error:', topicsError.message)
      return
    }

    console.log('📚 Topics in database:')
    topics.forEach(topic => {
      console.log(`- ${topic.title} (Grade ${topic.grade_level}) - ID: ${topic.id}`)
    })

    // Now check content entries
    const { data: content, error: contentError } = await supabase
      .from('topic_content_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (contentError) {
      console.error('Content Error:', contentError.message)
      return
    }

    console.log('\n📝 Content entries in database:')
    content.forEach(entry => {
      const topic = topics.find(t => t.id === entry.topic_id)
      const topicTitle = topic ? topic.title : 'Unknown Topic'
      console.log(`- ${entry.title || 'Untitled'} (${entry.category}/${entry.subtype}) - Topic: ${topicTitle} - Status: ${entry.status}`)
    })

    // Check specifically for Discovery content
    const discoveryContent = content.filter(c => c.category === 'DISCOVERY' && c.status === 'published')
    console.log('\n🔍 Published Discovery content:')
    discoveryContent.forEach(entry => {
      const topic = topics.find(t => t.id === entry.topic_id)
      const topicTitle = topic ? topic.title : 'Unknown Topic'
      console.log(`- ${entry.title || 'Untitled'} - Topic: ${topicTitle}`)
    })

    // Check specifically for Arcade content
    const arcadeContent = content.filter(c => c.category === 'ARCADE' && c.status === 'published')
    console.log('\n🎮 Published Arcade content:')
    arcadeContent.forEach(entry => {
      const topic = topics.find(t => t.id === entry.topic_id)
      const topicTitle = topic ? topic.title : 'Unknown Topic'
      console.log(`- ${entry.title || 'Untitled'} (${entry.subtype}) - Topic: ${topicTitle}`)
    })

  } catch (error) {
    console.error('Unexpected error:', error.message)
  }
}

checkContent()