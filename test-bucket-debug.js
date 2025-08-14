// Quick script to debug the Supabase storage bucket structure
import { createClient } from '@supabase/supabase-js'

// You'll need to replace these with your actual values
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function debugBucket() {
  console.log('=== DEBUGGING SUPABASE STORAGE ===')
  
  // First, list all buckets
  console.log('\n1. Listing all buckets:')
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  if (bucketsError) {
    console.error('Error listing buckets:', bucketsError)
  } else {
    console.log('Buckets found:', buckets.map(b => b.name))
  }
  
  // Try to list root of the bucket
  console.log('\n2. Listing root of "Textbook Content" bucket:')
  const { data: rootFiles, error: rootError } = await supabase.storage
    .from('Textbook Content')
    .list('', { limit: 100 })
  
  if (rootError) {
    console.error('Error listing root:', rootError)
  } else {
    console.log('Root contents:', rootFiles.map(f => ({ name: f.name, type: f.name.includes('.') ? 'file' : 'folder' })))
  }
  
  // Try listing grade folders
  for (let grade = 1; grade <= 6; grade++) {
    console.log(`\n3.${grade}. Listing grade_${grade} folder:`)
    const { data: gradeFiles, error: gradeError } = await supabase.storage
      .from('Textbook Content')
      .list(`grade_${grade}`, { limit: 100 })
    
    if (gradeError) {
      console.error(`Error listing grade_${grade}:`, gradeError)
    } else {
      console.log(`grade_${grade} contents:`, gradeFiles.map(f => f.name))
    }
  }
  
  // Try alternative bucket names
  const alternativeNames = ['textbook-content', 'textbook_content', 'textbooks', 'Textbooks']
  for (const name of alternativeNames) {
    console.log(`\n4. Trying alternative bucket name: "${name}"`)
    const { data: altFiles, error: altError } = await supabase.storage
      .from(name)
      .list('', { limit: 10 })
    
    if (altError) {
      console.log(`"${name}" - Error:`, altError.message)
    } else {
      console.log(`"${name}" - Success! Files:`, altFiles.map(f => f.name))
    }
  }
}

debugBucket().catch(console.error)
