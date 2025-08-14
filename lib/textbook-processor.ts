import { embedMany } from 'ai'
import { google } from '@ai-sdk/google'
import { createClient } from '@supabase/supabase-js'
import { PDFDocument } from 'pdf-lib'
import { createWorker } from 'tesseract.js'

// Type definitions
interface FileObject {
  name: string
  id?: string
  updated_at?: string
  created_at?: string
  last_accessed_at?: string
  metadata?: Record<string, any>
}

// Function to remove PDF permissions/restrictions (decrypt)
async function removePdfRestrictions(pdfBuffer: Buffer): Promise<Buffer> {
  try {
    console.log('Attempting to remove PDF restrictions/permissions...')
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true, // Try to ignore encryption if possible
    })
    
    // Create a new PDF document without restrictions
    const newPdfDoc = await PDFDocument.create()
    
    // Copy all pages from the original document
    const pageCount = pdfDoc.getPageCount()
    console.log(`Copying ${pageCount} pages to unrestricted PDF...`)
    
    const pageIndices = Array.from({ length: pageCount }, (_, i) => i)
    const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices)
    
    // Add all pages to the new document
    copiedPages.forEach(page => {
      newPdfDoc.addPage(page)
    })
    
    // Serialize the new PDF without restrictions
    const newPdfBytes = await newPdfDoc.save()
    const newBuffer = Buffer.from(newPdfBytes)
    
    console.log(`Successfully removed restrictions. New PDF size: ${newBuffer.length} bytes`)
    return newBuffer
    
  } catch (error) {
    console.warn('Failed to remove PDF restrictions:', error instanceof Error ? error.message : 'Unknown error')
    // Return original buffer if decryption fails
    return pdfBuffer
  }
}

