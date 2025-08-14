// Test achievements API after server restart
console.log('Testing achievements API after server restart...\n')

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/achievements', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })
    
    console.log('✅ API Response Status:', response.status)
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.text()
    console.log('Response Body:', data)
    
    if (response.status === 200) {
      console.log('\n🎉 SUCCESS! The API is working!')
      try {
        const jsonData = JSON.parse(data)
        console.log('Response contains achievements:', !!jsonData.achievements)
        console.log('Response contains userProgress:', !!jsonData.userProgress)
      } catch (e) {
        console.log('Could not parse JSON, but 200 response received')
      }
    } else if (response.status === 401) {
      console.log('\n⚠️ Authentication required (this is expected when not logged in)')
      console.log('The API is working but you need to be logged in to see achievements')
    } else {
      console.log('\n❌ Unexpected response status')
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message)
    console.log('Make sure the dev server is running on port 3000')
  }
}

// Add a small delay to ensure server is ready
setTimeout(testAPI, 1000)
