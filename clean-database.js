require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// List of all tables that might contain data
const TABLES_TO_CLEAN = [
  // Core application tables
  'profiles',
  'topics',
  'study_areas',
  'user_progress',
  'content_cache',
  
  // Textbook and content tables
  'textbook_uploads',
  'textbook_embeddings',
  'textbook_content',
  
  // Adventure system tables
  'daily_adventures',
  'adventure_completions',
  
  // Image and cache tables
  'story_image_cache',
  'adventure_image_jobs',
  'query_embedding_cache',
  
  // Logging and monitoring
  'ai_chat_logs',
  'api_performance_metrics'
];

async function cleanDatabase() {
  console.log('🗑️  DATABASE CLEANUP SCRIPT');
  console.log('=========================\n');
  
  console.log('⚠️  WARNING: This will delete ALL data from your database!');
  console.log('📋 Tables that will be cleaned:');
  TABLES_TO_CLEAN.forEach(table => console.log(`   - ${table}`));
  console.log('');
  
  // Count current records before cleanup
  console.log('📊 Current data counts:');
  const currentCounts = {};
  
  for (const table of TABLES_TO_CLEAN) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        console.log(`   ❌ ${table}: Error - ${error.message}`);
      } else if (error) {
        console.log(`   ⚪ ${table}: Table doesn't exist`);
      } else {
        currentCounts[table] = count || 0;
        console.log(`   📈 ${table}: ${count || 0} records`);
      }
    } catch (err) {
      console.log(`   ⚪ ${table}: Table doesn't exist or not accessible`);
    }
  }
  
  const totalRecords = Object.values(currentCounts).reduce((sum, count) => sum + count, 0);
  console.log(`\n📊 Total records to delete: ${totalRecords}\n`);
  
  if (totalRecords === 0) {
    console.log('✅ Database is already clean!');
    return;
  }
  
  // Pause for confirmation (in a real scenario, you'd want user input)
  console.log('⏳ Starting cleanup in 3 seconds...');
  console.log('   Press Ctrl+C to cancel now!');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n🧹 Beginning database cleanup...\n');
  
  let cleanedTables = 0;
  let totalDeleted = 0;
  
  // Clean tables in reverse dependency order (children first, then parents)
  const cleanupOrder = [
    // Clean dependent tables first
    'adventure_image_jobs',
    'story_image_cache',
    'adventure_completions',
    'daily_adventures',
    'user_progress',
    'ai_chat_logs',
    'api_performance_metrics',
    'query_embedding_cache',
    'textbook_embeddings',
    'textbook_content',
    'content_cache',
    
    // Clean parent tables last
    'textbook_uploads',
    'topics',
    'profiles', // Keep this last as it might be referenced by other tables
    'study_areas'
  ];
  
  for (const table of cleanupOrder) {
    if (currentCounts[table] > 0) {
      try {
        console.log(`🧽 Cleaning ${table}...`);
        
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
        
        if (error) {
          console.log(`   ❌ Error cleaning ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ Cleaned ${table} (${currentCounts[table]} records deleted)`);
          cleanedTables++;
          totalDeleted += currentCounts[table];
        }
        
      } catch (err) {
        console.log(`   ❌ Error cleaning ${table}: ${err.message}`);
      }
    }
  }
  
  console.log('\n🎯 CLEANUP SUMMARY');
  console.log('==================');
  console.log(`✅ Tables cleaned: ${cleanedTables}`);
  console.log(`📊 Total records deleted: ${totalDeleted}`);
  console.log('🗄️  Table structures preserved');
  console.log('🔐 Permissions and policies intact');
  
  console.log('\n🔄 Verifying cleanup...');
  
  // Verify cleanup
  let remainingRecords = 0;
  for (const table of TABLES_TO_CLEAN) {
    if (currentCounts[table] > 0) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (count > 0) {
          console.log(`   ⚠️  ${table}: ${count} records remaining`);
          remainingRecords += count;
        }
      } catch (err) {
        // Ignore errors for non-existent tables
      }
    }
  }
  
  if (remainingRecords === 0) {
    console.log('✅ Database successfully cleaned!');
    console.log('\n🚀 Your database is now ready for fresh data.');
    console.log('\n💡 Next steps:');
    console.log('   1. Create a new user account');
    console.log('   2. Upload textbooks if needed');
    console.log('   3. Generate fresh content');
  } else {
    console.log(`⚠️  ${remainingRecords} records still remain in the database.`);
  }
}

// Run the cleanup
cleanDatabase().catch(console.error);
