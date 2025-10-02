const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testAPIRequest() {
  console.log('🧪 Testing arcade API request...\n')

  // Simulate the request that the Memory Game form would send
  const testGameData = {
    title: "Test Chemical Reactions Memory Game",
    topic_id: "b568aa87-ab72-46b0-bc33-1ced328f0039",  // Real Chemistry topic ID
    grade_level: 6,
    difficulty: "MEDIUM",
    payload: {
      pairs: [
        { id: 1, content: "Sodium", type: "term" },
        { id: 1, content: "Reacts violently with water", type: "definition" },
        { id: 2, content: "Oxygen", type: "term" },
        { id: 2, content: "Essential for breathing", type: "definition" }
      ],
      gridSize: "4x3",
      pairCount: 2
    },
    subtype: "GAME",
    status: "draft",
    created_by: "a382b854-bb33-4d1b-9d6d-f8fcea2c9deb",  // Real user UUID
    category: "ARCADE"
  }

  console.log('📤 Request data:')
  console.log(JSON.stringify(testGameData, null, 2))
  console.log('\n')

  try {
    const response = await fetch('http://localhost:3000/api/admin/arcade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testGameData)
    })

    console.log('📥 Response status:', response.status)
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))

    const responseData = await response.text()
    console.log('📥 Response body:', responseData)

    if (!response.ok) {
      console.log('\n❌ Request failed!')
      try {
        const errorData = JSON.parse(responseData)
        console.log('Error details:', errorData)
      } catch (e) {
        console.log('Could not parse error response as JSON')
      }
    } else {
      console.log('\n✅ Request succeeded!')
      try {
        const successData = JSON.parse(responseData)
        console.log('Success data:', successData)
      } catch (e) {
        console.log('Could not parse success response as JSON')
      }
    }

  } catch (error) {
    console.error('💥 Network error:', error.message)
  }
}

testAPIRequest()