require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkArcadeSchema() {
  try {
    console.log('🎮 Checking arcade_games table schema...');
    
    // Check table structure
    const { data: schema, error: schemaError } = await supabase
      .rpc('sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'arcade_games' 
          ORDER BY ordinal_position;
        `
      });

    if (schemaError) {
      console.error('Schema error:', schemaError);
      return;
    }

    console.log('\n📋 Arcade Games Table Schema:');
    schema.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

    // Try to insert a test record to see what fails
    console.log('\n🧪 Testing sample insert...');
    const testData = {
      topic_id: 'test-topic-id',
      game_type: 'QUIZ',
      title: 'Test Quiz',
      game_data: { questions: [] },
      difficulty_level: 'medium',
      estimated_duration: 300,
      status: 'draft',
      created_by: 'test-user-id',
      ai_generated: false,
      meta: {}
    };

    const { data: insertTest, error: insertError } = await supabase
      .from('arcade_games')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('Insert test error:', insertError);
      console.log('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('✅ Insert test successful');
      // Clean up
      await supabase
        .from('arcade_games')
        .delete()
        .eq('id', insertTest[0].id);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkArcadeSchema();