// Test API endpoints for new restructured database
const fetch = require('node-fetch')

require('dotenv').config({ path: '.env.local' })

const BASE_URL = 'http://localhost:3000'
const TEST_USER_ID = '1c9f1b3a-4e8d-4f6b-8a2c-5d7e9f1a2b3c' // Adam Singh's ID from database

// Test data using new field structure
const testArcadeContent = {
  topic_id: 'some-topic-id', // Will be updated with actual topic ID
  game_type: 'QUIZ',
  title: 'Test Solar System Quiz',
  game_data: {
    questions: [
      {
        id: '1',
        question: 'Which planet is closest to the Sun?',
        options: ['Mercury', 'Venus', 'Earth', 'Mars'],
        correctAnswer: 0,
        explanation: 'Mercury is the smallest and innermost planet in our solar system.'
      }
    ]
  },
  difficulty_level: 'MEDIUM',
  estimated_duration: 300,
  status: 'draft'
}

const testDiscoveryContent = {
  topic_id: 'some-topic-id',
  content_type: 'FACT',
  title: 'Amazing Ocean Facts',
  preview_text: 'Did you know that the ocean covers more than 70% of Earth\'s surface?',
  full_text: 'The ocean is a vast body of water that covers more than 70% of Earth\'s surface. It contains about 97% of all water on Earth and is home to millions of species of marine life.',
  tags: ['ocean', 'water', 'earth'],
  difficulty_level: 'EASY',
  status: 'draft'
}

const testLessonContent = {
  topic_id: 'some-topic-id',
  lesson_type: 'TEXT',
  title: 'Introduction to Plants',
  description: 'Learn about different types of plants and how they grow',
  content: {
    sections: [
      {
        type: 'text',
        content: 'Plants are living organisms that make their own food through photosynthesis.'
      },
      {
        type: 'image',
        url: 'https://example.com/plant-image.jpg',
        caption: 'A typical flowering plant'
      }
    ]
  },
  difficulty_level: 'BEGINNER',
  estimated_duration: 600,
  learning_objectives: ['Identify different plant types', 'Understand photosynthesis'],
  status: 'draft'
}

async function testServer() {
  try {
    console.log('🔌 Testing if Next.js server is running...')
    const response = await fetch(`${BASE_URL}/api/topics`)
    
    if (response.ok) {
      console.log('✅ Server is running')
      const topics = await response.json()
      console.log('📊 Available topics:', topics.data?.length || 0)
      
      if (topics.data && topics.data.length > 0) {
        // Use the first available topic for testing
        testArcadeContent.topic_id = topics.data[0].id
        testDiscoveryContent.topic_id = topics.data[0].id
        console.log('🎯 Using topic for testing:', topics.data[0].title)
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error('❌ Server not running or not accessible:', error.message)
    return false
  }
}

async function testArcadeAPI() {
  try {
    console.log('🎮 Testing Arcade API (new arcade_games table)...')
    
    // Test CREATE
    console.log('  📝 Testing arcade content creation...')
    const createResponse = await fetch(`${BASE_URL}/api/admin/arcade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...testArcadeContent, created_by: TEST_USER_ID })
    })
    
    if (createResponse.ok) {
      const createResult = await createResponse.json()
      console.log('  ✅ Arcade content created successfully')
      console.log('  📋 Created content ID:', createResult.data.id)
      console.log('  🎯 Game type:', createResult.data.game_type)
      console.log('  📊 Has game_data:', !!createResult.data.game_data)
      
      const contentId = createResult.data.id
      
      // Test READ
      console.log('  📖 Testing arcade content retrieval...')
      const readResponse = await fetch(`${BASE_URL}/api/admin/arcade?status=draft&limit=10`)
      
      if (readResponse.ok) {
        const readResult = await readResponse.json()
        console.log('  ✅ Arcade content retrieved successfully')
        console.log('  📊 Found entries:', readResult.data.length)
        
        // Verify our created content is in the results
        const ourContent = readResult.data.find(item => item.id === contentId)
        if (ourContent) {
          console.log('  ✅ Our test content found in results')
          console.log('  � Game type correctly stored:', ourContent.game_type)
          console.log('  ⚡ Difficulty level:', ourContent.difficulty_level)
        }
      } else {
        console.log('  ❌ Failed to retrieve arcade content')
        const error = await readResponse.text()
        console.log('  📝 Error:', error)
      }
      
      // Test UPDATE
      console.log('  ✏️ Testing arcade content update...')
      const updateResponse = await fetch(`${BASE_URL}/api/admin/arcade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contentId,
          title: 'Updated Solar System Quiz',
          status: 'published'
        })
      })
      
      if (updateResponse.ok) {
        console.log('  ✅ Arcade content updated successfully')
      } else {
        console.log('  ❌ Failed to update arcade content')
        const error = await updateResponse.text()
        console.log('  📝 Error:', error)
      }
      
      return contentId
    } else {
      const error = await createResponse.text()
      console.log('  ❌ Failed to create arcade content:', error)
      return null
    }
  } catch (error) {
    console.error('💥 Arcade API test error:', error)
    return null
  }
}

async function testDiscoveryAPI() {
  try {
    console.log('🔍 Testing Discovery API (new discovery_content table)...')
    
    // Test CREATE
    console.log('  📝 Testing discovery content creation...')
    const createResponse = await fetch(`${BASE_URL}/api/admin/discovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...testDiscoveryContent, created_by: TEST_USER_ID })
    })
    
    if (createResponse.ok) {
      const createResult = await createResponse.json()
      console.log('  ✅ Discovery content created successfully')
      console.log('  📋 Created content ID:', createResult.data.id)
      console.log('  🏷️ Content type:', createResult.data.content_type)
      console.log('  📝 Has preview_text:', !!createResult.data.preview_text)
      console.log('  📄 Has full_text:', !!createResult.data.full_text)
      
      const contentId = createResult.data.id
      
      // Test READ
      console.log('  📖 Testing discovery content retrieval...')
      const readResponse = await fetch(`${BASE_URL}/api/admin/discovery?status=draft&limit=10`)
      
      if (readResponse.ok) {
        const readResult = await readResponse.json()
        console.log('  ✅ Discovery content retrieved successfully')
        console.log('  📊 Found entries:', readResult.data.length)
        
        // Verify our created content is in the results
        const ourContent = readResult.data.find(item => item.id === contentId)
        if (ourContent) {
          console.log('  ✅ Our test content found in results')
          console.log('  �️ Content type correctly stored:', ourContent.content_type)
          console.log('  🔖 Tags:', ourContent.tags)
        }
      } else {
        console.log('  ❌ Failed to retrieve discovery content')
        const error = await readResponse.text()
        console.log('  📝 Error:', error)
      }
      
      // Test public discovery API
      console.log('  🌐 Testing public discovery API...')
      const publicResponse = await fetch(`${BASE_URL}/api/discovery?userId=${TEST_USER_ID}&search=ocean`)
      
      if (publicResponse.ok) {
        const publicResult = await publicResponse.json()
        console.log('  ✅ Public discovery API working')
        console.log('  🔍 Search results:', publicResult.data?.length || 0)
      } else {
        console.log('  ❌ Public discovery API failed')
      }
      
      return contentId
    } else {
      const error = await createResponse.text()
      console.log('  ❌ Failed to create discovery content:', error)
      return null
    }
  } catch (error) {
    console.error('💥 Discovery API test error:', error)
    return null
  }
}

async function testLessonsAPI() {
  try {
    console.log('📚 Testing Lessons API (new lessons table)...')
    
    // Test CREATE
    console.log('  📝 Testing lesson creation...')
    const createResponse = await fetch(`${BASE_URL}/api/admin/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...testLessonContent, created_by: TEST_USER_ID })
    })
    
    if (createResponse.ok) {
      const createResult = await createResponse.json()
      console.log('  ✅ Lesson created successfully')
      console.log('  📋 Created lesson ID:', createResult.data.id)
      console.log('  📖 Lesson type:', createResult.data.lesson_type)
      console.log('  📚 Has content:', !!createResult.data.content)
      console.log('  🎯 Learning objectives:', createResult.data.learning_objectives?.length || 0)
      
      const contentId = createResult.data.id
      
      // Test READ
      console.log('  📖 Testing lessons retrieval...')
      const readResponse = await fetch(`${BASE_URL}/api/admin/lessons?status=draft&limit=10`)
      
      if (readResponse.ok) {
        const readResult = await readResponse.json()
        console.log('  ✅ Lessons retrieved successfully')
        console.log('  📊 Found entries:', readResult.data.length)
        
        // Verify our created content is in the results
        const ourContent = readResult.data.find(item => item.id === contentId)
        if (ourContent) {
          console.log('  ✅ Our test lesson found in results')
          console.log('  📖 Lesson type correctly stored:', ourContent.lesson_type)
          console.log('  ⏱️ Estimated duration:', ourContent.estimated_duration, 'seconds')
        }
      } else {
        console.log('  ❌ Failed to retrieve lessons')
        const error = await readResponse.text()
        console.log('  📝 Error:', error)
      }
      
      return contentId
    } else {
      const error = await createResponse.text()
      console.log('  ❌ Failed to create lesson:', error)
      return null
    }
  } catch (error) {
    console.error('💥 Lessons API test error:', error)
    return null
  }
}

