require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceKey)

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema...\n')

  try {
    // Check what tables exist by trying to query them
    console.log('📋 1. Checking existing tables...')
    const tablesCheck = [
      'textbook_embeddings',
      'textbook_uploads', 
      'profiles',
      'topics',
      'study_areas'
    ]
    
    const results = []
    for (const table of tablesCheck) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1)
        if (!error) {
          results.push({ table_name: table, exists: true })
        } else {
          results.push({ table_name: table, exists: false, error: error.message })
        }
      } catch (e) {
        results.push({ table_name: table, exists: false, error: e.message })
      }
    }

    console.log('✅ Table status:')
    results.forEach(table => {
      console.log(`  - ${table.table_name} ${table.exists ? '✅' : '❌ (' + table.error + ')'}`)
    })

    // Check textbook_embeddings specifically
    console.log('\n📖 2. Checking textbook_embeddings table...')
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('textbook_embeddings')
      .select('id, grade_level, file_name, chunk_index, created_at')
      .limit(5)
    
    if (embeddingsError) {
      console.error('❌ Embeddings table error:', embeddingsError)
    } else {
      console.log(`✅ Textbook embeddings table exists with ${embeddings?.length || 0} sample records`)
      if (embeddings && embeddings.length > 0) {
        console.log('📋 Sample records:')
        embeddings.forEach((emb, idx) => {
          console.log(`  ${idx + 1}. ${emb.file_name} (Grade ${emb.grade_level}, Chunk ${emb.chunk_index})`)
        })
      }
    }

    // Check if there's an upload tracking system
    console.log('\n📤 3. Checking for upload tracking...')
    const uploadTables = ['textbook_uploads', 'uploads', 'documents', 'files']
    
    for (const table of uploadTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1)
        if (!error) {
          console.log(`✅ Found upload table: ${table}`)
          const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
          console.log(`   Contains ${count} records`)
          break
        }
      } catch (e) {
        console.log(`❌ Table ${table} not found`)
      }
    }

    // Check storage buckets
    console.log('\n🗂️  4. Checking storage buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Buckets error:', bucketsError)
    } else {
      console.log('✅ Available storage buckets:')
      buckets?.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
      })
      
      // Check textbook_content bucket specifically
      if (buckets?.find(b => b.name === 'textbook_content')) {
        console.log('\n📚 Checking textbook_content bucket...')
        const { data: files, error: filesError } = await supabase.storage
          .from('textbook_content')
          .list()
        
        if (filesError) {
          console.error('❌ Files error:', filesError)
        } else {
          console.log(`✅ Found ${files?.length || 0} items in textbook_content bucket`)
          files?.forEach(file => {
            console.log(`  - ${file.name}`)
          })
        }
      }
    }

  } catch (error) {
    console.error('💥 Error checking schema:', error)
  }
}

checkDatabaseSchema()