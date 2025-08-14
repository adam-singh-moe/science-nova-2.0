// Debug the admin dashboard data fetching issues
async function debugAdminDashboard() {
  console.log('🔍 Debugging Admin Dashboard Data Issues...\n')

  try {
    // Test the admin API endpoint directly
    console.log('📡 Testing admin/topics API endpoint...')
    
    // Test without auth (should get 401)
    const response1 = await fetch('http://localhost:3000/api/admin/topics')
    console.log(`Status without auth: ${response1.status}`)
    
    if (response1.status === 401) {
      console.log('✅ Authentication check working')
    }

    // Test the upload-textbook API (which should work)
    console.log('\n📡 Testing upload-textbook API endpoint...')
    const response2 = await fetch('http://localhost:3000/api/upload-textbook')
    console.log(`Status: ${response2.status}`)
    
    if (response2.ok) {
      const data = await response2.json()
      console.log(`Textbook uploads found: ${data.uploads?.length || 0}`)
      if (data.uploads && data.uploads.length > 0) {
        console.log('✅ Textbook API working - this should show in dashboard stats')
      }
    }

    // Check if Next.js is running and responding
    console.log('\n📡 Testing main site...')
    const response3 = await fetch('http://localhost:3000/')
    console.log(`Main site status: ${response3.status}`)

    console.log('\n🎯 TROUBLESHOOTING STEPS:')
    console.log('1. Check browser console for JavaScript errors')
    console.log('2. Verify authentication state in browser')
    console.log('3. Check network tab for failed API calls')
    console.log('4. Ensure user has admin role in database')

  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\n🚨 POSSIBLE ISSUES:')
    console.log('- Development server not running')
    console.log('- API endpoints not accessible')
    console.log('- Authentication problems')
  }
}

debugAdminDashboard()
