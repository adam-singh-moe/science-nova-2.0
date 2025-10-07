const fs = require('fs')
const path = require('path')

async function locateAllTextbooks() {
  try {
    console.log('🔍 Locating all Science Around Us PDF textbooks...')
    console.log('=' .repeat(60))
    
    // Common paths where PDFs might be located
    const searchPaths = [
      'C:\\Users\\adams\\Downloads',
      'C:\\Users\\adams\\Desktop',
      'C:\\Users\\adams\\Documents',
      'C:\\Users\\adams\\OneDrive\\Documents'
    ]
    
    const foundPDFs = []
    
    for (const searchPath of searchPaths) {
      try {
        if (!fs.existsSync(searchPath)) {
          console.log(`⏭️ Skipping ${searchPath} - directory not found`)
          continue
        }
        
        console.log(`\n📂 Searching in: ${searchPath}`)
        const files = fs.readdirSync(searchPath)
        
        const pdfFiles = files.filter(file => {
          return file.toLowerCase().endsWith('.pdf') && 
                 file.toLowerCase().includes('science around us')
        })
        
        for (const pdfFile of pdfFiles) {
          const fullPath = path.join(searchPath, pdfFile)
          const stats = fs.statSync(fullPath)
          const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
          
          foundPDFs.push({
            name: pdfFile,
            path: fullPath,
            size: stats.size,
            sizeMB: sizeMB,
            directory: searchPath
          })
          
          console.log(`   ✅ Found: ${pdfFile} (${sizeMB} MB)`)
        }
        
      } catch (error) {
        console.log(`   ❌ Error searching ${searchPath}: ${error.message}`)
      }
    }
    
    console.log(`\n📊 Summary of Found PDFs:`)
    console.log('=' .repeat(60))
    
    if (foundPDFs.length === 0) {
      console.log('❌ No Science Around Us PDFs found!')
      return []
    }
    
    // Sort by book number for logical processing order
    foundPDFs.sort((a, b) => {
      const getBookNumber = (name) => {
        const match = name.match(/book\s*(\d+)/i)
        return match ? parseInt(match[1]) : 999
      }
      return getBookNumber(a.name) - getBookNumber(b.name)
    })
    
    // Analyze file types
    const textBasedPDFs = []
    const imageBasedPDFs = []
    const unknownPDFs = []
    
    foundPDFs.forEach((pdf, index) => {
      console.log(`\n${index + 1}. ${pdf.name}`)
      console.log(`   📍 Location: ${pdf.directory}`)
      console.log(`   📏 Size: ${pdf.sizeMB} MB`)
      
      // Categorize based on size (rough heuristic)
      if (pdf.size < 6 * 1024 * 1024) { // < 6MB likely text-based
        textBasedPDFs.push(pdf)
        console.log(`   📖 Type: Text-based (likely extractable text)`)
      } else if (pdf.size > 12 * 1024 * 1024) { // > 12MB likely image-based
        imageBasedPDFs.push(pdf)
        console.log(`   🖼️  Type: Image-based (requires OCR)`)
      } else {
        unknownPDFs.push(pdf)
        console.log(`   ❓ Type: Mixed/Unknown (hybrid processing)`)
      }
    })
    
    console.log(`\n🎯 Processing Strategy:`)
    console.log(`   📖 Text-based PDFs: ${textBasedPDFs.length} (fast extraction)`)
    console.log(`   🖼️  Image-based PDFs: ${imageBasedPDFs.length} (OCR required)`)
    console.log(`   ❓ Mixed PDFs: ${unknownPDFs.length} (hybrid processing)`)
    console.log(`   📚 Total PDFs: ${foundPDFs.length}`)
    
    // Estimate processing time
    const estimatedTime = textBasedPDFs.length * 2 + // 2 min per text PDF
                         imageBasedPDFs.length * 8 + // 8 min per image PDF  
                         unknownPDFs.length * 5       // 5 min per mixed PDF
    
    console.log(`   ⏱️  Estimated processing time: ~${estimatedTime} minutes`)
    
    return foundPDFs
    
  } catch (error) {
    console.error('❌ Error locating textbooks:', error.message)
    return []
  }
}

// Export the results for use in processing
async function main() {
  const pdfs = await locateAllTextbooks()
  
  // Save the list for processing
  const pdfManifest = {
    timestamp: new Date().toISOString(),
    totalPDFs: pdfs.length,
    pdfs: pdfs.map(pdf => ({
      name: pdf.name,
      path: pdf.path,
      sizeMB: pdf.sizeMB,
      estimatedType: pdf.size < 6 * 1024 * 1024 ? 'text-based' : 
                     pdf.size > 12 * 1024 * 1024 ? 'image-based' : 'mixed'
    }))
  }
  
  fs.writeFileSync('pdf-manifest.json', JSON.stringify(pdfManifest, null, 2))
  console.log('\n💾 PDF manifest saved to pdf-manifest.json')
  
  return pdfs
}

main()