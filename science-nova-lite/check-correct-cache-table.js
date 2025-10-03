// Check the correct content_cache table schema
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkContentCacheSchema() {
  try {
    console.log('🔍 Checking content_cache table schema...')
    
    // Try to get a sample row to see what columns exist
    const { data: sampleData, error: sampleError } = await supabase
      .from('content_cache')
      .select('*')
      .limit(1)
    
    if (sampleError) {
      console.error('❌ Error accessing content_cache:', sampleError)
      return
    }
    
    console.log('✅ content_cache table exists and accessible')
    if (sampleData && sampleData.length > 0) {
      console.log('📋 Columns found:', Object.keys(sampleData[0]))
      
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
      console.log('📋 Table is empty, trying to determine schema...')
      
      // Try to query content_type specifically to see if column exists
      const { error: contentTypeError } = await supabase
        .from('content_cache')
        .select('content_type')
        .limit(0)
      
      if (contentTypeError) {
        console.error('❌ content_type column confirmed MISSING:', contentTypeError.message)
      } else {
        console.log('✅ content_type column exists (but table is empty)')
      }
    }
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('content_cache')
      .select('*', { count: 'exact', head: true })
    
    if (!countError) {
      console.log(`📊 Total rows in content_cache: ${count}`)
    }
    
    // Also check if there are any other cache tables
    console.log('\n🔍 Checking for other cache-related tables...')
    const tables = ['content_cache_1', 'topics_cache', 'image_cache']
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`  ${table}: ❌ ${error.message}`)
      } else {
        console.log(`  ${table}: ✅ exists with ${data?.length || 0} rows`)
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkContentCacheSchema()