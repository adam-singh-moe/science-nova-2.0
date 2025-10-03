// Load environment variables and check content_cache_1 schema
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Environment check:')
console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('Service Role Key:', supabaseKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkContentCacheSchema() {
  try {
    console.log('\n🔍 Checking content_cache_1 table schema...')
    
    // Try to get a sample row to see what columns exist
    const { data: sampleData, error: sampleError } = await supabase
      .from('content_cache_1')
      .select('*')
      .limit(1)
    
    if (sampleError) {
      console.error('❌ Error accessing content_cache_1:', sampleError)
      return
    }
    
    console.log('📋 Table exists and accessible')
    if (sampleData && sampleData.length > 0) {
      console.log('✅ Columns found:', Object.keys(sampleData[0]))
      
      // Check specifically for content_type
      const hasContentType = Object.keys(sampleData[0]).includes('content_type')
      console.log(`🔍 content_type column: ${hasContentType ? '✅ EXISTS' : '❌ MISSING'}`)
      
      console.log('\n📊 Sample row structure:')
      const sample = sampleData[0]
      Object.keys(sample).forEach(key => {
        const value = sample[key]
        const truncated = typeof value === 'string' && value.length > 100 
          ? value.substring(0, 100) + '...' 
          : value
        console.log(`  ${key}: ${JSON.stringify(truncated)}`)
      })
    } else {
      console.log('📋 Table is empty, cannot determine schema from data')
      
      // Try to describe the table structure
      console.log('\n🔍 Attempting to query table info...')
      const { error: infoError } = await supabase
        .from('content_cache_1')
        .select('content_type')
        .limit(0)
      
      if (infoError) {
        console.error('❌ content_type column confirmed MISSING:', infoError.message)
      } else {
        console.log('✅ content_type column seems to exist (but table is empty)')
      }
    }
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('content_cache_1')
      .select('*', { count: 'exact', head: true })
    
    if (!countError) {
      console.log(`📊 Total rows in content_cache_1: ${count}`)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkContentCacheSchema()