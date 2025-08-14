// Debug script for testing textbook upload API
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function testTextbookAPI() {
  try {
    console.log('Testing textbook_uploads table...')
    
    // Test basic query
    const { data, error } = await supabase
      .from('textbook_uploads')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('Error querying textbook_uploads:', error)
      return { success: false, error }
    }
    
    console.log('Successfully queried textbook_uploads table')
    console.log('Records found:', data?.length || 0)
    console.log('Sample data:', data?.[0] || 'No records')
    
    return { success: true, data }
  } catch (error) {
    console.error('Test failed:', error)
    return { success: false, error }
  }
}
