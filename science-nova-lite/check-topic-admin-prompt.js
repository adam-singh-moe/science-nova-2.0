/**
 * Check if topics table has admin_prompt field and what it contains
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTopicAdminPrompt() {
  console.log('🔍 Checking topics table structure and admin_prompt field...')
  
  try {
    // Get a sample topic to see the structure
    const { data: topics, error } = await supabase
      .from('topics')
      .select('*')
      .limit(3)
    
    if (error) {
      console.error('❌ Error fetching topics:', error)
      return
    }
    
    if (!topics || topics.length === 0) {
      console.log('📭 No topics found in database')
      return
    }
    
    console.log(`✅ Found ${topics.length} topics`)
    console.log('📋 Topic columns:', Object.keys(topics[0]))
    
    // Check if admin_prompt field exists
    const hasAdminPrompt = 'admin_prompt' in topics[0]
    console.log(`🤖 Has admin_prompt field: ${hasAdminPrompt}`)
    
    if (hasAdminPrompt) {
      console.log('\n📝 Sample admin_prompt values:')
      topics.forEach((topic, idx) => {
        console.log(`${idx + 1}. Topic: "${topic.title}"`)
        console.log(`   Admin Prompt: "${topic.admin_prompt || '(empty)'}"`)
        console.log('')
      })
    }
    
    // Show a sample topic structure
    console.log('🔍 Sample topic structure:')
    console.log(JSON.stringify(topics[0], null, 2))
    
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

checkTopicAdminPrompt()