const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testTextbookAPI() {
  console.log('🧪 Testing textbook API endpoint...')
  
  try {
    // Get an admin user token
    const { data: adminUser, error: userError } = await supabase.auth.signInWithPassword({
      email: 'admin@sciencenova.com',
      password: 'admin123'
    })
    
    if (userError) {
      console.error('❌ Admin login failed:', userError)
      return
    }
    
    console.log('✅ Admin logged in:', adminUser.user.email)
    
    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/upload-textbook', {
      headers: {
        'Authorization': `Bearer ${adminUser.session.access_token}`
      }
    })
    
    console.log('📡 API Response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('📖 Textbook data structure:')
      console.log('  - uploads:', data.uploads?.length || 0)
      console.log('  - textbooks:', data.textbooks?.length || 0)
      console.log('  - storageFiles:', data.storageFiles?.length || 0)
      
      if (data.uploads && data.uploads.length > 0) {
        console.log('\n📚 Sample upload:', data.uploads[0])
      }
    } else {
      const errorData = await response.json()
      console.error('❌ API Error:', errorData)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testTextbookAPI()
