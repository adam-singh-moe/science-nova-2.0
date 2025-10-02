// Direct database test for discovery content
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testDiscoveryDatabase() {
  try {
    console.log('🧪 Testing Discovery Database Direct Connection...\n');
    
    // Test direct query to discovery_content table
    const { data, error } = await supabase
      .from('discovery_content')
      .select(`
        *,
        topics:topic_id (
          id,
          title,
          grade_level
        )
      `)
      .eq('status', 'published')
      .limit(5)
      
    if (error) {
      console.error('❌ Database Error:', error);
      return;
    }
    
    console.log(`✅ Found ${data?.length || 0} discovery content items:\n`);
    
    data?.forEach((item, index) => {
      console.log(`${index + 1}. Title: ${item.title}`);
      console.log(`   Content Type: ${item.content_type}`);
      console.log(`   Topic: ${item.topics?.title || 'No topic'}`);
      console.log(`   Grade Level: ${item.topics?.grade_level || 'Unknown'}`);
      console.log(`   Fact Text: ${item.fact_text?.substring(0, 100)}...`);
      console.log(`   Status: ${item.status}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error testing database:', error.message);
  }
}

testDiscoveryDatabase();