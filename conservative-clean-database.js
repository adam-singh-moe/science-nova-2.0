require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function conservativeClean() {
  console.log('🪶 CONSERVATIVE DATABASE CLEANUP');
  console.log('=================================\n');
  console.log('This will only clean cache, images, and temporary data.');
  console.log('User profiles, progress, and core data will be preserved.\n');
  
  // Only clean cache and temporary tables
  const cacheOnlyTables = [
    'content_cache',           // Generated content cache
    'story_image_cache',       // Generated image cache  
    'adventure_image_jobs',    // Image generation jobs
    'query_embedding_cache',   // Query embedding cache
    'ai_chat_logs',           // Chat logs (temporary)
    'api_performance_metrics'  // Performance logs
  ];
  
  console.log('📋 Cache tables to clean:');
  cacheOnlyTables.forEach(table => console.log(`   - ${table}`));
  console.log('');
  
  console.log('🔒 PRESERVED (will NOT be touched):');
  console.log('   - profiles (user accounts)');
  console.log('   - user_progress (learning progress)');
  console.log('   - topics & study_areas (course content)');
  console.log('   - textbook_uploads & textbook_content');
  console.log('   - daily_adventures & adventure_completions');
  console.log('');
  
  let totalFreed = 0;
  
  for (const table of cacheOnlyTables) {
    try {
      console.log(`🧽 Cleaning cache: ${table}...`);
      
      // First, try to get actual data to see if table has records
      const { data: tableData, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (fetchError) {
        console.log(`   ⚪ Cache table doesn't exist: ${table}`);
        continue;
      }
      
      // If count fails, use data length as indicator
      const hasData = tableData && tableData.length > 0;
      
      // Get count using a different method
      const { count: beforeCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      // If count fails, try to get all data to count it manually
      let actualCount = beforeCount;
      if (!beforeCount && hasData) {
        const { data: allData } = await supabase.from(table).select('*');
        actualCount = allData?.length || 0;
      }
      
      if (hasData || (beforeCount && beforeCount > 0) || actualCount > 0) {
        // Use different deletion strategies based on table structure
        let deleteResult;
        
        if (table === 'story_image_cache' || table === 'adventure_image_jobs') {
          // For image cache tables, delete all records unconditionally
          deleteResult = await supabase
            .from(table)
            .delete()
            .gte('created_at', '1900-01-01'); // Delete all records by using a date condition that matches everything
        } else {
          // For other tables, use the original method
          deleteResult = await supabase
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        }
        
        if (deleteResult.error) {
          console.log(`   ❌ Error: ${deleteResult.error.message}`);
        } else {
          console.log(`   ✅ Cleaned ${actualCount || 'unknown'} cache entries`);
          if (typeof actualCount === 'number' && actualCount > 0) {
            totalFreed += actualCount;
          }
        }
      } else {
        console.log(`   ⚪ Cache already empty`);
      }
      
    } catch (err) {
      console.log(`   ⚪ Cache table doesn't exist: ${table}`);
    }
  }
  
  console.log('\n🎯 CONSERVATIVE CLEANUP SUMMARY');
  console.log('===============================');
  console.log(`✅ Cache entries cleaned: ${totalFreed}`);
  console.log('🔒 User data preserved');
  console.log('🔒 Learning progress preserved');
  console.log('🔒 Course content preserved');
  console.log('\n💡 This should free up space and reset cached content & images');
  console.log('   while keeping all your important data intact.');
}

// Run conservative cleanup
conservativeClean().catch(console.error);
