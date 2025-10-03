require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkEmbeddingsSchema() {
  try {
    console.log('--- Checking textbook_embeddings table structure ---')
    const { data, error } = await supabase
      .from('textbook_embeddings')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Sample row:', data?.[0] || 'No data')
      if (data?.[0]) {
        console.log('Available columns:', Object.keys(data[0]))
      }
    }

    console.log('\n--- Getting all embeddings ---')
    const { data: allEmbeddings, error: allError } = await supabase
      .from('textbook_embeddings')
      .select('*')

    if (allError) {
      console.error('Error fetching all:', allError)
    } else {
      console.log(`Total embeddings: ${allEmbeddings?.length || 0}`)
      allEmbeddings?.forEach((emb, i) => {
        console.log(`${i + 1}. ${JSON.stringify(emb, null, 2)}`)
      })
    }

  } catch (error) {
    console.error('Test error:', error)
  }
}

checkEmbeddingsSchema()