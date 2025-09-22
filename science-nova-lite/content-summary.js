const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function showContentSummary() {
  try {
    // Get all topics
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('*')
      .order('grade_level', { ascending: true })

    if (topicsError) {
      console.error('Topics Error:', topicsError.message)
      return
    }

    // Get all content
    const { data: content, error: contentError } = await supabase
      .from('topic_content_entries')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (contentError) {
      console.error('Content Error:', contentError.message)
      return
    }

    console.log('🎉 SCIENCE NOVA CONTENT SUMMARY')
    console.log('=====================================\n')

    // Group content by topic
    topics.forEach(topic => {
      const topicContent = content.filter(c => c.topic_id === topic.id)
      
      if (topicContent.length > 0) {
        console.log(`📚 ${topic.title} (Grade ${topic.grade_level})`)
        console.log('─'.repeat(50))
        
        // Discovery content
        const discoveryContent = topicContent.filter(c => c.category === 'DISCOVERY')
        if (discoveryContent.length > 0) {
          console.log('\n🔍 DISCOVERY CONTENT:')
          discoveryContent.forEach(item => {
            console.log(`   ${item.subtype}: ${item.title}`)
          })
        }
        
        // Arcade content
        const arcadeContent = topicContent.filter(c => c.category === 'ARCADE')
        if (arcadeContent.length > 0) {
          console.log('\n🎮 ARCADE CONTENT:')
          arcadeContent.forEach(item => {
            console.log(`   ${item.subtype}: ${item.title}`)
          })
        }
        
        console.log(`\n   Total: ${topicContent.length} entries\n`)
      }
    })

    // Overall statistics
    const stats = {
      total: content.length,
      discovery: content.filter(c => c.category === 'DISCOVERY').length,
      arcade: content.filter(c => c.category === 'ARCADE').length,
      bySubtype: {}
    }

    content.forEach(item => {
      const key = `${item.category}_${item.subtype}`
      stats.bySubtype[key] = (stats.bySubtype[key] || 0) + 1
    })

    console.log('📊 OVERALL STATISTICS')
    console.log('─'.repeat(30))
    console.log(`Total Content Entries: ${stats.total}`)
    console.log(`Discovery Content: ${stats.discovery}`)
    console.log(`Arcade Content: ${stats.arcade}`)
    console.log('\nBy Type:')
    Object.entries(stats.bySubtype).forEach(([key, count]) => {
      const [category, subtype] = key.split('_')
      console.log(`  ${category} ${subtype}: ${count}`)
    })

    console.log('\n✨ Ready for students to explore!')

  } catch (error) {
    console.error('Unexpected error:', error.message)
  }
}

showContentSummary()