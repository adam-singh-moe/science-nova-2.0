const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')

require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testAPIResponse() {
  console.log('🧪 Testing API response format...')
  
  try {
    // Get admin session
    const { data: session, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'admin123'
    })
    
    if (authError) {
      console.error('❌ Auth failed:', authError)
      return
    }
    
    console.log('✅ Authenticated as:', session.user.email)
    
    // Test the API endpoint
    const response = await fetch('http://localhost:3001/api/upload-textbook', {
      headers: {
        'Authorization': `Bearer ${session.session.access_token}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('\n📊 API Response Analysis:')
      console.log('  - Has uploads property:', !!data.uploads)
      console.log('  - Has textbooks property:', !!data.textbooks)
      console.log('  - Uploads count:', data.uploads?.length || 0)
      console.log('  - Textbooks count:', data.textbooks?.length || 0)
      console.log('  - Storage files:', data.storageFiles?.length || 0)
      
      if (data.uploads && data.uploads.length > 0) {
        console.log('\n📚 Sample upload record:')
        const sample = data.uploads[0]
        console.log('  - ID:', sample.id)
        console.log('  - File name:', sample.file_name)
        console.log('  - Grade level:', sample.grade_level)
        console.log('  - Chunks created:', sample.chunks_created)
        console.log('  - Processed:', sample.processed)
      }
    } else {
      const errorText = await response.text()
      console.error('❌ API error:', response.status, errorText)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAPIResponse()
