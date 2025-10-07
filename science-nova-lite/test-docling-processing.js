const fs = require('fs')
const { extractTextFromPDF } = require('./lib/pdf-extractor.ts')

async function processAllTextbooksWithDocling() {
  try {
    console.log('🚀 Processing All Textbooks with Docling OCR System')
    console.log('=' .repeat(70))
    
    // Load the PDF manifest
    const manifest = JSON.parse(fs.readFileSync('pdf-manifest.json', 'utf8'))
    console.log(`📚 Found ${manifest.totalPDFs} PDFs to process`)
    console.log(`⏰ Estimated time: ~68 minutes\n`)
    
    // Select a strategic subset for testing (3 different types)
    const testPDFs = [
      // Text-based PDF (should be fast with good text extraction)
      manifest.pdfs.find(pdf => pdf.name === 'Science Around Us Book 1.pdf'),
      // Image-based PDF (should use OCR and take longer)  
      manifest.pdfs.find(pdf => pdf.name === 'Science Around Us Book 3.pdf'),
      // Mixed PDF (should use hybrid processing)
      manifest.pdfs.find(pdf => pdf.name === 'Science Around Us Book 1 - Copy.pdf')
    ].filter(Boolean) // Remove any undefined entries
    
    console.log('🎯 Testing with strategic subset:')
    testPDFs.forEach((pdf, index) => {
      console.log(`   ${index + 1}. ${pdf.name} (${pdf.sizeMB} MB) - ${pdf.estimatedType}`)
    })
    console.log()
    
    const results = []
    let totalStartTime = Date.now()
    
    for (let i = 0; i < testPDFs.length; i++) {
      const pdf = testPDFs[i]
      console.log(`\n${'▶️'.repeat(3)} Processing ${i + 1}/${testPDFs.length}: ${pdf.name}`)
      console.log(`   📍 Path: ${pdf.path}`)
      console.log(`   📏 Size: ${pdf.sizeMB} MB`)
      console.log(`   🏷️  Type: ${pdf.estimatedType}`)
      console.log('─'.repeat(50))
      
      const startTime = Date.now()
      
      try {
        // Check if file exists
        if (!fs.existsSync(pdf.path)) {
          throw new Error(`File not found: ${pdf.path}`)
        }
        
        // Load PDF buffer
        const pdfBuffer = fs.readFileSync(pdf.path)
        console.log(`   📖 Loaded PDF buffer: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`)
        
        // Process with new Docling system
        const result = await extractTextFromPDF(pdfBuffer, pdf.name)
        
        const duration = (Date.now() - startTime) / 1000
        const processingSpeed = (pdfBuffer.length / 1024 / 1024) / (duration / 60) // MB per minute
        
        console.log(`\n📊 RESULTS for ${pdf.name}:`)
        console.log(`   ✅ Success: ${result.success}`)
        console.log(`   🔧 Method: ${result.method}`)
        console.log(`   ⏱️  Duration: ${duration.toFixed(2)}s`)
        console.log(`   📝 Characters: ${result.text.length}`)
        console.log(`   🚀 Speed: ${processingSpeed.toFixed(2)} MB/min`)
        
        // Analyze extraction quality
        let extractionQuality = 'Unknown'
        if (result.method.includes('docling')) {
          if (result.text.includes('This is an image-based PDF')) {
            extractionQuality = '⚠️ Descriptive fallback (OCR failed)'
          } else if (result.text.length > 1000) {
            extractionQuality = '✅ High-quality extraction'
          } else {
            extractionQuality = '⚠️ Minimal content extracted'
          }
        } else {
          extractionQuality = '🔄 Fallback method used'
        }
        
        console.log(`   🎯 Quality: ${extractionQuality}`)
        
        // Show content preview
        const preview = result.text.substring(0, 200).replace(/\n/g, ' ')
        console.log(`   📖 Preview: "${preview}..."`)
        
        // Determine if this matches expected behavior
        let expectedBehavior = 'Unknown'
        if (pdf.estimatedType === 'text-based' && result.method.includes('docling') && result.text.length > 5000) {
          expectedBehavior = '✅ Expected: Fast text extraction'
        } else if (pdf.estimatedType === 'image-based' && result.method.includes('ocr') && result.text.length > 500) {
          expectedBehavior = '✅ Expected: OCR extraction'
        } else if (pdf.estimatedType === 'mixed' && result.method.includes('hybrid')) {
          expectedBehavior = '✅ Expected: Hybrid processing'
        } else {
          expectedBehavior = '❓ Unexpected behavior'
        }
        
        console.log(`   🎲 Behavior: ${expectedBehavior}`)
        
        results.push({
          name: pdf.name,
          type: pdf.estimatedType,
          success: result.success,
          method: result.method,
          duration: duration,
          characterCount: result.text.length,
          quality: extractionQuality,
          behavior: expectedBehavior,
          speed: processingSpeed,
          preview: preview
        })
        
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000
        console.log(`\n❌ FAILED for ${pdf.name}:`)
        console.log(`   ⏱️  Duration: ${duration.toFixed(2)}s`)
        console.log(`   📝 Error: ${error.message}`)
        
        results.push({
          name: pdf.name,
          type: pdf.estimatedType,
          success: false,
          method: 'error',
          duration: duration,
          characterCount: 0,
          quality: '❌ Processing failed',
          behavior: '❌ Error occurred',
          error: error.message
        })
      }
      
      console.log('─'.repeat(50))
    }
    
    const totalDuration = (Date.now() - totalStartTime) / 1000
    
    console.log(`\n🏁 PROCESSING COMPLETE`)
    console.log('=' .repeat(70))
    console.log(`⏱️  Total time: ${(totalDuration / 60).toFixed(2)} minutes`)
    console.log(`📊 Processed: ${results.length} PDFs`)
    
    // Summary by type
    const successful = results.filter(r => r.success).length
    const doclingUsed = results.filter(r => r.method && r.method.includes('docling')).length
    const ocrUsed = results.filter(r => r.method && r.method.includes('ocr')).length
    
    console.log(`\n📈 Success Rate: ${successful}/${results.length} (${(successful/results.length*100).toFixed(1)}%)`)
    console.log(`🔧 Docling Used: ${doclingUsed}/${results.length} (${(doclingUsed/results.length*100).toFixed(1)}%)`)
    console.log(`👁️  OCR Used: ${ocrUsed}/${results.length} (${(ocrUsed/results.length*100).toFixed(1)}%)`)
    
    // Detailed results
    console.log(`\n📋 DETAILED RESULTS:`)
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.name}`)
      console.log(`   Type: ${result.type}`)
      console.log(`   Success: ${result.success ? '✅' : '❌'}`)
      console.log(`   Method: ${result.method}`)
      console.log(`   Duration: ${result.duration.toFixed(2)}s`)
      console.log(`   Characters: ${result.characterCount}`)
      console.log(`   Quality: ${result.quality}`)
      console.log(`   Behavior: ${result.behavior}`)
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
    })
    
    // Save results
    const testResults = {
      timestamp: new Date().toISOString(),
      totalDuration: totalDuration,
      results: results,
      summary: {
        totalProcessed: results.length,
        successful: successful,
        doclingUsage: doclingUsed,
        ocrUsage: ocrUsed,
        successRate: (successful/results.length*100).toFixed(1) + '%'
      }
    }
    
    fs.writeFileSync('docling-test-results.json', JSON.stringify(testResults, null, 2))
    console.log(`\n💾 Test results saved to docling-test-results.json`)
    
    return results
    
  } catch (error) {
    console.error('❌ Processing failed:', error.message)
    return []
  }
}

processAllTextbooksWithDocling()