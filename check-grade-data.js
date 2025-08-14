const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function checkGradeData() {
  try {
    console.log('🔍 Checking grade level data in textbook_embeddings...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Get a sample of records with their grade levels
    const { data: samples, error: sampleError } = await supabase
      .from('textbook_embeddings')
      .select('grade_level, metadata')
      .limit(10)
    
    if (sampleError) {
      console.error('❌ Error fetching samples:', sampleError)
      return
    }
    
    console.log('📚 Sample textbook records:')
    samples.forEach((record, index) => {
      console.log(`${index + 1}. Grade: ${record.grade_level}, File: ${record.metadata?.file_name || 'Unknown'}`)
    })
    
    // Get count by grade level
    const { data: allRecords, error: allError } = await supabase
      .from('textbook_embeddings')
      .select('grade_level')
    
    if (allError) {
      console.error('❌ Error fetching all records:', allError)
      return
    }
    
    // Count by grade
    const gradeCounts = {}
    allRecords.forEach(record => {
      const grade = record.grade_level
      gradeCounts[grade] = (gradeCounts[grade] || 0) + 1
    })
    
    console.log('\n📊 Grade level distribution:')
    Object.keys(gradeCounts).sort((a, b) => parseInt(a) - parseInt(b)).forEach(grade => {
      console.log(`Grade ${grade}: ${gradeCounts[grade]} records`)
    })
    
    // Specifically check for Grade 4 content
    const { data: grade4, error: grade4Error } = await supabase
      .from('textbook_embeddings')
      .select('content, metadata')
      .eq('grade_level', 4)
      .limit(3)
    
    console.log('\n🎯 Grade 4 specific content:')
    if (grade4Error || !grade4 || grade4.length === 0) {
      console.log('❌ No Grade 4 content found!')
    } else {
      console.log(`✅ Found ${grade4.length} Grade 4 records`)
      grade4.forEach((record, index) => {
        console.log(`${index + 1}. File: ${record.metadata?.file_name}, Content: ${record.content.substring(0, 100)}...`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkGradeData()
