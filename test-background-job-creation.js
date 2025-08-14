// Test background job creation specifically
require('dotenv').config({ path: '.env.local' })

async function testBackgroundJobCreation() {
  console.log('🧪 Testing Background Job Creation...\n')

  const testData = {
    adventureId: 'test-adventure-' + Date.now(),
    storyPages: [
      {
        id: 'page-1',
        backgroundPrompt: 'A young scientist in a colorful laboratory conducting experiments',
        backgroundImage: null
      },
      {
        id: 'page-2',
        backgroundPrompt: 'A magical forest with glowing plants and friendly animals',
        backgroundImage: null
      }
    ],
    gradeLevel: 3
  }

  try {
    console.log('📤 Sending request to background job API...')
    console.log('Data:', JSON.stringify(testData, null, 2))

    const response = await fetch('http://localhost:3000/api/generate-images-background', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })

    console.log(`\n📊 Response Status: ${response.status}`)
    console.log(`📊 Response Headers:`, Object.fromEntries(response.headers))

    const result = await response.json()
    console.log('\n📋 Response Body:')
    console.log(JSON.stringify(result, null, 2))

    if (result.success) {
      console.log('\n✅ Background job creation successful!')
      
      if (result.jobId) {
        console.log(`📝 Job ID: ${result.jobId}`)
        
        // Wait a bit and check job status
        console.log('\n⏰ Waiting 5 seconds before checking job status...')
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        const statusResponse = await fetch(`http://localhost:3000/api/generate-images-background?jobId=${result.jobId}`)
        const statusResult = await statusResponse.json()
        
        console.log('\n📊 Job Status:')
        console.log(JSON.stringify(statusResult, null, 2))
      } else {
        console.log('ℹ️ No job created (quota exhausted or other reason)')
        console.log(`📄 Message: ${result.message}`)
      }
    } else {
      console.log('❌ Background job creation failed')
      console.log(`📄 Error: ${result.error}`)
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testBackgroundJobCreation()
