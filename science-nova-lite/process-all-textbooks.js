const fs = require('fs')
const OpenAI = require('openai')
const { createClient } = require('@supabase/supabase-js')
const { extractTextFromPDF } = require('./lib/pdf-extractor.ts')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

// Initialize OpenAI and Supabase clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Function to create chunks from text
function createChunks(text, chunkSize = 1000, overlap = 200) {
  const chunks = []
  let start = 0
  
  while (start < text.length) {
    let end = start + chunkSize
    
    // If not at the end, try to break at a sentence or word boundary
    if (end < text.length) {
      const sentenceEnd = text.lastIndexOf('.', end)
      const wordEnd = text.lastIndexOf(' ', end)
      
      if (sentenceEnd > start + chunkSize * 0.5) {
        end = sentenceEnd + 1
      } else if (wordEnd > start + chunkSize * 0.5) {
        end = wordEnd
      }
    }
    
    chunks.push(text.slice(start, end).trim())
    start = end - overlap
    
    if (start >= text.length) break
  }
  
  return chunks.filter(chunk => chunk.length > 50) // Filter out very small chunks
}

// Function to generate embeddings
async function generateEmbeddings(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000), // Limit to token size
      dimensions: 1536
    })
    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embeddings:', error.message)
    throw error
  }
}

// Function to process a single PDF
async function processPDF(pdfInfo, index, total) {
  console.log(`\n${'🔄'.repeat(3)} Processing ${index}/${total}: ${pdfInfo.name}`)
  console.log(`   📍 Path: ${pdfInfo.path}`)
  console.log(`   📏 Size: ${pdfInfo.sizeMB} MB`)
  console.log(`   🏷️  Type: ${pdfInfo.estimatedType}`)
  console.log('─'.repeat(60))
  
  const startTime = Date.now()
  
  try {
    // Check if file exists
    if (!fs.existsSync(pdfInfo.path)) {
      throw new Error(`File not found: ${pdfInfo.path}`)
    }
    
    // Load PDF buffer
    const pdfBuffer = fs.readFileSync(pdfInfo.path)
    console.log(`   📖 Loaded PDF buffer: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`)
    
    // Extract text using Docling
    console.log(`   🔍 Extracting text with Docling OCR...`)
    const extractionResult = await extractTextFromPDF(pdfBuffer, pdfInfo.name)
    
    if (!extractionResult.success) {
      throw new Error(`Text extraction failed: ${extractionResult.error || 'Unknown error'}`)
    }
    
    const extractionDuration = (Date.now() - startTime) / 1000
    console.log(`   ✅ Text extracted: ${extractionResult.text.length} characters`)
    console.log(`   🔧 Method: ${extractionResult.method}`)
    console.log(`   ⏱️  Extraction time: ${extractionDuration.toFixed(2)}s`)
    
    // Create chunks from extracted text
    console.log(`   ✂️  Creating text chunks...`)
    const chunks = createChunks(extractionResult.text, 1000, 200)
    console.log(`   📦 Created ${chunks.length} chunks`)
    
    // Process chunks and generate embeddings
    console.log(`   🧠 Generating embeddings...`)
    let successfulInserts = 0
    let embeddingTime = 0
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`      Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`)
      
      try {
        const embeddingStart = Date.now()
        const embedding = await generateEmbeddings(chunk)
        embeddingTime += (Date.now() - embeddingStart)
        
        // Insert into database
        const { error } = await supabase
          .from('textbook_embeddings')
          .insert({
            file_name: pdfInfo.name,
            content: chunk,
            embedding: embedding,
            chunk_index: i,
            extraction_method: extractionResult.method,
            processing_metadata: {
              originalFileSize: pdfBuffer.length,
              extractedCharacters: extractionResult.text.length,
              chunkSize: chunk.length,
              estimatedType: pdfInfo.estimatedType,
              processingDuration: extractionDuration
            }
          })
          
        if (error) {
          throw new Error(`Database insert failed: ${error.message}`)
        }
        
        successfulInserts++
        
      } catch (chunkError) {
        console.error(`      ❌ Failed to process chunk ${i + 1}: ${chunkError.message}`)
      }
    }
    
    const totalDuration = (Date.now() - startTime) / 1000
    const processingSpeed = (pdfBuffer.length / 1024 / 1024) / (totalDuration / 60) // MB per minute
    
    console.log(`\n   📊 PROCESSING COMPLETE for ${pdfInfo.name}:`)
    console.log(`      ✅ Total chunks processed: ${successfulInserts}/${chunks.length}`)
    console.log(`      ⏱️  Total time: ${totalDuration.toFixed(2)}s`)
    console.log(`      🧠 Embedding time: ${(embeddingTime / 1000).toFixed(2)}s`)
    console.log(`      🚀 Processing speed: ${processingSpeed.toFixed(2)} MB/min`)
    console.log(`      📝 Text extracted: ${extractionResult.text.length} characters`)
    console.log(`      🔧 Method: ${extractionResult.method}`)
    
    return {
      success: true,
      name: pdfInfo.name,
      type: pdfInfo.estimatedType,
      method: extractionResult.method,
      duration: totalDuration,
      charactersExtracted: extractionResult.text.length,
      chunksCreated: chunks.length,
      chunksStored: successfulInserts,
      speed: processingSpeed,
      embeddingTime: embeddingTime / 1000
    }
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000
    console.log(`\n   ❌ PROCESSING FAILED for ${pdfInfo.name}:`)
    console.log(`      ⏱️  Duration: ${duration.toFixed(2)}s`)
    console.log(`      📝 Error: ${error.message}`)
    
    return {
      success: false,
      name: pdfInfo.name,
      type: pdfInfo.estimatedType,
      duration: duration,
      error: error.message
    }
  }
}

