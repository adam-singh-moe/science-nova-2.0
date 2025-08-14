const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testProcessTextbooksAPI() {
  console.log('🧪 Testing Process Textbooks API...')
  
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
    
    // Check what textbooks are available
    const { data: textbooks, error: fetchError } = await supabase
      .from('textbook_uploads')
      .select('id, file_name, processed, processing_started_at, processing_error')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('❌ Failed to fetch textbooks:', fetchError)
      return
    }
    
    console.log('\n📚 Available textbooks:')
    textbooks?.forEach((book, idx) => {
      console.log(`  ${idx + 1}. ${book.file_name} (ID: ${book.id})`)
      console.log(`     - Processed: ${book.processed}`)
      console.log(`     - Processing: ${book.processing_started_at ? 'Yes' : 'No'}`)
      console.log(`     - Error: ${book.processing_error || 'None'}`)
    })
    
    // Test the API with selectAll
    console.log('\n🔄 Testing API with selectAll=true...')
    const response = await fetch('http://localhost:3001/api/process-selected-textbooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ selectAll: true })
    })
    
    console.log('📡 API Response status:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ API Success:', result)
    } else {
      const errorData = await response.json()
      console.error('❌ API Error:', errorData)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testProcessTextbooksAPI()
