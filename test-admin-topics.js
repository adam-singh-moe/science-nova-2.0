// Load environment variables first
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Environment check:')
console.log('📍 Supabase URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('🔑 Supabase Key:', supabaseKey ? `Found (${supabaseKey.substring(0, 20)}...)` : 'Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAdminTopics() {
  console.log('🧪 Testing Admin Topics API...')
  
  try {
    // First authenticate as admin
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      console.log('🔐 No active session, attempting to sign in...')
      
      // Try to sign in with test credentials
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'adamsingh017@gmail.com',
        password: 'testpass123'
      })
      
      if (signInError) {
        console.error('❌ Failed to sign in:', signInError.message)
        return
      }
      
      console.log('✅ Signed in successfully')
    }
    
    console.log('🔑 Testing with authenticated session...')
    
    // Get current session
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    
    if (!currentSession) {
      console.error('❌ No session available')
      return
    }
    
    console.log('👤 Current user:', currentSession.user.email)
    
    // Test GET topics
    console.log('📡 Testing GET /api/admin/topics...')
    const getResponse = await fetch('http://localhost:3000/api/admin/topics', {
      headers: {
        'Authorization': `Bearer ${currentSession.access_token}`
      }
    })
    
    console.log('📊 GET Response status:', getResponse.status)
    const getResult = await getResponse.json()
    console.log('📊 GET Result:', JSON.stringify(getResult, null, 2))
    
    // Test POST topic creation
    console.log('📡 Testing POST /api/admin/topics...')
    const postResponse = await fetch('http://localhost:3000/api/admin/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSession.access_token}`
      },
      body: JSON.stringify({
        title: 'Test Topic - Photosynthesis',
        grade_level: 5,
        admin_prompt: 'Focus on how plants convert sunlight into energy',
        study_area_ids: []
      })
    })
    
    console.log('📊 POST Response status:', postResponse.status)
    const postResult = await postResponse.json()
    console.log('📊 POST Result:', JSON.stringify(postResult, null, 2))
    
    if (postResponse.ok && postResult.topic) {
      console.log('✅ Topic created successfully!')
      console.log('🆔 New topic ID:', postResult.topic.id)
      
      // Test GET again to see the new topic
      console.log('📡 Testing GET /api/admin/topics again...')
      const getResponse2 = await fetch('http://localhost:3000/api/admin/topics', {
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`
        }
      })
      
      const getResult2 = await getResponse2.json()
      console.log('📊 Updated topics count:', getResult2.topics?.length || 0)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAdminTopics()
