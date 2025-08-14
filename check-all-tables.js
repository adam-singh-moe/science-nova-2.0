const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('🔍 Checking available cache tables...');
    
    // Check enhanced_topic_cache table
    console.log('\n📚 Enhanced Topic Cache:');
    const { data: enhancedCache, error: enhancedError } = await supabase
      .from('enhanced_topic_cache')
      .select('*')
      .limit(5);

    if (enhancedError) {
      console.log(`❌ Enhanced topic cache error: ${enhancedError.message}`);
    } else {
      console.log(`✅ Found ${enhancedCache?.length || 0} entries in enhanced_topic_cache`);
    }

    // Check content_cache table
    console.log('\n📦 Content Cache:');
    const { data: contentCache, error: contentError } = await supabase
      .from('content_cache')
      .select('*')
      .limit(5);

    if (contentError) {
      console.log(`❌ Content cache error: ${contentError.message}`);
    } else {
      console.log(`✅ Found ${contentCache?.length || 0} entries in content_cache`);
      
      if (contentCache && contentCache.length > 0) {
        contentCache.forEach((entry, index) => {
          console.log(`\n${index + 1}. Topic ID: ${entry.topic_id}`);
          console.log(`   User ID: ${entry.user_id || 'null'}`);
          console.log(`   Created: ${entry.created_at}`);
          console.log(`   Content size: ${entry.content ? entry.content.length : 0} bytes`);
          console.log(`   Metadata: ${entry.generation_metadata ? 'Yes' : 'No'}`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables();