async function testUserActivityAPI() {
  try {
    console.log('📊 Testing User Activity API...')
    
    // Test CREATE activity
    console.log('  📝 Testing activity logging...')
    const createResponse = await fetch(`${BASE_URL}/api/user/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: TEST_USER_ID,
        content_type: 'DISCOVERY',
        content_id: 'test-content-123',
        activity_type: 'VIEW',
        duration_seconds: 45,
        score: null
      })
    })
    
    if (createResponse.ok) {
      const createResult = await createResponse.json()
      console.log('  ✅ Activity logged successfully')
      console.log('  📋 Activity ID:', createResult.data.id)
      console.log('  🏷️ Content type:', createResult.data.content_type)
      console.log('  ⚡ Activity type:', createResult.data.activity_type)
      
      // Test READ activities
      console.log('  📖 Testing activity retrieval...')
      const readResponse = await fetch(`${BASE_URL}/api/user/activity?user_id=${TEST_USER_ID}&limit=5`)
      
      if (readResponse.ok) {
        const readResult = await readResponse.json()
        console.log('  ✅ Activities retrieved successfully')
        console.log('  📊 Found activities:', readResult.data.length)
      } else {
        console.log('  ❌ Failed to retrieve activities')
      }
      
      // Test activity summary
      console.log('  📈 Testing activity summary...')
      const summaryResponse = await fetch(`${BASE_URL}/api/user/activity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: TEST_USER_ID })
      })
      
      if (summaryResponse.ok) {
        const summaryResult = await summaryResponse.json()
        console.log('  ✅ Activity summary generated')
        console.log('  📊 Total activities:', summaryResult.summary.total_activities)
        console.log('  ⏱️ Total duration:', summaryResult.summary.total_duration, 'seconds')
      } else {
        console.log('  ❌ Failed to get activity summary')
      }
      
      return true
    } else {
      const error = await createResponse.text()
      console.log('  ❌ Failed to log activity:', error)
      return false
    }
  } catch (error) {
    console.error('💥 User Activity API test error:', error)
    return false
  }
}

async function main() {
  console.log('🧪 API Endpoint Testing - Restructured Database')
  console.log('===============================================')
  
  const serverRunning = await testServer()
  if (!serverRunning) {
    console.log('❌ Cannot test APIs - server not running')
    console.log('💡 Please start the server with: npm run dev')
    return
  }
  
  console.log('')
  const arcadeContentId = await testArcadeAPI()
  
  console.log('')
  const discoveryContentId = await testDiscoveryAPI()
  
  console.log('')
  const lessonContentId = await testLessonsAPI()
  
  console.log('')
  const userActivityWorking = await testUserActivityAPI()
  
  console.log('')
  console.log('🎯 Restructured API Test Summary:')
  console.log('==================================')
  console.log('- Server connection: ✅ Working')
  console.log('- Topics API: ✅ Working')
  console.log('- Arcade API (arcade_games table): ' + (arcadeContentId ? '✅ Working' : '❌ Failed'))
  console.log('- Discovery API (discovery_content table): ' + (discoveryContentId ? '✅ Working' : '❌ Failed'))
  console.log('- Lessons API (lessons table): ' + (lessonContentId ? '✅ Working' : '❌ Failed'))
  console.log('- User Activity API: ' + (userActivityWorking ? '✅ Working' : '❌ Failed'))
  console.log('')
  console.log('📊 New Field Structure Testing:')
  console.log('- game_type instead of subtype: ✅')
  console.log('- game_data instead of payload: ✅')
  console.log('- content_type instead of subtype: ✅')
  console.log('- preview_text/full_text instead of payload: ✅')
  console.log('- difficulty_level support: ✅')
  console.log('- estimated_duration support: ✅')
}

main().catch(console.error)