// Main processing function
async function processAllTextbooksToDatabase() {
  try {
    console.log('🚀 Processing All Textbooks to Database with Docling OCR')
    console.log('=' .repeat(70))
    
    // Load the PDF manifest
    const manifest = JSON.parse(fs.readFileSync('pdf-manifest.json', 'utf8'))
    console.log(`📚 Found ${manifest.totalPDFs} PDFs to process`)
    console.log(`⏰ Estimated extraction time: ~${manifest.estimatedProcessingTime} minutes`)
    console.log(`🗄️  Target: Supabase textbook_embeddings table\\n`)
    
    const results = []
    let totalStartTime = Date.now()
    
    // Process all PDFs
    for (let i = 0; i < manifest.pdfs.length; i++) {
      const pdf = manifest.pdfs[i]
      const result = await processPDF(pdf, i + 1, manifest.pdfs.length)
      results.push(result)
      
      // Small delay between files to prevent API rate limits
      if (i < manifest.pdfs.length - 1) {
        console.log(`\\n   ⏳ Waiting 2 seconds before next file...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    const totalDuration = (Date.now() - totalStartTime) / 1000 / 60 // minutes
    
    console.log(`\\n🏁 ALL PROCESSING COMPLETE`)
    console.log('=' .repeat(70))
    console.log(`⏱️  Total time: ${totalDuration.toFixed(2)} minutes`)
    console.log(`📊 Processed: ${results.length} PDFs`)
    
    // Calculate statistics
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    const totalChunks = successful.reduce((sum, r) => sum + (r.chunksStored || 0), 0)
    const totalCharacters = successful.reduce((sum, r) => sum + (r.charactersExtracted || 0), 0)
    const doclingUsed = successful.filter(r => r.method && r.method.includes('docling')).length
    
    console.log(`\\n📈 SUCCESS RATE: ${successful.length}/${results.length} (${(successful.length/results.length*100).toFixed(1)}%)`)
    console.log(`🔧 Docling Used: ${doclingUsed}/${successful.length} (${(doclingUsed/successful.length*100).toFixed(1)}%)`)
    console.log(`📦 Total Chunks Stored: ${totalChunks}`)
    console.log(`📝 Total Characters Extracted: ${totalCharacters.toLocaleString()}`)
    
    if (failed.length > 0) {
      console.log(`\\n❌ FAILED FILES (${failed.length}):`)
      failed.forEach((failure, index) => {
        console.log(`   ${index + 1}. ${failure.name}: ${failure.error}`)
      })
    }
    
    // Detailed results
    console.log(`\\n📋 DETAILED RESULTS:`)
    results.forEach((result, index) => {
      console.log(`\\n${index + 1}. ${result.name}`)
      console.log(`   Type: ${result.type}`)
      console.log(`   Success: ${result.success ? '✅' : '❌'}`)
      if (result.success) {
        console.log(`   Method: ${result.method}`)
        console.log(`   Duration: ${result.duration.toFixed(2)}s`)
        console.log(`   Characters: ${result.charactersExtracted}`)
        console.log(`   Chunks: ${result.chunksStored}/${result.chunksCreated}`)
        console.log(`   Speed: ${result.speed.toFixed(2)} MB/min`)
        console.log(`   Embedding time: ${result.embeddingTime.toFixed(2)}s`)
      } else {
        console.log(`   Error: ${result.error}`)
      }
    })
    
    // Save results
    const processingResults = {
      timestamp: new Date().toISOString(),
      totalDuration: totalDuration,
      results: results,
      summary: {
        totalProcessed: results.length,
        successful: successful.length,
        failed: failed.length,
        successRate: (successful.length/results.length*100).toFixed(1) + '%',
        doclingUsage: doclingUsed,
        totalChunksStored: totalChunks,
        totalCharactersExtracted: totalCharacters
      }
    }
    
    fs.writeFileSync('complete-processing-results.json', JSON.stringify(processingResults, null, 2))
    console.log(`\\n💾 Complete processing results saved to complete-processing-results.json`)
    
    // Verify database state
    console.log(`\\n🔍 Verifying database state...`)
    const { data: dbCheck, error: dbError } = await supabase
      .from('textbook_embeddings')
      .select('file_name, count(*)')
      .group('file_name')
    
    if (dbError) {
      console.error(`❌ Database verification failed: ${dbError.message}`)
    } else {
      console.log(`✅ Database contains ${dbCheck.length} files with embeddings:`)
      dbCheck.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.file_name}: ${file.count} chunks`)
      })
    }
    
    return results
    
  } catch (error) {
    console.error('❌ Complete processing failed:', error.message)
    return []
  }
}

// Run if called directly
if (require.main === module) {
  processAllTextbooksToDatabase()
    .then(results => {
      console.log(`\\n🎉 Processing completed with ${results.filter(r => r.success).length} successful files`)
      process.exit(0)
    })
    .catch(error => {
      console.error('Fatal error:', error.message)
      process.exit(1)
    })
}