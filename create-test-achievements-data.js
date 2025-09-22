const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestData() {
  console.log('🧪 Creating test data for achievements...')
  
  try {
    const testUserId = 'test-achievement-user-' + Date.now()
    console.log(`Creating test data for user: ${testUserId}`)
    
    const testEvents = []
    const now = new Date()
    
    // Create quiz submissions with improvement pattern
    for (let i = 0; i < 12; i++) {
      const score = Math.min(95, 60 + (i * 3)) // Improving scores from 60% to 95%
      testEvents.push({
        user_id: testUserId,
        lesson_id: `lesson-${Math.floor(i/3) + 1}`, // Different lessons
        block_id: `quiz-block-${i}`,
        tool_kind: 'QUIZ',
        event_type: 'quiz_submit',
        data: { correct: Math.floor(score/10), total: 10, pct: score },
        created_at: new Date(now.getTime() - (11-i) * 24 * 60 * 60 * 1000) // Spread over 12 days
      })
    }
    
    // Add quiz resets (for Learning Phoenix)
    for (let i = 0; i < 4; i++) {
      testEvents.push({
        user_id: testUserId,
        lesson_id: `lesson-${i + 1}`,
        block_id: `quiz-block-${i}`,
        tool_kind: 'QUIZ',
        event_type: 'quiz_reset',
        data: {},
        created_at: new Date(now.getTime() - (10-i) * 24 * 60 * 60 * 1000)
      })
    }
    
    // Add explanation views (for Detective Scholar)
    for (let i = 0; i < 25; i++) {
      testEvents.push({
        user_id: testUserId,
        lesson_id: `lesson-${Math.floor(i/5) + 1}`,
        block_id: `quiz-block-${i}`,
        tool_kind: 'QUIZ',
        event_type: 'explanation_view',
        data: { explanationCount: 1 },
        created_at: new Date(now.getTime() - (24-i) * 60 * 60 * 1000) // Spread over 24 hours
      })
    }
    
    // Add deep dive sessions (for Deep Dive Scholar)
    for (let i = 0; i < 150; i++) {
      testEvents.push({
        user_id: testUserId,
        lesson_id: `lesson-${Math.floor(i/30) + 1}`,
        block_id: `content-block-${i}`,
        tool_kind: 'LESSON',
        event_type: 'lesson_heartbeat',
        data: {},
        created_at: new Date(now.getTime() - (149-i) * 60 * 1000) // 150 minutes of study
      })
    }
    
    // Add diverse subject lessons (for Subject Explorer)
    const subjects = ['math-lesson', 'science-lesson', 'english-lesson', 'history-lesson', 'art-lesson', 'music-lesson']
    subjects.forEach((subject, idx) => {
      testEvents.push({
        user_id: testUserId,
        lesson_id: `${subject}-${idx}`,
        block_id: `content-block-${idx}`,
        tool_kind: 'LESSON',
        event_type: 'lesson_view',
        data: {},
        created_at: new Date(now.getTime() - (5-idx) * 24 * 60 * 60 * 1000)
      })
    })
    
    // Add consistent time study sessions (for Time Keeper) - all at 3 PM
    for (let i = 0; i < 10; i++) {
      const studyTime = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      studyTime.setHours(15, 0, 0, 0) // 3 PM
      testEvents.push({
        user_id: testUserId,
        lesson_id: `lesson-${i + 1}`,
        block_id: `content-block-${i}`,
        tool_kind: 'LESSON',
        event_type: 'lesson_view',
        data: {},
        created_at: studyTime
      })
    }
    
    // Add consecutive daily sessions (for Consistency Champion)
    for (let i = 0; i < 10; i++) {
      testEvents.push({
        user_id: testUserId,
        lesson_id: `lesson-daily-${i}`,
        block_id: `content-block-daily-${i}`,
        tool_kind: 'LESSON',
        event_type: 'lesson_view',
        data: {},
        created_at: new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      })
    }
    
    console.log(`💾 Inserting ${testEvents.length} test events...`)
    
    // Insert test events in batches
    const batchSize = 50
    for (let i = 0; i < testEvents.length; i += batchSize) {
      const batch = testEvents.slice(i, i + batchSize)
      const { error } = await supabase
        .from('lesson_activity_events')
        .insert(batch)
      
      if (error) {
        console.log(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error.message)
      } else {
        console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(testEvents.length/batchSize)}`)
      }
    }
    
    console.log('🎯 Test data created successfully!')
    console.log(`Test user ID: ${testUserId}`)
    console.log('This user should unlock ALL 8 achievements!')
    
    return testUserId
    
  } catch (err) {
    console.log('❌ Error:', err.message)
  }
}

createTestData().catch(console.error)
