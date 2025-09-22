const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSimpleTestData() {
  console.log('🧪 Creating simple test achievement data...')
  
  try {
    const testUserId = uuidv4()
    console.log(`Creating test data for user: ${testUserId}`)
    
    // Get some existing lesson IDs from the database
    const { data: existingLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .limit(10)
    
    if (lessonsError || !existingLessons || existingLessons.length === 0) {
      console.log('❌ No existing lessons found. Creating with sample UUIDs...')
      // Use sample UUIDs if no lessons exist
      var lessonIds = Array.from({length: 6}, () => uuidv4())
    } else {
      console.log(`✅ Found ${existingLessons.length} existing lessons`)
      var lessonIds = existingLessons.map(l => l.id)
    }
    
    const testEvents = []
    const now = new Date()
    
    // 1. Quiz Master Pro - 12 quiz submissions with high average (>85%)
    console.log('📝 Creating quiz submissions...')
    for (let i = 0; i < 12; i++) {
      const score = 85 + Math.floor(Math.random() * 15) // 85-100%
      testEvents.push({
        user_id: testUserId,
        lesson_id: lessonIds[i % lessonIds.length],
        block_id: uuidv4(),
        tool_kind: 'QUIZ',
        event_type: 'quiz_submit',
        data: { correct: Math.floor(score/10), total: 10, pct: score },
        created_at: new Date(now.getTime() - (11-i) * 60 * 60 * 1000).toISOString()
      })
    }
    
    // 2. Learning Phoenix - 4 quiz resets
    console.log('🔄 Creating quiz resets...')
    for (let i = 0; i < 4; i++) {
      testEvents.push({
        user_id: testUserId,
        lesson_id: lessonIds[i % lessonIds.length],
        block_id: uuidv4(),
        tool_kind: 'QUIZ',
        event_type: 'quiz_reset',
        data: {},
        created_at: new Date(now.getTime() - (3-i) * 60 * 60 * 1000).toISOString()
      })
    }
    
    // 3. Detective Scholar - 25 explanation views
    console.log('🔍 Creating explanation views...')
    for (let i = 0; i < 25; i++) {
      testEvents.push({
        user_id: testUserId,
        lesson_id: lessonIds[i % lessonIds.length],
        block_id: uuidv4(),
        tool_kind: 'QUIZ',
        event_type: 'explanation_view',
        data: { explanationCount: 1 },
        created_at: new Date(now.getTime() - i * 30 * 60 * 1000).toISOString() // Every 30 minutes
      })
    }
    
    // 4. Deep Dive Scholar - 150 heartbeats (150 minutes)
    console.log('⏱️ Creating study heartbeats...')
    for (let i = 0; i < 150; i++) {
      testEvents.push({
        user_id: testUserId,
        lesson_id: lessonIds[i % lessonIds.length],
        block_id: uuidv4(),
        tool_kind: 'LESSON',
        event_type: 'lesson_heartbeat',
        data: {},
        created_at: new Date(now.getTime() - i * 60 * 1000).toISOString() // Every minute
      })
    }
    
    // 5. Time Keeper - 6 sessions at the same hour (3 PM)
    console.log('🕒 Creating consistent time sessions...')
    for (let i = 0; i < 6; i++) {
      const studyTime = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      studyTime.setHours(15, 0, 0, 0) // 3 PM every day
      testEvents.push({
        user_id: testUserId,
        lesson_id: lessonIds[i % lessonIds.length],
        block_id: uuidv4(),
        tool_kind: 'LESSON',
        event_type: 'lesson_view',
        data: {},
        created_at: studyTime.toISOString()
      })
    }
    
    console.log(`💾 Inserting ${testEvents.length} test events...`)
    
    // Insert in smaller batches
    const batchSize = 25
    let successCount = 0
    
    for (let i = 0; i < testEvents.length; i += batchSize) {
      const batch = testEvents.slice(i, i + batchSize)
      const { error } = await supabase
        .from('lesson_activity_events')
        .insert(batch)
      
      if (error) {
        console.log(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error.message)
      } else {
        successCount += batch.length
        console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(testEvents.length/batchSize)} (${batch.length} events)`)
      }
    }
    
    console.log(`🎯 Successfully inserted ${successCount}/${testEvents.length} events`)
    console.log(`Test user ID: ${testUserId}`)
    
    // Now test achievements for this user
    console.log('\n🏆 Testing achievements for this user...')
    
    const { execSync } = require('child_process')
    const fs = require('fs')
    
    // Create a temporary test script
    const testScript = `
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient('${supabaseUrl}', '${supabaseServiceKey}')

async function testUser() {
  const { data, error } = await supabase
    .from('lesson_activity_events')
    .select('*')
    .eq('user_id', '${testUserId}')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.log('Error:', error.message)
    return
  }
  
  console.log(\`Found \${data.length} events for test user\`)
  
  const eventCounts = {}
  data.forEach(event => {
    eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1
  })
  
  console.log('Event breakdown:', eventCounts)
}

testUser().catch(console.error)
`
    
    fs.writeFileSync('temp-test.js', testScript)
    execSync('node temp-test.js', { stdio: 'inherit' })
    fs.unlinkSync('temp-test.js')
    
    return testUserId
    
  } catch (err) {
    console.log('❌ Error:', err.message)
  }
}

createSimpleTestData().catch(console.error)
