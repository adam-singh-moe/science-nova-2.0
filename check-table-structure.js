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

async function checkTables() {
  try {
    console.log('=== Checking textbook_chunks table ===');
    const { data: chunks, error: chunksError } = await supabase
      .from('textbook_chunks')
      .select('*')
      .limit(1);
    
    if (chunksError) {
      console.log('textbook_chunks error:', chunksError.message);
    } else {
      console.log('textbook_chunks found:', chunks?.length || 0, 'rows');
      if (chunks?.length > 0) {
        console.log('Sample chunk columns:', Object.keys(chunks[0]));
      }
    }
    
    console.log('\n=== Checking textbook_embeddings table ===');
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('textbook_embeddings')
      .select('*')
      .limit(1);
    
    if (embeddingsError) {
      console.log('textbook_embeddings error:', embeddingsError.message);
    } else {
      console.log('textbook_embeddings found:', embeddings?.length || 0, 'rows');
      if (embeddings?.length > 0) {
        console.log('Sample embedding columns:', Object.keys(embeddings[0]));
        console.log('Sample metadata:', embeddings[0].metadata);
        console.log('Sample content preview:', embeddings[0].content?.substring(0, 100) + '...');
      }
    }

    console.log('\n=== Checking textbook uploads ===');
    const { data: uploads, error: uploadsError } = await supabase
      .from('textbook_uploads')
      .select('*')
      .limit(1);
    
    if (uploadsError) {
      console.log('textbook_uploads error:', uploadsError.message);
    } else {
      console.log('textbook_uploads found:', uploads?.length || 0, 'rows');
      if (uploads?.length > 0) {
        console.log('Sample upload columns:', Object.keys(uploads[0]));
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTables();
