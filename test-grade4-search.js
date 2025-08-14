const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testGrade4Search() {
  try {
    console.log('🧪 Testing Grade 4 content search...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const testQuery = "plants"
    
    // Test 1: Basic search in Grade 4 content
    console.log(`\n1️⃣ Testing basic search for "${testQuery}" in Grade 4...`)
    const { data: basicResults, error: basicError } = await supabase
      .from('textbook_embeddings')
      .select('content, metadata, grade_level')
      .eq('grade_level', 4)
      .ilike('content', `%${testQuery}%`)
      .limit(3)
    
    if (basicError) {
      console.error('❌ Basic search error:', basicError)
    } else {
      console.log(`✅ Found ${basicResults?.length || 0} results`)
      basicResults?.forEach((result, index) => {
        console.log(`   ${index + 1}. File: ${result.metadata?.file_name}`)
        console.log(`      Content: ${result.content.substring(0, 150)}...`)
      })
    }
    
    // Test 2: Text search (what the function actually uses)
    console.log(`\n2️⃣ Testing text search for "${testQuery}" in Grade 4...`)
    const { data: textResults, error: textError } = await supabase
      .from('textbook_embeddings')
      .select('content, metadata, grade_level')
      .eq('grade_level', 4)
      .textSearch('content', testQuery.replace(/[^\w\s]/g, ''), {
        type: 'websearch',
        config: 'english'
      })
      .limit(3)
    
    if (textError) {
      console.error('❌ Text search error:', textError)
      console.log('   This might be why the search is failing!')
    } else {
      console.log(`✅ Found ${textResults?.length || 0} results`)
      textResults?.forEach((result, index) => {
        console.log(`   ${index + 1}. File: ${result.metadata?.file_name}`)
        console.log(`      Content: ${result.content.substring(0, 150)}...`)
      })
    }
    
    // Test 3: Just get any Grade 4 content
    console.log(`\n3️⃣ Getting any Grade 4 content...`)
    const { data: anyResults, error: anyError } = await supabase
      .from('textbook_embeddings')
      .select('content, metadata, grade_level')
      .eq('grade_level', 4)
      .limit(3)
    
    if (anyError) {
      console.error('❌ Any content error:', anyError)
    } else {
      console.log(`✅ Found ${anyResults?.length || 0} results`)
      anyResults?.forEach((result, index) => {
        console.log(`   ${index + 1}. File: ${result.metadata?.file_name}`)
        console.log(`      Content: ${result.content.substring(0, 150)}...`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testGrade4Search()
