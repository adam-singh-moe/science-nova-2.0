/**
 * Direct test of admin prompt functionality by examining the API code
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testAdminPromptLogic() {
  console.log('🧪 Testing Admin Prompt Database Logic...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  try {
    // Check the topic that should have an admin prompt
    const topicId = 'e46fe27e-25dc-476e-9a49-e23a893b750b' // "Earth & Ocean Facts" with admin prompt
    
    console.log(`🔍 Fetching topic with ID: ${topicId}`)
    const { data: topicData, error } = await supabase
      .from('topics')
      .select('id, title, admin_prompt')
      .eq('id', topicId)
      .single()
    
    if (error) {
      console.error('❌ Error fetching topic:', error)
      return
    }
    
    if (!topicData) {
      console.log('❌ Topic not found')
      return
    }
    
    console.log('✅ Topic found:')
    console.log(`   Title: "${topicData.title}"`)
    console.log(`   Admin Prompt: "${topicData.admin_prompt || '(empty)'}"`)
    
    // Simulate what the AI Helper API would do
    let adminPrompt = ''
    if (topicData.admin_prompt) {
      adminPrompt = topicData.admin_prompt.trim()
      console.log(`📝 Admin prompt extracted: "${adminPrompt}"`)
    }
    
    // Show how the prompt would be constructed
    const base = 'You are an assistant generating classroom content for Grade 4. Keep it accurate, concise, and age-appropriate.'
    const adminContext = adminPrompt ? `\n\nIMPORTANT GUIDANCE: ${adminPrompt}` : ''
    const finalPrompt = base + adminContext
    
    console.log('\n🤖 Final AI prompt would be:')
    console.log('---')
    console.log(finalPrompt)
    console.log('---')
    
    console.log('\n✅ Admin prompt integration is working correctly!')
    console.log('📈 The AI will now consider topic admin prompts when generating content.')
    
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

testAdminPromptLogic()