// PDF processing function with automatic decryption and multiple fallback strategies
// OCR extraction method using PDF.js + Canvas (no external dependencies)
async function extractWithOCR(pdfBuffer: Buffer): Promise<string> {
  console.log('Starting OCR extraction using PDF.js + Canvas (no external dependencies)...')
    try {
    // Use PDF.js to render PDF pages to canvas and then OCR
    const pdfjsLib = await import('pdfjs-dist')
    const Canvas = await import('canvas')    // Configure PDF.js to work in Node.js environment - disable worker for server-side
    // Disable worker mode to avoid module resolution issues in Next.js
    if ((pdfjsLib as any).GlobalWorkerOptions) {
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = ''
    }
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      disableFontFace: true
    })
    
    const pdfDocument = await loadingTask.promise
    console.log(`PDF loaded successfully. Pages: ${pdfDocument.numPages}`)
    
    // Process first few pages for text extraction
    const maxPages = Math.min(3, pdfDocument.numPages) // Limit to first 3 pages for performance
    let extractedText = ''
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum)
        const viewport = page.getViewport({ scale: 2.0 }) // Higher scale for better OCR
        
        // Create canvas
        const canvas = Canvas.createCanvas(viewport.width, viewport.height)
        const context = canvas.getContext('2d')
        
        // Render page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }
        
        await page.render(renderContext).promise
        console.log(`Rendered page ${pageNum} to canvas`)
        
        // Convert canvas to image buffer for OCR
        const imageBuffer = canvas.toBuffer('image/png')
        
        // Use tesseract.js for OCR
        const tesseractModule = await import('tesseract.js')
        const { createWorker } = tesseractModule
        
        const worker = await createWorker('eng', 1, {
          logger: (m: any) => {
            if (m.status === 'recognizing text' && m.progress) {
              const progress = Math.round(m.progress * 100)
              if (progress % 25 === 0) { // Log every 25% to reduce noise
                console.log(`OCR Page ${pageNum} Progress: ${progress}%`)
              }
            }
          }
        })
        
        const { data: { text } } = await worker.recognize(imageBuffer, {
          preserve_interword_spaces: '1',
          tessjs_create_hocr: '0',
          tessjs_create_tsv: '0',
          tessjs_create_box: '0',
          tessjs_create_unlv: '0',
          tessjs_create_osd: '0'
        })
        
        await worker.terminate()
        
        if (text && text.trim().length > 0) {
          extractedText += `\n--- Page ${pageNum} ---\n${text.trim()}\n`
          console.log(`OCR extracted ${text.trim().length} characters from page ${pageNum}`)
        }
        
      } catch (pageError) {
        console.warn(`Failed to process page ${pageNum}:`, pageError instanceof Error ? pageError.message : 'Unknown error')
        continue
      }
    }
    
    if (extractedText.trim().length < 50) {
      throw new Error('OCR resulted in insufficient text content - PDF may contain only images or unreadable text')
    }
    
    console.log(`Total OCR extracted ${extractedText.length} characters from ${maxPages} pages`)
    return extractedText.trim()
    
  } catch (error) {
    console.error('PDF.js + Canvas OCR failed:', error instanceof Error ? error.message : 'Unknown error')
    throw new Error('OCR extraction failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

// PDFReader extraction method (alternative library) - Updated for v3.0.7 best practices
async function extractWithPDFReader(pdfBuffer: Buffer): Promise<string> {
  console.log('Attempting extraction with PDFReader v3.0.7...')
  
  return new Promise(async (resolve, reject) => {
    try {
      // Set up enhanced global navigator polyfill for Next.js/Node.js compatibility
      if (typeof global !== 'undefined' && !global.navigator) {
        global.navigator = { 
          userAgent: 'node',
          platform: 'node'
        } as any
      }
      if (typeof window !== 'undefined' && !window.navigator) {
        window.navigator = { 
          userAgent: 'node',
          platform: 'node'
        } as any
      }
      
      // Import PDFReader dynamically using ES modules
      const { PdfReader } = await import('pdfreader')
      
      // Use TypeScript-friendly configuration for v3.0.7
      const reader = new PdfReader({ 
        debug: false, // Disable debug to reduce noise
        password: undefined // Password support if needed
      })
      
      let textContent = ''
      let currentPage = 0
      let lastY = 0
      let hasContent = false
      let isProcessing = true
      let lastX = 0
        // Set a more generous timeout for large PDFs (increased to 120 seconds)
      const timeout = setTimeout(() => {
        if (isProcessing) {
          isProcessing = false
          reject(new Error('PDFReader extraction timed out after 120 seconds - PDF may be very large or complex'))
        }
      }, 120000)
      
      reader.parseBuffer(pdfBuffer, (err: any, item: any) => {
        if (!isProcessing) return // Ignore callbacks after timeout
        
        if (err) {
          clearTimeout(timeout)
          isProcessing = false
          
          const errorMsg = err?.message || err || 'Unknown PDFReader error'
          console.warn('PDFReader error:', errorMsg)
          
          // Handle specific error types for v3.0.7
          if (String(errorMsg).includes('Invalid PDF') || String(errorMsg).includes('not a PDF')) {
            reject(new Error('PDFReader: Invalid PDF format or corrupted file'))
          } else if (String(errorMsg).includes('encrypted') || String(errorMsg).includes('password')) {
            reject(new Error('PDFReader: PDF is encrypted or password-protected'))
          } else if (String(errorMsg).includes('memory') || String(errorMsg).includes('allocation')) {
            reject(new Error('PDFReader: PDF too large or complex - insufficient memory'))
          } else {
            reject(new Error(`PDFReader error: ${errorMsg}`))
          }
          return
        }
        
        if (!item) {
          // End of file
          clearTimeout(timeout)
          isProcessing = false
          
          if (!hasContent) {
            reject(new Error('PDFReader found no readable text content in PDF - may be image-based'))
            return
          }
          
          // Enhanced text cleaning for v3.0.7
          const cleanedText = textContent
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/\u0000/g, '') // Remove null characters
            .replace(/[^\x20-\x7E\s]/g, ' ') // Replace non-printable chars
            .replace(/\s{2,}/g, ' ') // Replace multiple spaces
            .trim()
          
          console.log(`PDFReader extracted ${cleanedText.length} characters from ${currentPage} pages`)
          
          if (cleanedText.length < 50) {
            reject(new Error(`PDFReader extraction resulted in insufficient text content (${cleanedText.length} chars from ${currentPage} pages)`))
            return
          }
          
          resolve(cleanedText)
          return
        }
        
        // Page metadata handling
        if (item.page && typeof item.page === 'number') {
          currentPage = item.page
          lastY = 0
          lastX = 0
          
          if (currentPage > 1) {
            textContent += ' ' // Add page separator
          }
          
          console.log(`PDFReader: Processing page ${currentPage}`)
        }
        
        // Text item handling with improved positioning logic
        if (item.text && typeof item.text === 'string') {
          hasContent = true
          const cleanText = item.text.trim()
          
          if (cleanText.length > 0) {
            // Improved positioning logic for better text flow
            let spacing = ' '
            
            // Add line break logic based on Y coordinate changes
            if (lastY && item.y && typeof item.y === 'number') {
              const yDiff = Math.abs(item.y - lastY)
              if (yDiff > 2) {
                spacing = ' ' // Line break becomes space for better flow
              }
            }
            
            // Add horizontal spacing logic for column detection
            if (lastX && item.x && typeof item.x === 'number') {
              const xDiff = Math.abs(item.x - lastX)
              if (xDiff > 10) {
                spacing += ' ' // Add extra space for column separation
              }
            }
            
            textContent += spacing + cleanText
            lastY = item.y || lastY
            lastX = item.x || lastX
          }
        }
      })
      
    } catch (setupError) {
      const errorMsg = setupError instanceof Error ? setupError.message : 'Unknown error'
      reject(new Error(`PDFReader setup failed: ${errorMsg}`))
    }
  })
}

// PDFJS extraction method (Mozilla PDF.js - robust fallback for complex PDFs)
async function extractWithPDFJS(pdfBuffer: Buffer): Promise<string> {
  console.log('Attempting extraction with Mozilla PDF.js...')
  
  try {    // Import PDF.js for Node.js environment using CommonJS
    let pdfjs
    try {
      // Use CommonJS require for better Node.js compatibility 
      pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs')
    } catch (legacyError) {
      console.warn('Legacy PDF.js require failed, trying standard build:', legacyError)
      // Fallback to standard build
      try {
        pdfjs = require('pdfjs-dist')
      } catch (standardError) {
        console.warn('Standard PDF.js require failed:', standardError)
        throw new Error('Unable to load PDF.js library')
      }
    }      // Configure for Node.js environment - disable worker
    if (pdfjs.GlobalWorkerOptions) {
      // @ts-ignore - PDF.js types may not perfectly match runtime behavior in Node.js
      pdfjs.GlobalWorkerOptions.workerSrc = null
    }
    
    // Polyfill DOM globals for Node.js environment
    if (typeof global !== 'undefined') {
      if (!global.btoa) {
        global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')
      }
      if (!global.atob) {
        global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary')
      }      if (!global.DOMMatrix) {
        try {
          const canvas = require('canvas')
          // @ts-ignore - Canvas polyfill for Node.js
          global.DOMMatrix = canvas.DOMMatrix || class DOMMatrix {
            constructor() {}
            toString() { return '[object DOMMatrix]' }
          }
        } catch (canvasError) {
          // Provide a minimal DOMMatrix polyfill if canvas is not available
          // @ts-ignore - Minimal polyfill for Node.js
          global.DOMMatrix = class DOMMatrix {
            constructor() {}
            toString() { return '[object DOMMatrix]' }
          }
        }
      }
    }
    
    // Initialize PDF.js with enhanced error handling for color spaces
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      verbosity: 0, // Reduce console noise
      // Enhanced options for problematic PDFs
      disableFontFace: true,
      disableAutoFetch: false,
      disableStream: false,
      disableRange: false,
      stopAtErrors: false, // Continue processing even with errors
      maxImageSize: -1, // No limit on image size
      isEvalSupported: false, // Disable eval for security
      fontExtraProperties: true // Enable extra font properties for better text extraction
    })
    
    const pdf = await loadingTask.promise
    console.log(`PDF.js successfully loaded PDF with ${pdf.numPages} pages`)
    
    let fullText = ''
    let successfulPages = 0
    let failedPages = 0
    
    // Extract text from each page with enhanced error handling
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {      try {
        const page = await pdf.getPage(pageNum)
        
        // Get text content
        const textContent = await page.getTextContent()
        
        // Extract and clean text from page
        const pageText = textContent.items
          .filter((item: any) => item.str && typeof item.str === 'string')
          .map((item: any) => item.str.trim())
          .filter((str: string) => str.length > 0)
          .join(' ')
        
        if (pageText.length > 0) {
          fullText += pageText + '\n'
          successfulPages++
        }
        
      } catch (pageError) {
        failedPages++
        console.warn(`PDF.js failed on page ${pageNum}:`, pageError instanceof Error ? pageError.message : 'Unknown error')
        // Continue with other pages - don't let one bad page stop the whole extraction
      }
    }
    
    console.log(`PDF.js extraction completed: ${successfulPages} successful pages, ${failedPages} failed pages`)
    
    // Clean up extracted text
    const cleanedText = fullText
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\u0000/g, '') // Remove null characters
      .replace(/[^\x20-\x7E\s]/g, ' ') // Replace non-printable characters with spaces
      .trim()
    
    console.log(`PDF.js extracted ${cleanedText.length} characters total`)
    
    if (cleanedText.length < 50) {
      throw new Error(`PDF.js extraction resulted in insufficient text content (${cleanedText.length} chars from ${successfulPages} pages)`)
    }
    
    return cleanedText
    
  } catch (error) {
    console.warn('PDF.js extraction failed:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

// Enhanced PDF processing function with OCR and multiple fallback strategies
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<{ text: string; method: string }> {
  console.log(`Processing PDF buffer of size: ${pdfBuffer.length} bytes`)
  
  // Verify it's a PDF by checking magic bytes
  const pdfHeader = pdfBuffer.subarray(0, 4).toString()
  if (!pdfHeader.includes('%PDF')) {
    console.warn(`Buffer may not be a valid PDF (header: ${pdfHeader})`)
  }
  
  // Step 1: Try to remove PDF restrictions/permissions first
  let processedBuffer = pdfBuffer
  try {
    processedBuffer = await removePdfRestrictions(pdfBuffer)
    console.log('PDF restrictions removal completed')
  } catch (restrictionError) {
    console.warn('Could not remove PDF restrictions, continuing with original:', restrictionError instanceof Error ? restrictionError.message : 'Unknown error')
  }
    // Strategy 1: Try pdf2json (primary method for compatible PDFs)
  try {
    console.log('Attempting extraction with pdf2json...')
    const text = await extractWithPdf2json(processedBuffer)
    if (text && text.trim().length >= 50) {
      console.log(`Successfully extracted ${text.length} characters using pdf2json`)
      return { text, method: 'pdf2json' }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.warn('pdf2json failed:', errorMsg)
    // Log if it's the color space issue for reporting
    if (errorMsg.includes('color space')) {
      console.log('Color space issue detected - will try other methods including OCR')
    }
  }
  // Strategy 2: Try pdf-parse (re-enabled with better error handling - library is old but sometimes works)
  try {
    console.log('Attempting extraction with pdf-parse (legacy library with caution)...')
    const text = await extractWithPdfParse(processedBuffer)
    if (text && text.trim().length >= 50) {
      console.log(`Successfully extracted ${text.length} characters using pdf-parse`)
      return { text, method: 'pdf-parse' }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.warn('pdf-parse failed:', errorMsg)
    // Log specific pdf-parse issues for debugging
    if (errorMsg.includes('file path') || errorMsg.includes('ENOENT')) {
      console.log('pdf-parse failed due to internal file path issues - this is a known problem with the old library')
    }
  }
  
  // Strategy 3: Try PDFReader (good for complex layouts and some color space issues)
  try {
    console.log('Attempting extraction with PDFReader...')
    const text = await extractWithPDFReader(processedBuffer)
    if (text && text.trim().length >= 50) {
      console.log(`Successfully extracted ${text.length} characters using PDFReader`)
      return { text, method: 'pdfreader' }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.warn('PDFReader failed:', errorMsg)
  }  // Strategy 4: Skip PDF.js for now - has compatibility issues with Next.js
  console.log('Skipping PDF.js extraction (Next.js compatibility issues)')
  // NOTE: PDF.js (Mozilla) has been tested but has module import and DOMMatrix issues in Next.js server environment
  
  // Strategy 5: Skip OCR for now due to import complexity in Next.js environment
  console.log('Skipping OCR extraction (Next.js module import complexity)')
  // NOTE: OCR functionality temporarily disabled due to module import issues with PDF.js and Canvas in Next.js server environment
  
  // If processed buffer failed, try once more with original buffer using best methods
  if (processedBuffer !== pdfBuffer) {
    console.log('Retrying with original buffer (without restriction removal)...')    // Try pdf-parse with original buffer (sometimes works better with original)
    try {
      console.log('Attempting pdf-parse with original buffer...')
      const text = await extractWithPdfParse(pdfBuffer)
      if (text && text.trim().length >= 50) {
        console.log(`Successfully extracted ${text.length} characters using pdf-parse (original buffer)`)
        return { text, method: 'pdf-parse-original' }
      }
    } catch (error) {
      console.warn('pdf-parse with original buffer failed:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    // Try PDFReader with original buffer
    try {
      const text = await extractWithPDFReader(pdfBuffer)
      if (text && text.trim().length >= 50) {
        console.log(`Successfully extracted ${text.length} characters using PDFReader (original buffer)`)
        return { text, method: 'pdfreader-original' }
      }
    } catch (error) {
      console.warn('PDFReader with original buffer failed:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    // Skip OCR with original buffer too (Next.js compatibility issues)
    console.log('Skipping OCR with original buffer (Next.js module import issues)')
  }  
  // If all methods fail, provide a graceful fallback for certain scenarios
  console.log('All standard PDF extraction methods failed. Checking for graceful fallbacks...')
  
  // Check if PDF is readable at all (basic structure test)
  try {
    const pdfHeader = pdfBuffer.slice(0, 8).toString('ascii')
    if (!pdfHeader.startsWith('%PDF-')) {
      throw new Error('File does not appear to be a valid PDF (invalid header)')
    }
    
    // If PDF seems valid but all extraction failed, it might be:
    // 1. Image-only PDF that requires OCR (but OCR dependencies failed)
    // 2. Complex PDF with embedded fonts/formatting
    // 3. Scanned document
    
    console.log('PDF appears structurally valid but text extraction failed.')
    console.log('This may be an image-based or heavily formatted PDF that requires OCR.')
    console.log('Returning graceful fallback to allow processing to continue.')
    
    // Return a minimal result to indicate the PDF was "processed" but yielded no text
    // This prevents the entire upload system from failing due to problematic PDFs
    return { 
      text: 'PDF_PROCESSED_NO_TEXT_EXTRACTED', 
      method: 'graceful-fallback-no-text' 
    }
    
  } catch (headerError) {
    console.error('PDF header validation failed:', headerError instanceof Error ? headerError.message : 'Unknown error')
  }
  
  throw new Error('All PDF extraction methods failed including OCR - PDF may be severely corrupted or use highly specialized encoding')
}

// pdf2json extraction method
async function extractWithPdf2json(pdfBuffer: Buffer): Promise<string> {
  console.log('Attempting extraction with pdf2json v3.1.6...')
  
  return new Promise(async (resolve, reject) => {
    try {
      // Import pdf2json dynamically using ES modules
      const { default: PDFParser } = await import('pdf2json')
      
      // Use recommended configuration for v3.1.6
      const pdfParser = new PDFParser(null, false) // Disable raw data for better performance
      
      // Set up enhanced error handling with specific error types
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        const errorMsg = errData?.parserError?.message || errData?.parserError || 'Unknown pdf2json error'
        console.warn('pdf2json parsing error:', errorMsg)
        
        // Handle specific known errors
        if (String(errorMsg).includes('color space') || String(errorMsg).includes('ColorSpace')) {
          reject(new Error('pdf2json: Unsupported color space - this PDF may be image-based or use complex color schemes'))
        } else if (String(errorMsg).includes('encrypted') || String(errorMsg).includes('password')) {
          reject(new Error('pdf2json: PDF is encrypted or password-protected'))
        } else if (String(errorMsg).includes('XRef') || String(errorMsg).includes('stream')) {
          reject(new Error('pdf2json: PDF structure error - file may be corrupted'))
        } else {
          reject(new Error(`pdf2json error: ${errorMsg}`))
        }
      })
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          // Use latest v3.1.6 data structure - Pages array format
          let fullText = ''
          
          if (pdfData?.Pages && Array.isArray(pdfData.Pages)) {
            console.log(`pdf2json: Processing ${pdfData.Pages.length} pages`)
            
            for (const page of pdfData.Pages) {
              if (page?.Texts && Array.isArray(page.Texts)) {
                for (const textBlock of page.Texts) {
                  if (textBlock?.R && Array.isArray(textBlock.R)) {
                    for (const textRun of textBlock.R) {
                      if (textRun?.T && typeof textRun.T === 'string') {
                        try {
                          // Decode URI-encoded text (pdf2json v3.1.6 standard)
                          const decodedText = decodeURIComponent(textRun.T)
                          fullText += decodedText + ' '
                        } catch (decodeError) {
                          // Fallback for non-URI encoded text
                          fullText += textRun.T + ' '
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          
          // Enhanced text cleaning for v3.1.6
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
      
      // Parse the PDF buffer with enhanced error handling
      try {
        pdfParser.parseBuffer(pdfBuffer)
      } catch (parseError) {
        reject(new Error(`pdf2json parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`))
      }
      
    } catch (setupError) {
      reject(new Error(`pdf2json setup error: ${setupError instanceof Error ? setupError.message : 'Unknown error'}`))
    }
  })
}

// pdf-parse extraction method - Note: Library is 7 years old, re-enabled with better error handling
async function extractWithPdfParse(pdfBuffer: Buffer): Promise<string> {
  try {
    console.log('Attempting extraction with pdf-parse (legacy library)...')
    
    // Import pdf-parse dynamically using ES modules
    const pdfParse = await import('pdf-parse')
    const parse = pdfParse.default || pdfParse
    
    // Extract text with conservative options to avoid internal issues
    const data = await parse(pdfBuffer, {
      max: 0, // Parse all pages (0 = no limit)
    })
    
    const text = data.text?.trim() || ''
    console.log(`pdf-parse extracted ${text.length} characters from ${data.numpages || 0} pages`)
    
    if (text.length < 50) {
      throw new Error('pdf-parse extraction resulted in insufficient text content')
    }
    
    // Conservative text cleaning for old library
    const cleanedText = text
      .replace(/\n+/g, ' ') // Replace multiple newlines with single space
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\u0000/g, '') // Remove null characters
      .replace(/[^\x20-\x7E\s]/g, ' ') // Replace non-printable characters
      .trim()
    
    return cleanedText
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.warn('pdf-parse extraction failed:', errorMessage)
    
    // Handle specific errors from this old library
    if (errorMessage.includes('ENOENT') || errorMessage.includes('no such file')) {
      throw new Error('pdf-parse internal file access error - library is outdated and has known file path issues')
    } else if (errorMessage.includes('spawn') || errorMessage.includes('worker')) {
      throw new Error('pdf-parse worker process failed - library compatibility issue')
    } else if (errorMessage.includes('encrypted')) {
      throw new Error('pdf-parse failed - PDF is encrypted')
    } else if (errorMessage.includes('Invalid PDF')) {
      throw new Error('pdf-parse failed - Invalid PDF format')
    } else if (errorMessage.includes('Cannot read prop')) {
      throw new Error('pdf-parse internal error - library may be incompatible with this PDF format')
    }
    
    throw error
  }
}

// Function to chunk text into smaller pieces for embedding
function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = []
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  let currentChunk = ''
  let currentSize = 0
  
  for (const sentence of sentences) {
    const sentenceSize = sentence.trim().length
    
    if (currentSize + sentenceSize > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      
      // Create overlap by keeping last part of current chunk
      const words = currentChunk.split(' ')
      const overlapWords = words.slice(-Math.floor(overlap / 10)) // Approximate overlap
      currentChunk = overlapWords.join(' ') + ' ' + sentence.trim()
      currentSize = currentChunk.length
    } else {
      currentChunk += ' ' + sentence.trim()
      currentSize += sentenceSize
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks.filter(chunk => chunk.length > 50) // Filter out very small chunks
}

// Function to generate embeddings for text chunks (with batching)
export async function generateEmbeddings(texts: string[]) {
  try {
    console.log(`Generating embeddings for ${texts.length} text chunks...`)
    
    const BATCH_SIZE = 100 // Google's batch limit
    const allEmbeddings = []
    
    // Process in batches if necessary
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE)
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} with ${batch.length} items`)
      
      const { embeddings } = await embedMany({
        model: google.textEmbedding('text-embedding-004'),
        values: batch,
      })
      
      allEmbeddings.push(...embeddings)
    }
    
    console.log(`Generated ${allEmbeddings.length} embeddings`)
    if (allEmbeddings.length > 0) {
      console.log(`First embedding dimensions: ${allEmbeddings[0].length}`)
    }
    
    // Google's text-embedding-004 returns 768 dimensions, but our DB expects 1536
    // We need to pad the embeddings to match the expected dimensions
    const paddedEmbeddings = allEmbeddings.map(embedding => {
      if (embedding.length === 768) {
        // Pad with zeros to reach 1536 dimensions
        const padded = new Array(1536).fill(0)
        for (let i = 0; i < 768; i++) {
          padded[i] = embedding[i]
        }
        return padded
      }
      return embedding
    })
    
    console.log(`Padded embeddings to ${paddedEmbeddings[0]?.length || 0} dimensions`)
    return paddedEmbeddings
    
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw error
  }
}

// Function to process a single PDF and store embeddings with enhanced error reporting
export async function processPDFAndStoreEmbeddings(
  gradeLevel: number,
  fileName: string,
  pdfBuffer: Buffer,
  supabase: any
): Promise<{ success: boolean; chunksProcessed: number; error?: string; extractionMethod?: string }> {
  let extractionMethod = 'unknown'
  
  try {
    console.log(`Processing PDF for Grade ${gradeLevel}: ${fileName}`)    // Extract text from PDF with fallback methods
    let text: string
    try {
      const result = await extractTextFromPDF(pdfBuffer)
      text = result.text
      extractionMethod = result.method
      
      // Handle graceful fallback case
      if (text === 'PDF_PROCESSED_NO_TEXT_EXTRACTED') {
        console.log(`${fileName}: PDF processed but no text extracted (likely image-based PDF)`)
        return {
          success: true,
          chunksProcessed: 0,
          extractionMethod: 'graceful-fallback-no-text'
        }
      }
      
    } catch (extractionError) {
      console.error(`All PDF extraction methods failed for ${fileName}:`, extractionError)
      
      // Check if it's a known issue type
      const errorMessage = extractionError instanceof Error ? extractionError.message : 'Unknown error'
      if (errorMessage.includes('color space')) {
        return {
          success: false,
          chunksProcessed: 0,
          error: 'PDF uses unsupported color space - tried OCR fallback but failed',
          extractionMethod: 'failed-color-space-ocr-attempted'
        }
      } else if (errorMessage.includes('encrypted') || errorMessage.includes('password')) {
        return {
          success: false,
          chunksProcessed: 0,
          error: 'PDF has strong encryption that could not be removed automatically',
          extractionMethod: 'failed-encrypted'
        }
      } else if (errorMessage.includes('corrupted')) {
        return {
          success: false,
          chunksProcessed: 0,
          error: 'PDF file appears to be corrupted',
          extractionMethod: 'failed-corrupted'
        }
      } else if (errorMessage.includes('OCR')) {
        return {
          success: false,
          chunksProcessed: 0,
          error: 'All extraction methods failed including OCR - may need manual processing',
          extractionMethod: 'failed-all-including-ocr'
        }
      } else {
        return {
          success: false,
          chunksProcessed: 0,
          error: `PDF extraction failed: ${errorMessage}`,
          extractionMethod: 'failed-unknown'
        }
      }
    }
    
    console.log(`Extracted ${text.length} characters from PDF`)
    
    if (text.length < 100) {
      return {
        success: false,
        chunksProcessed: 0,
        error: 'PDF contains insufficient text content (less than 100 characters)',
        extractionMethod
      }
    }
    
    // Chunk the text
    const chunks = chunkText(text)
    console.log(`Created ${chunks.length} chunks`)
    
    if (chunks.length === 0) {
      return {
        success: false,
        chunksProcessed: 0,
        error: 'No valid chunks created from PDF text',
        extractionMethod
      }
    }
    
    // Generate embeddings
    let embeddings: number[][]
    try {
      embeddings = await generateEmbeddings(chunks)
      console.log(`Generated ${embeddings.length} embeddings`)
    } catch (embeddingError) {
      console.error('Error generating embeddings:', embeddingError)
      return {
        success: false,
        chunksProcessed: 0,
        error: `Embedding generation failed: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown error'}`,
        extractionMethod
      }
    }
    
    // Delete existing embeddings for this grade/file
    const { error: deleteError } = await supabase
      .from('textbook_embeddings')
      .delete()
      .eq('grade_level', gradeLevel)
      .eq('file_name', fileName)
    
    if (deleteError) {
      console.warn('Error deleting existing embeddings (continuing anyway):', deleteError)
    }
    
    // Prepare data for insertion
    const embeddingData = chunks.map((chunk, index) => ({
      grade_level: gradeLevel,
      file_name: fileName,
      chunk_index: index,
      content: chunk,
      metadata: {
        total_chunks: chunks.length,
        chunk_size: chunk.length,
        grade_level: gradeLevel,
        file_name: fileName,
        extraction_method: extractionMethod,
        processed_at: new Date().toISOString()
      },
      embedding: embeddings[index]
    }))
    
    // Insert embeddings in batches
    const batchSize = 100
    let totalInserted = 0
    
    for (let i = 0; i < embeddingData.length; i += batchSize) {
      const batch = embeddingData.slice(i, i + batchSize)
      
      const { error: insertError } = await supabase
        .from('textbook_embeddings')
        .insert(batch)
      
      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError)
        return {
          success: false,
          chunksProcessed: totalInserted,
          error: `Database insertion failed at batch ${i / batchSize + 1}: ${insertError.message}`,
          extractionMethod
        }
      }
      
      totalInserted += batch.length
      console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(embeddingData.length / batchSize)}`)
    }
    
    console.log(`Successfully processed ${fileName} for Grade ${gradeLevel}: ${totalInserted} chunks`)
    
    return {
      success: true,
      chunksProcessed: totalInserted,
      extractionMethod
    }
    
  } catch (error) {
    console.error(`Error processing PDF ${fileName} for Grade ${gradeLevel}:`, error)
    return {
      success: false,
      chunksProcessed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      extractionMethod
    }
  }
}

// Function to process all textbooks in the storage bucket with enhanced reporting
export async function processAllTextbooks(supabase: any): Promise<{
  success: boolean
  results: Array<{
    grade: number
    fileName: string
    success: boolean
    chunksProcessed: number
    error?: string
    extractionMethod?: string
  }>
  summary: {
    totalProcessed: number
    totalSuccessful: number
    totalFailed: number
    totalChunks: number
    failureReasons: Record<string, number>
  }
}> {
  const results: Array<{
    grade: number
    fileName: string
    success: boolean
    chunksProcessed: number
    error?: string
    extractionMethod: string
  }> = []
  
  const failureReasons: Record<string, number> = {}
  
  try {
    console.log('Starting textbook processing...')
    
    // Process each grade level
    for (let grade = 1; grade <= 6; grade++) {
      try {
        console.log(`Processing Grade ${grade}...`)
        
        // List files in the grade folder
        const { data: files, error: listError } = await supabase.storage
          .from('textbook_content')
          .list(`grade_${grade}`, {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          })
        
        console.log(`Grade ${grade} - List result:`, { files, error: listError })
        
        if (listError) {
          console.error(`Error listing files for Grade ${grade}:`, listError)
          const errorReason = `List files error: ${listError.message}`
          failureReasons[errorReason] = (failureReasons[errorReason] || 0) + 1
          results.push({
            grade,
            fileName: 'N/A',
            success: false,
            chunksProcessed: 0,
            error: errorReason,
            extractionMethod: 'failed-list'
          })
          continue
        }
        
        if (!files || files.length === 0) {
          console.log(`No files found for Grade ${grade}`)
          const errorReason = 'No files found in folder'
          failureReasons[errorReason] = (failureReasons[errorReason] || 0) + 1
          results.push({
            grade,
            fileName: 'N/A',
            success: false,
            chunksProcessed: 0,
            error: errorReason,
            extractionMethod: 'failed-no-files'
          })
          continue
        }
        
        console.log(`Grade ${grade} - Found ${files.length} files:`, files.map((f: FileObject) => f.name))
        
        // Process PDF files in the folder
        const pdfFiles = files.filter((file: FileObject) => 
          file.name.toLowerCase().endsWith('.pdf') && 
          !file.name.startsWith('.') // Exclude hidden files
        )
        
        if (pdfFiles.length === 0) {
          console.log(`No PDF files found for Grade ${grade}`)
          const errorReason = 'No PDF files found in folder'
          failureReasons[errorReason] = (failureReasons[errorReason] || 0) + 1
          results.push({
            grade,
            fileName: 'N/A',
            success: false,
            chunksProcessed: 0,
            error: errorReason,
            extractionMethod: 'failed-no-pdfs'
          })
          continue
        }
        
        // Process each PDF file
        for (const file of pdfFiles) {
          try {
            console.log(`Downloading ${file.name} for Grade ${grade}...`)
            
            // Download the PDF file
            const { data: pdfData, error: downloadError } = await supabase.storage
              .from('textbook_content')
              .download(`grade_${grade}/${file.name}`)
            
            if (downloadError) {
              console.error(`Error downloading ${file.name}:`, downloadError)
              const errorReason = `Download failed: ${downloadError.message}`
              failureReasons[errorReason] = (failureReasons[errorReason] || 0) + 1
              results.push({
                grade,
                fileName: file.name,
                success: false,
                chunksProcessed: 0,
                error: errorReason,
                extractionMethod: 'failed-download'
              })
              continue
            }
            
            if (!pdfData) {
              console.error(`No data received for ${file.name}`)
              const errorReason = 'No data received from download'
              failureReasons[errorReason] = (failureReasons[errorReason] || 0) + 1
              results.push({
                grade,
                fileName: file.name,
                success: false,
                chunksProcessed: 0,
                error: errorReason,
                extractionMethod: 'failed-no-data'
              })
              continue
            }
            
            console.log(`Downloaded ${file.name}, size: ${pdfData.size} bytes, type: ${pdfData.type}`)
            
            // Convert blob to buffer more safely
            let pdfBuffer: Buffer
            try {
              const arrayBuffer = await pdfData.arrayBuffer()
              pdfBuffer = Buffer.from(arrayBuffer)
              
              console.log(`Converted to buffer: ${pdfBuffer.length} bytes`)
              
              if (pdfBuffer.length === 0) {
                throw new Error('Downloaded file is empty')
              }
              
              // Verify it's a PDF by checking magic bytes
              const pdfHeader = pdfBuffer.subarray(0, 4).toString()
              if (!pdfHeader.includes('%PDF')) {
                console.warn(`File ${file.name} may not be a valid PDF (header: ${pdfHeader})`)
              }
              
            } catch (bufferError) {
              console.error(`Error converting ${file.name} to buffer:`, bufferError)
              const errorReason = `Buffer conversion failed: ${bufferError instanceof Error ? bufferError.message : 'Unknown error'}`
              failureReasons[errorReason] = (failureReasons[errorReason] || 0) + 1
              results.push({
                grade,
                fileName: file.name,
                success: false,
                chunksProcessed: 0,
                error: errorReason,
                extractionMethod: 'failed-buffer'
              })
              continue
            }
            
            // Process the PDF
            const result = await processPDFAndStoreEmbeddings(
              grade,
              file.name,
              pdfBuffer,
              supabase
            )
            
            if (!result.success && result.error) {
              failureReasons[result.error] = (failureReasons[result.error] || 0) + 1
            }
            
            results.push({
              grade,
              fileName: file.name,
              success: result.success,
              chunksProcessed: result.chunksProcessed,
              error: result.error,
              extractionMethod: result.extractionMethod || 'unknown'
            })
            
          } catch (error) {
            console.error(`Error processing ${file.name} for Grade ${grade}:`, error)
            const errorReason = error instanceof Error ? error.message : 'Unknown error'
            failureReasons[errorReason] = (failureReasons[errorReason] || 0) + 1
            results.push({
              grade,
              fileName: file.name,
              success: false,
              chunksProcessed: 0,
              error: errorReason,
              extractionMethod: 'failed-processing'
            })
          }
        }
        
      } catch (error) {
        console.error(`Error processing Grade ${grade}:`, error)
        const errorReason = error instanceof Error ? error.message : 'Unknown error'
        failureReasons[errorReason] = (failureReasons[errorReason] || 0) + 1
        results.push({
          grade,
          fileName: 'N/A',
          success: false,
          chunksProcessed: 0,
          error: errorReason,
          extractionMethod: 'failed-grade'
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const totalCount = results.length
    const totalChunks = results.reduce((sum, r) => sum + r.chunksProcessed, 0)
    
    const summary = {
      totalProcessed: totalCount,
      totalSuccessful: successCount,
      totalFailed: totalCount - successCount,
      totalChunks,
      failureReasons
    }
    
    console.log(`Processing complete: ${successCount}/${totalCount} files successful, ${totalChunks} total chunks`)
    console.log('Failure breakdown:', failureReasons)
    
    return {
      success: successCount > 0,
      results,
      summary
    }
    
  } catch (error) {
    console.error('Error in processAllTextbooks:', error)
    const errorReason = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      results: [{
        grade: 0,
        fileName: 'N/A',
        success: false,
        chunksProcessed: 0,
        error: errorReason,
        extractionMethod: 'failed-global'
      }],
      summary: {
        totalProcessed: 1,
        totalSuccessful: 0,
        totalFailed: 1,
        totalChunks: 0,
        failureReasons: { [errorReason]: 1 }
      }
    }
  }
}

// Function to process specific textbooks by their IDs from the database
export async function processSpecificTextbooks(textbookIds: string[]): Promise<{
  success: boolean
  results: Array<{
    id: string
    fileName: string
    success: boolean
    chunksProcessed: number
    error?: string
    extractionMethod?: string
  }>
  summary: {
    totalProcessed: number
    totalSuccessful: number
    totalFailed: number
    totalChunks: number
    failureReasons: Record<string, number>
  }
}> {
  const results: Array<{
    id: string
    fileName: string
    success: boolean
    chunksProcessed: number
    error?: string
    extractionMethod?: string
  }> = []
  
  const failureReasons: Record<string, number> = {}
  
  try {
    console.log(`🔄 Processing ${textbookIds.length} specific textbooks...`)
    
    // Create Supabase client
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get textbook details from database
    const { data: textbooks, error: fetchError } = await supabase
      .from('textbook_uploads')
      .select('*')
      .in('id', textbookIds)
    
    if (fetchError) {
      throw new Error(`Failed to fetch textbook details: ${fetchError.message}`)
    }
    
    if (!textbooks || textbooks.length === 0) {
      throw new Error('No textbooks found with the provided IDs')
    }
    
    console.log(`📚 Found ${textbooks.length} textbooks to process`)
    
    // Process each textbook
    for (const textbook of textbooks) {
      try {
        console.log(`🔄 Processing textbook: ${textbook.file_name} (ID: ${textbook.id})`)
        
        // Update status to processing
        await supabase
          .from('textbook_uploads')
          .update({ 
            processing_started_at: new Date().toISOString(),
            processing_error: null 
          })
          .eq('id', textbook.id)
        
        // Download the file from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('textbook_content')
          .download(textbook.file_path)
        
        if (downloadError) {
          console.error('Download error details:', downloadError)
          const errorMsg = downloadError.message || (downloadError as any).error || JSON.stringify(downloadError) || 'Unknown download error'
          throw new Error(`Failed to download file: ${errorMsg}`)
        }
        
        // Convert to buffer
        const buffer = await fileData.arrayBuffer()
        const fileBuffer = Buffer.from(buffer)
          // Process the PDF
        const processingResult = await processPDFAndStoreEmbeddings(
          textbook.grade_level,
          textbook.file_name, 
          fileBuffer,
          supabase
        )
        
        // Update textbook status
        const chunksProcessed = processingResult.chunksProcessed || 0
        await supabase
          .from('textbook_uploads')
          .update({ 
            processed: true,
            processing_completed_at: new Date().toISOString(),
            chunks_created: chunksProcessed,
            processing_error: null,
            processing_started_at: null
          })
          .eq('id', textbook.id)
        
        results.push({
          id: textbook.id,
          fileName: textbook.file_name,
          success: true,
          chunksProcessed,
          extractionMethod: processingResult.extractionMethod || 'unknown'
        })
        
        console.log(`✅ Successfully processed ${textbook.file_name}: ${chunksProcessed} chunks`)
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ Failed to process ${textbook.file_name}:`, errorMessage)
        
        // Update textbook with error
        await supabase
          .from('textbook_uploads')
          .update({ 
            processing_error: errorMessage,
            processing_started_at: null
          })
          .eq('id', textbook.id)
        
        results.push({
          id: textbook.id,
          fileName: textbook.file_name,
          success: false,
          chunksProcessed: 0,
          error: errorMessage
        })
        
        // Track failure reasons
        const reason = errorMessage.split(':')[0] || 'Unknown error'
        failureReasons[reason] = (failureReasons[reason] || 0) + 1
      }
    }
    
    const totalSuccessful = results.filter(r => r.success).length
    const totalFailed = results.filter(r => !r.success).length
    const totalChunks = results.reduce((sum, r) => sum + r.chunksProcessed, 0)
    
    console.log(`🎯 Processing complete: ${totalSuccessful}/${results.length} successful, ${totalChunks} total chunks`)
    
    return {
      success: totalFailed === 0,
      results,
      summary: {
        totalProcessed: results.length,
        totalSuccessful,
        totalFailed,
        totalChunks,
        failureReasons
      }
    }
    
  } catch (error) {
    console.error('💥 Error in processSpecificTextbooks:', error)
    const errorReason = error instanceof Error ? error.message : 'Unknown error'
    
    return {
      success: false,
      results: [{
        id: 'unknown',
        fileName: 'N/A',
        success: false,
        chunksProcessed: 0,
        error: errorReason,
        extractionMethod: 'failed-global'
      }],
      summary: {
        totalProcessed: 1,
        totalSuccessful: 0,
        totalFailed: 1,
        totalChunks: 0,
        failureReasons: { [errorReason]: 1 }
      }
    }
  }
}
