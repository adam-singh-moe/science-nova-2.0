require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkExistingData() {
  console.log('🔍 Checking existing Supabase data...\n')

  try {
    // Check topics table (fix the relationship query)
    console.log('📚 TOPICS:')
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('*')
    
    if (topicsError) {
      console.error('❌ Topics error:', topicsError)
    } else {
      console.log(`Found ${topics?.length || 0} topics:`)
      topics?.forEach(topic => {
        console.log(`  - ${topic.title} (Grade ${topic.grade_level})`)
        if (topic.admin_prompt) {
          console.log(`    Admin prompt: ${topic.admin_prompt.substring(0, 100)}...`)
        }
      })
    }

    // Check study areas
    console.log('\n🔬 STUDY AREAS:')
    const { data: studyAreas, error: areasError } = await supabase
      .from('study_areas')
      .select('*')
    
    if (areasError) {
      console.error('❌ Study areas error:', areasError)
    } else {
      console.log(`Found ${studyAreas?.length || 0} study areas:`)
      studyAreas?.forEach(area => {
        console.log(`  - ${area.name} (${area.vanta_effect})`)
      })
    }

    // Check textbook uploads
    console.log('\n📖 TEXTBOOK UPLOADS:')
    const { data: uploads, error: uploadsError } = await supabase
      .from('textbook_uploads')
      .select('*')
    
    if (uploadsError) {
      console.error('❌ Uploads error:', uploadsError)
    } else {
      console.log(`Found ${uploads?.length || 0} textbook uploads:`)
      uploads?.forEach(upload => {
        console.log(`  - ${upload.name} (Grade ${upload.grade_level}) - ${upload.chunks_created || 0} chunks`)
        console.log(`    Processed: ${upload.processed ? 'Yes' : 'No'}`)
      })
    }

    // Check textbook chunks/embeddings
    console.log('\n📝 TEXTBOOK CHUNKS:')
    const { data: chunks, error: chunksError } = await supabase
      .from('textbook_chunks')
      .select('grade_level')
    
    if (chunksError) {
      console.error('❌ Chunks error:', chunksError)
    } else {
      console.log(`Total textbook chunks: ${chunks?.length || 0}`)
      // Count by grade level
      const gradeStats = chunks?.reduce((acc, chunk) => {
        acc[chunk.grade_level] = (acc[chunk.grade_level] || 0) + 1
        return acc
      }, {}) || {}
      
      Object.entries(gradeStats).forEach(([grade, count]) => {
        console.log(`  - Grade ${grade}: ${count} chunks`)
      })
    }

    // Check user progress
    console.log('\n👥 USER PROGRESS:')
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
    
    if (progressError) {
      console.error('❌ Progress error:', progressError)
    } else {
      console.log(`Total user progress entries: ${progress?.length || 0}`)
      const userStats = progress?.reduce((acc, p) => {
        acc[p.user_id] = (acc[p.user_id] || 0) + 1
        return acc
      }, {}) || {}
      
      console.log(`Users with progress: ${Object.keys(userStats).length}`)
    }

    // Check conversation history
    console.log('\n💬 CONVERSATION HISTORY:')
    const { data: conversations, error: conversationError } = await supabase
      .from('conversation_history')
      .select('*')
    
    if (conversationError) {
      console.error('❌ Conversation error:', conversationError)
    } else {
      console.log(`Total conversation entries: ${conversations?.length || 0}`)
      const userConversations = conversations?.reduce((acc, c) => {
        acc[c.user_id] = (acc[c.user_id] || 0) + 1
        return acc
      }, {}) || {}
      
      console.log(`Users with conversations: ${Object.keys(userConversations).length}`)
    }

    // Check available tables
    console.log('\n🗃️ DATABASE TABLES:')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')
    
    if (tablesError) {
      console.error('❌ Tables error:', tablesError)
    } else {
      console.log('Available tables:')
      tables?.forEach(table => {
        console.log(`  - ${table.table_name}`)
      })
    }

  } catch (error) {
    console.error('❌ Error checking data:', error)
  }
}

checkExistingData()
