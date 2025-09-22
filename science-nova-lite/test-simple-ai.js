/**
 * Simple AI Helper test without authentication to isolate the issue
 */

const test = async () => {
  console.log('🧪 Testing AI Helper without auth...')
  
  try {
    const response = await fetch('http://localhost:3001/api/ai-helper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'TEXT',
        prompt: 'Write a simple paragraph about plants for grade 6 students.',
        topic: 'Plants',
        grade: 6,
        difficulty: 2,
        minWords: 30,
        maxWords: 60
      })
    })
    
    console.log('Response status:', response.status)
    const text = await response.text()
    console.log('Raw response:', text)
    
    try {
      const json = JSON.parse(text)
      console.log('Parsed JSON:', json)
    } catch (e) {
      console.log('Could not parse as JSON')
    }
    
  } catch (error) {
    console.error('Request failed:', error.message)
  }
}

test()