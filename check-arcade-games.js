require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkArcadeGames() {
  try {
    console.log('=== Checking arcade_games table ===');
    const { data: games, error: gamesError } = await supabase
      .from('arcade_games')
      .select('*')
      .limit(1);
    
    if (gamesError) {
      console.log('arcade_games error:', gamesError.message);
    } else {
      console.log('arcade_games found:', games?.length || 0, 'rows');
      if (games?.length > 0) {
        console.log('Sample game columns:', Object.keys(games[0]));
        console.log('Sample game structure:', JSON.stringify(games[0], null, 2));
      }
    }

    // Test insert to see specific error
    console.log('\n=== Testing arcade_games insert ===');
    const testData = {
      topic_id: 'b568aa87-e4b1-4b53-89e5-9be0c69bde11', // Chemistry topic ID from previous tests
      game_type: 'QUIZ',
      title: 'Test Quiz',
      game_data: { 
        questions: [{
          question: 'Test question?',
          options: ['A', 'B', 'C', 'D'],
          correct: 0
        }]
      },
      difficulty_level: 'medium',
      estimated_duration: 300,
      status: 'draft',
      created_by: '58ed7802-ff6c-4333-bc52-3a1dc20a58fc', // User ID from session logs
      ai_generated: false,
      meta: {}
    };

    console.log('Test data:', JSON.stringify(testData, null, 2));

    const { data: insertTest, error: insertError } = await supabase
      .from('arcade_games')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      console.log('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('✅ Insert successful:', insertTest);
      // Clean up
      if (insertTest && insertTest[0]) {
        await supabase
          .from('arcade_games')
          .delete()
          .eq('id', insertTest[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkArcadeGames();