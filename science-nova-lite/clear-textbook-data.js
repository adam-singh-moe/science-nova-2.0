require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.error('❌ Supabase key not found in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearAllTextbookData() {
  try {
    console.log('🗑️  Clearing all existing textbook data...')
    console.log('Database URL:', supabaseUrl)
    
    // Get current data count before deletion
    const { data: currentData, error: countError } = await supabase
      .from('textbook_embeddings')
      .select('id, file_name')
    
    if (countError) {
      console.error('❌ Error checking current data:', countError)
      return
    }
    
    console.log(`📊 Found ${currentData?.length || 0} existing records`)
    
    if (currentData && currentData.length > 0) {
      // Group by filename for summary
      const textbookCounts = {}
      currentData.forEach(record => {
        const name = record.file_name || 'Unknown'
        textbookCounts[name] = (textbookCounts[name] || 0) + 1
      })
      
      console.log('📚 Current textbook data:')
      Object.entries(textbookCounts).forEach(([name, count]) => {
        console.log(`   ${name}: ${count} chunks`)
      })
      
      // Delete all records
      console.log('\n🔥 Deleting all textbook embeddings...')
      const { error: deleteError } = await supabase
        .from('textbook_embeddings')
        .delete()
        .not('id', 'is', null) // Delete all records where id is not null
      
      if (deleteError) {
        console.error('❌ Error deleting data:', deleteError)
        return
      }
      
      console.log('✅ Successfully deleted all textbook data')
    } else {
      console.log('ℹ️  No existing data to delete')
    }
    
    // Verify deletion
    const { data: verifyData, error: verifyError } = await supabase
      .from('textbook_embeddings')
      .select('id')
    
    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError)
      return
    }
    
    console.log(`✅ Verification: ${verifyData?.length || 0} records remaining (should be 0)`)
    console.log('🎯 Database is now clean and ready for fresh processing!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

clearAllTextbookData()