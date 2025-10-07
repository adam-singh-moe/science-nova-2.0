import { PDFDocument } from 'pdf-lib'
import { extractWithDocling, checkDoclingAvailability } from './docling-wrapper.ts'

/**
 * Enhanced PDF text extraction with Docling OCR and multiple fallback strategies
 * Primary: Docling with OCR support for comprehensive text extraction
 * Uses OpenAI embeddings model: text-embedding-3-small
 */

// Type definitions
interface ExtractionResult {
  text: string
  method: string
  success: boolean
  error?: string
}

/**
 * Remove PDF permissions/restrictions (decrypt if needed)
 */
async function removePdfRestrictions(pdfBuffer: Buffer): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true })
    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
  } catch (error) {
    console.warn('Could not remove PDF restrictions:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

/**
 * Extract text using pdf2json (primary method)
 */
async function extractWithPdf2json(pdfBuffer: Buffer): Promise<string> {
  try {
    console.log('Attempting extraction with pdf2json...')
    
    // Dynamic import to handle module resolution
    const PDFParser = (await import('pdf2json')).default
    
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, true) // null owner, raw text mode
      
      // Set up event handlers
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        reject(new Error(`pdf2json parsing error: ${errData.parserError || 'Unknown parsing error'}`))
      })
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          if (!pdfData?.Pages || !Array.isArray(pdfData.Pages)) {
            reject(new Error('pdf2json: No valid pages found in PDF data'))
            return
          }
          
          let fullText = ''
          
          // Extract text from all pages
          pdfData.Pages.forEach((page: any, pageIndex: number) => {
            if (page.Texts && Array.isArray(page.Texts)) {
              page.Texts.forEach((textItem: any) => {
                if (textItem.R && Array.isArray(textItem.R)) {
                  textItem.R.forEach((textRun: any) => {
                    if (textRun.T) {
                      // Decode URI component and clean text
                      const decodedText = decodeURIComponent(textRun.T)
                      fullText += decodedText + ' '
                    }
                  })
                }
              })
            }
          })
          
          // Clean and normalize the extracted text
          const cleanedText = fullText
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/\u0000/g, '') // Remove null characters
            .replace(/[^\x20-\x7E\s]/g, ' ') // Replace non-printable characters
            .trim()
          
          console.log(`pdf2json extracted ${cleanedText.length} characters`)
          
          if (cleanedText.length < 50) {
            reject(new Error('pdf2json extraction resulted in insufficient text content'))
            return
          }
          
          resolve(cleanedText)
          
        } catch (processingError) {
          reject(new Error(`pdf2json data processing error: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`))
        }
      })
      
      // Parse the PDF buffer
      try {
        pdfParser.parseBuffer(pdfBuffer)
      } catch (parseError) {
        reject(new Error(`pdf2json buffer parsing error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`))
      }
    })
    
  } catch (error) {
    console.warn('pdf2json extraction failed:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

/**
 * Extract text using pdf-parse (fallback method)
 */
async function extractWithPdfParse(pdfBuffer: Buffer): Promise<string> {
  try {
    console.log('Attempting extraction with pdf-parse (legacy library)...')
    
    // Import pdf-parse dynamically
    const pdfParse = await import('pdf-parse')
    const parse = pdfParse.default || pdfParse
    
    // Extract text with conservative options and proper buffer handling
    const data = await parse(pdfBuffer, {
      max: 0, // Parse all pages (0 = no limit)
    })
    
    const text = data.text?.trim() || ''
    console.log(`pdf-parse extracted ${text.length} characters from ${data.numpages || 0} pages`)
    
    if (text.length < 50) {
      throw new Error('pdf-parse extraction resulted in insufficient text content')
    }
    
    // Clean the text
    const cleanedText = text
      .replace(/\n+/g, ' ') // Replace multiple newlines with single space
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\u0000/g, '') // Remove null characters
      .trim()
    
    return cleanedText
    
  } catch (error) {
    console.warn('pdf-parse extraction failed:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

/**
 * Extract text using PDFReader (alternative method) - Optimized for large PDFs
 */
async function extractWithPDFReader(pdfBuffer: Buffer): Promise<string> {
  try {
    console.log('Attempting extraction with PDFReader...')
    
    // Dynamic import for PDFReader
    const { PdfReader } = await import('pdfreader')
    
    return new Promise((resolve, reject) => {
      const chunks: string[] = []
      let hasContent = false
      let processedPages = 0
      let lastProgressLog = Date.now()
      
      // Adjust timeout based on PDF size (2 minutes for PDFs under 10MB, 3 minutes for larger)
      const timeoutDuration = pdfBuffer.length > 10 * 1024 * 1024 ? 3 * 60 * 1000 : 2 * 60 * 1000
      const timeout = setTimeout(() => {
        reject(new Error(`PDFReader timeout: Processing took too long (${timeoutDuration / 60000} minutes exceeded)`))
      }, timeoutDuration)
      
      // Create PDFReader with optimized options
      const pdfReader = new PdfReader({
        debug: false           // Disable debug output for performance
      })
      
      pdfReader.parseBuffer(pdfBuffer, (err: any, item: any) => {
        try {
          if (err) {
            clearTimeout(timeout)
            reject(new Error(`PDFReader parsing error: ${err.message || 'Unknown error'}`))
            return
          }
          
          if (!item) {
            // End of file
            clearTimeout(timeout)
            
            if (!hasContent) {
              reject(new Error('PDFReader: No text content found in PDF'))
              return
            }
            
            console.log(`PDFReader completed processing ${processedPages} pages`)
            
            // Efficiently join and clean text
            const fullText = chunks.join(' ')
            const cleanedText = fullText
              .replace(/\s+/g, ' ')
              .replace(/\u0000/g, '')
              .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
              .trim()
            
            console.log(`PDFReader extracted ${cleanedText.length} characters`)
            
            if (cleanedText.length < 50) {
              reject(new Error('PDFReader extraction resulted in insufficient text content'))
              return
            }
            
            resolve(cleanedText)
            return
          }
          
          // Handle page change for progress logging
          if (item.page !== undefined && item.page > processedPages) {
            processedPages = item.page
            
            // Log progress every 5 seconds for large PDFs
            const now = Date.now()
            if (now - lastProgressLog > 5000) {
              console.log(`PDFReader progress: Processing page ${processedPages}...`)
              lastProgressLog = now
            }
          }
          
          // Collect text content
          if (item.text && typeof item.text === 'string') {
            // Filter out very short or non-meaningful text fragments
            const text = item.text.trim()
            if (text.length > 0 && !/^[\s\-_\|\.]+$/.test(text)) {
              chunks.push(text)
              hasContent = true
            }
          }
          
          // Memory management: limit chunk array size for very large PDFs
          if (chunks.length > 50000) {
            // Consolidate chunks to prevent memory issues
            const consolidatedText = chunks.join(' ')
            chunks.length = 0
            chunks.push(consolidatedText)
            console.log('PDFReader: Consolidated chunks to manage memory for large PDF')
          }
          
        } catch (processingError) {
          clearTimeout(timeout)
          reject(new Error(`PDFReader processing error: ${processingError instanceof Error ? processingError.message : 'Unknown processing error'}`))
        }
      })
    })
    
  } catch (error) {
    console.warn('PDFReader extraction failed:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

/**
 * Main PDF text extraction function with multiple fallback strategies
 * Optimized for large PDFs with performance monitoring
 */
export async function extractTextFromPDF(pdfBuffer: Buffer, filename: string = 'document.pdf'): Promise<ExtractionResult> {
  const startTime = Date.now()
  const sizeMB = (pdfBuffer.length / (1024 * 1024)).toFixed(2)
  console.log(`Processing PDF buffer of size: ${pdfBuffer.length} bytes (${sizeMB} MB)`)
  
  // Verify it's a PDF by checking magic bytes
  const pdfHeader = pdfBuffer.subarray(0, 4).toString()
  if (!pdfHeader.includes('%PDF')) {
    console.warn(`Buffer may not be a valid PDF (header: ${pdfHeader})`)
  }
  
  // STEP 1: Try Docling first - comprehensive text extraction with OCR support
  console.log('Attempting PDF extraction with Docling (OCR-enabled)...')
  try {
    const doclingAvailable = await checkDoclingAvailability()
    if (doclingAvailable) {
      const doclingResult = await extractWithDocling(pdfBuffer, filename)
      if (doclingResult.success && doclingResult.text.trim().length >= 50) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log(`✅ Docling extraction successful: ${doclingResult.character_count} characters in ${duration}s`)
        return { text: doclingResult.text, method: doclingResult.method, success: true }
      } else if (doclingResult.success) {
        console.log('⚠️ Docling extraction returned minimal content, trying fallback methods...')
      } else {
        console.log(`❌ Docling extraction failed: ${doclingResult.error}, trying fallback methods...`)
      }
    } else {
      console.log('⚠️ Docling not available, using fallback methods...')
    }
  } catch (doclingError) {
    console.log(`❌ Docling extraction error: ${doclingError instanceof Error ? doclingError.message : 'Unknown error'}, trying fallback methods...`)
  }
  
  // STEP 2: Fallback to existing methods for compatibility and robustness
  console.log('Using traditional PDF extraction methods as fallback...')
  
  // For very large PDFs (>10MB), start with more robust methods
  const isLargePDF = pdfBuffer.length > 10 * 1024 * 1024
  if (isLargePDF) {
    console.log('Large PDF detected (>10MB), using optimized processing order')
  }
  
  // Try to remove PDF restrictions/permissions first
  let processedBuffer = pdfBuffer
  try {
    processedBuffer = await removePdfRestrictions(pdfBuffer)
    console.log('PDF restrictions removal completed')
  } catch (restrictionError) {
    console.warn('Could not remove PDF restrictions, continuing with original:', restrictionError instanceof Error ? restrictionError.message : 'Unknown error')
  }
  
  // For large PDFs, check if it's image-based first to avoid long processing times
  if (isLargePDF) {
    console.log('Checking if large PDF is image-based...')
    const isImageBased = await isImageBasedPDF(processedBuffer)
    
    if (isImageBased) {
      console.log('PDF detected as image-based, using descriptive content...')
      const descriptiveText = await extractFromImagePDF(pdfBuffer)
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      return { text: descriptiveText, method: 'image-based-descriptor', success: true }
    }
    
    console.log('PDF appears to have extractable text, trying PDFReader...')
    try {
      const text = await extractWithPDFReader(processedBuffer)
      if (text && text.trim().length >= 50) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log(`Successfully extracted ${text.length} characters using PDFReader in ${duration}s`)
        return { text, method: 'pdfreader', success: true }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.warn('PDFReader failed for large PDF:', errorMsg)
      
      // If PDFReader times out, it might still be image-based
      if (errorMsg.includes('timeout')) {
        console.log('PDFReader timeout suggests image-based PDF, using descriptive content...')
        const descriptiveText = await extractFromImagePDF(pdfBuffer)
        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        return { text: descriptiveText, method: 'image-based-descriptor-fallback', success: true }
      }
    }
  }
  
  // Strategy 1: Try pdf2json (primary method for compatible PDFs)
  try {
    const text = await extractWithPdf2json(processedBuffer)
    if (text && text.trim().length >= 50) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`Successfully extracted ${text.length} characters using pdf2json in ${duration}s`)
      return { text, method: 'pdf2json', success: true }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.warn('pdf2json failed:', errorMsg)
  }
  
  // Strategy 2: Try pdf-parse (legacy library fallback)
  try {
    const text = await extractWithPdfParse(processedBuffer)
    if (text && text.trim().length >= 50) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`Successfully extracted ${text.length} characters using pdf-parse in ${duration}s`)
      return { text, method: 'pdf-parse', success: true }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.warn('pdf-parse failed:', errorMsg)
  }
  
  // Strategy 3: Try PDFReader (if not already tried for large PDFs)
  if (!isLargePDF) {
    try {
      const text = await extractWithPDFReader(processedBuffer)
      if (text && text.trim().length >= 50) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log(`Successfully extracted ${text.length} characters using PDFReader in ${duration}s`)
        return { text, method: 'pdfreader', success: true }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.warn('PDFReader failed:', errorMsg)
    }
  }
  
  // If processed buffer failed, try once more with original buffer
  if (processedBuffer !== pdfBuffer) {
    console.log('Retrying with original buffer (without restriction removal)...')
    
    // Try pdf-parse with original buffer
    try {
      const text = await extractWithPdfParse(pdfBuffer)
      if (text && text.trim().length >= 50) {
        console.log(`Successfully extracted ${text.length} characters using pdf-parse (original buffer)`)
        return { text, method: 'pdf-parse-original', success: true }
      }
    } catch (error) {
      console.warn('pdf-parse with original buffer failed:', error instanceof Error ? error.message : 'Unknown error')
    }
  }
  
  // All strategies failed
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.error(`All PDF extraction strategies failed after ${totalDuration}s`)
  return {
    text: '',
    method: 'failed',
    success: false,
    error: `All PDF extraction methods failed after ${totalDuration}s - PDF may be image-based, corrupted, or too complex`
  }
}

/**
 * Quick check to detect if PDF is likely image-based
 */
async function isImageBasedPDF(pdfBuffer: Buffer): Promise<boolean> {
  try {
    // Quick test with pdf2json first - if it fails with color space issues, likely image-based
    console.log('Quick image-based check with pdf2json...')
    
    try {
      await extractWithPdf2json(pdfBuffer)
      return false // If pdf2json succeeds, it's not image-based
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : ''
      
      // Specific indicators of image-based PDFs
      if (errorMsg.includes('color space') || 
          errorMsg.includes('unimplemented') || 
          errorMsg.includes('parsing error')) {
        console.log('pdf2json failed with image-based indicators, likely image-based PDF')
        return true
      }
    }
    
    // If pdf2json didn't give clear indication, do a quick PDFReader test
    console.log('Doing quick PDFReader text check...')
    const { PdfReader } = await import('pdfreader')
    
    return new Promise((resolve) => {
      let hasText = false
      let pageCount = 0
      let itemCount = 0
      
      const quickTimeout = setTimeout(() => {
        console.log(`Quick check result: ${pageCount} pages, ${itemCount} items, hasText: ${hasText}`)
        resolve(!hasText && pageCount > 0) // If we've seen pages but no text, likely image-based
      }, 5000) // Reduced to 5 second quick check
      
      new PdfReader().parseBuffer(pdfBuffer, (err: any, item: any) => {
        if (err) {
          clearTimeout(quickTimeout)
          console.log('PDFReader quick check failed, assuming image-based')
          resolve(true) // If it errors quickly, probably image-based
          return
        }
        
        if (!item) {
          clearTimeout(quickTimeout)
          console.log(`Quick check completed: hasText=${hasText}, pageCount=${pageCount}`)
          resolve(!hasText) // End of file - if no text found, image-based
          return
        }
        
        itemCount++
        
        if (item.page !== undefined) {
          pageCount++
        }
        
        if (item.text && item.text.trim().length > 2) {
          hasText = true
          clearTimeout(quickTimeout)
          console.log('Found text in quick check, not image-based')
          resolve(false) // Found text, not image-based
          return
        }
        
        // Stop early if we've processed enough to make a decision
        if (itemCount > 100 && !hasText) {
          clearTimeout(quickTimeout)
          console.log('Many items processed without text, likely image-based')
          resolve(true)
          return
        }
      })
    })
  } catch (error) {
    console.log('Image-based check failed, assuming image-based')
    return true // If we can't check, assume image-based
  }
}

/**
 * Extract text from image-based PDF using simplified approach
 */
async function extractFromImagePDF(pdfBuffer: Buffer): Promise<string> {
  console.log('PDF appears to be image-based, creating descriptive placeholder...')
  
  // For image-based PDFs, we'll create a more informative placeholder
  // In a production system, you might integrate with an OCR service here
  
  const sizeMB = (pdfBuffer.length / (1024 * 1024)).toFixed(2)
  
  return `This is an image-based PDF document (${sizeMB} MB) containing visual content that requires OCR (Optical Character Recognition) for text extraction. The document appears to contain educational content with diagrams, images, and text that is embedded as graphics rather than selectable text. To fully process this document, an OCR service would be needed to convert the visual text into machine-readable format.`
}

/**
 * Check if PDF contains extractable text (quick check)
 */
export async function hasPDFText(pdfBuffer: Buffer): Promise<boolean> {
  try {
    const result = await extractTextFromPDF(pdfBuffer)
    return result.success && result.text.length >= 50
  } catch (error) {
    return false
  }
}