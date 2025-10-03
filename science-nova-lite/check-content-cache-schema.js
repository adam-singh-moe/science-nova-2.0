// Check the schema of content_cache_1 table
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkContentCacheSchema() {
  try {
    console.log('🔍 Checking content_cache_1 table schema...')
    
    // Get table schema information
    const { data: schema, error: schemaError } = await supabase
      .rpc('get_table_schema', { table_name: 'content_cache_1' })
    
    if (schemaError) {
      console.log('Using alternative method to check schema...')
      
      // Alternative: Get a sample row to see what columns exist
      const { data: sampleData, error: sampleError } = await supabase
        .from('content_cache_1')
        .select('*')
        .limit(1)
      
      if (sampleError) {
        console.error('❌ Error getting sample data:', sampleError)
        
        // Try direct SQL query
        const { data: sqlData, error: sqlError } = await supabase
          .rpc('execute_sql', { 
            query: `
              SELECT column_name, data_type, is_nullable, column_default
              FROM information_schema.columns 
              WHERE table_name = 'content_cache_1' AND table_schema = 'public'
              ORDER BY ordinal_position;
            `
          })
        
        if (sqlError) {
          console.error('❌ Error getting table info via SQL:', sqlError)
        } else {
          console.log('📋 Table columns from information_schema:')
          console.table(sqlData)
        }
      } else {
        console.log('📋 Sample data (showing column structure):')
        if (sampleData && sampleData.length > 0) {
          console.log('Columns found:', Object.keys(sampleData[0]))
          console.log('Sample row:', sampleData[0])
        } else {
          console.log('No data found in table')
        }
      }
    } else {
      console.log('📋 Table schema:')
      console.table(schema)
    }
    
    // Check if content_type column specifically exists
    const { data: contentTypeCheck, error: contentTypeError } = await supabase
      .from('content_cache_1')
      .select('content_type')
      .limit(1)
    
    if (contentTypeError) {
      console.error('❌ content_type column does NOT exist:', contentTypeError.message)
    } else {
      console.log('✅ content_type column exists and is accessible')
    }
    
    // Also check what data is in the table
    const { data: allData, error: allError } = await supabase
      .from('content_cache_1')
      .select('*')
      .limit(5)
    
    if (allError) {
      console.error('❌ Error getting all data:', allError)
    } else {
      console.log(`📊 Found ${allData?.length || 0} rows in content_cache_1`)
      if (allData && allData.length > 0) {
        console.log('Sample rows:')
        allData.forEach((row, i) => {
          console.log(`Row ${i + 1}:`, Object.keys(row).reduce((acc, key) => {
            acc[key] = typeof row[key] === 'string' && row[key].length > 50 
              ? row[key].substring(0, 50) + '...' 
              : row[key]
            return acc
          }, {}))
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkContentCacheSchema()