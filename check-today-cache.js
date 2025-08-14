const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllToday() {
  try {
    console.log('🔍 Checking all cache entries from today...');
    
    // Get today's date in various formats to handle timezone issues
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    
    console.log(`Looking for entries since: ${todayStart}`);
    
    const { data: cacheData, error } = await supabase
      .from('content_cache')
      .select('*')
      .gte('created_at', todayStart)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ Error fetching cache data:', error);
      return;
    }
    
    console.log(`📚 Found ${cacheData.length} cache entries from today:`);
    
    if (cacheData.length === 0) {
      // Let's also check the last 5 entries regardless of date
      console.log('No entries from today, checking last 5 entries...');
      
      const { data: recentData, error: recentError } = await supabase
        .from('content_cache')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (recentError) {
        console.error('❌ Error fetching recent data:', recentError);
        return;
      }
      
      console.log(`📚 Last 5 cache entries:`);
      recentData.forEach((entry, index) => {
        console.log(`${index + 1}. Topic ID: ${entry.topic_id}`);
        console.log(`   Created: ${new Date(entry.created_at).toLocaleString()}`);
        console.log(`   Content length: ${entry.content ? entry.content.length : 0} chars`);
        console.log('');
      });
      return;
    }
    
    cacheData.forEach((entry, index) => {
      const hasContent = entry.content && Object.keys(JSON.parse(entry.content)).length > 0;
      const hasImages = entry.image_urls && entry.image_urls.length > 0;
      const imageCount = hasImages ? entry.image_urls.length : 0;
      
      console.log(`${index + 1}. Topic ID: ${entry.topic_id}`);
      console.log(`   User: ${entry.user_id || 'N/A'}`);
      console.log(`   Created: ${new Date(entry.created_at).toLocaleString()}`);
      console.log(`   Has content: ${hasContent}`);
      console.log(`   Images: ${imageCount}`);
      console.log(`   Content length: ${entry.content ? entry.content.length : 0} chars`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkAllToday();
