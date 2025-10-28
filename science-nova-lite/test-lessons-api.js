require('dotenv').config({path:'.env.local'});

async function testLessonsAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/lessons?status=published&limit=50&sort=date');
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
    } else {
      const data = await response.json();
      console.log('Success response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testLessonsAPI();