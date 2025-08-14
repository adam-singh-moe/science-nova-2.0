const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugStorageAccess() {
  console.log('🔍 Debugging storage access...')
  
  try {
    // Check textbook file paths in database
    const { data: textbooks } = await supabaseAdmin
      .from('textbook_uploads')
      .select('id, file_name, file_path, grade_level')
      .limit(3)
    
    console.log('\n📚 Sample textbook file paths from database:')
    textbooks?.forEach(book => {
      console.log(`  - ${book.file_name}`)
      console.log(`    Path: ${book.file_path}`)
      console.log(`    Grade: ${book.grade_level}`)
    })
    
    // Check storage bucket structure
    console.log('\n🗄️ Storage bucket structure:')
    
    // List root level
    const { data: rootFiles, error: rootError } = await supabaseAdmin.storage
      .from('textbook_content')
      .list('', { limit: 10 })
    
    if (rootError) {
      console.error('❌ Root listing error:', rootError)
    } else {
      console.log('  Root level files/folders:')
      rootFiles?.forEach(item => {
        console.log(`    - ${item.name} ${item.id ? '(file)' : '(folder)'}`)
      })
    }
    
    // Check specific grade folders
    for (let grade = 1; grade <= 6; grade++) {
      const { data: gradeFiles, error: gradeError } = await supabaseAdmin.storage
        .from('textbook_content')
        .list(`grade_${grade}`, { limit: 5 })
      
      if (gradeError) {
        console.log(`  Grade ${grade}: Error - ${gradeError.message}`)
      } else {
        console.log(`  Grade ${grade}: ${gradeFiles?.length || 0} files`)
        gradeFiles?.forEach(file => {
          console.log(`    - ${file.name}`)
        })
      }
    }
    
    // Test downloading a specific file
    const testBook = textbooks?.[0]
    if (testBook) {
      console.log(`\n🔄 Testing download of: ${testBook.file_path}`)
      
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('textbook_content')
        .download(testBook.file_path)
      
      if (downloadError) {
        console.error('❌ Download error:', downloadError)
      } else {
        console.log(`✅ Download successful - Size: ${fileData?.size || 0} bytes, Type: ${fileData?.type}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugStorageAccess()
