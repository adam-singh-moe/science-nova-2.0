require('dotenv').config({path:'.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

supabase.from('lessons').select('id, title').limit(5).then(({data, error}) => {
  if(error) console.log('Error:', error.message);
  else console.log('Lessons:', JSON.stringify(data, null, 2));
});