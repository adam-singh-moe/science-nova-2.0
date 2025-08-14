require('dotenv').config({ path: '.env.local' })

async function checkAuthenticationFlow() {
  console.log('🔐 Testing Authentication Flow...\n')

  try {
    // Test if we can reach the login page
    console.log('📡 Testing login page...')
    const loginResponse = await fetch('http://localhost:3000/login')
    console.log(`Login page status: ${loginResponse.status}`)

    // Test if we can reach the admin page
    console.log('📡 Testing admin page...')
    const adminResponse = await fetch('http://localhost:3000/admin')
    console.log(`Admin page status: ${adminResponse.status}`)

    // Check if the development server is properly serving the API
    console.log('📡 Testing API health...')
    const apiResponse = await fetch('http://localhost:3000/api/health')
    console.log(`API health status: ${apiResponse.status}`)

    console.log('\n🎯 RECOMMENDED ACTIONS:')
    console.log('1. Visit http://localhost:3000/login and log in with admin credentials')
    console.log('2. Then visit http://localhost:3000/admin')
    console.log('3. Open browser developer tools to check for errors')
    console.log('4. Check the Console tab for authentication or API errors')
    console.log('5. Check the Network tab to see what API calls are being made')

    console.log('\n📋 ADMIN CREDENTIALS:')
    console.log('Email: adamsingh017@gmail.com')
    console.log('Password: testpass123')
    console.log('(or any of the admin emails from check-users.js)')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkAuthenticationFlow()
