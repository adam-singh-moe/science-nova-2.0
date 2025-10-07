/**
 * Docling PDF Text Extractor with OCR Support
 * TypeScript wrapper for Python Docling with comprehensive OCR capabilities
 */

import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface DoclingExtractionResult {
  success: boolean
  text: string
  method: string
  error?: string
  duration?: number
  character_count?: number
  page_count?: number
}

/**
 * Extract text from PDF using Docling with OCR support
 */
export async function extractWithDocling(
  pdfBuffer: Buffer, 
  filename: string = 'document.pdf'
): Promise<DoclingExtractionResult> {
  console.log(`Starting Docling extraction for ${filename} (${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB)...`)
  
  // Create temporary file for large PDFs to avoid command line length limits
  const tempDir = path.join(process.cwd(), 'temp')
  const tempFile = path.join(tempDir, `temp_${Date.now()}_${filename}`)
  
  try {
    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true })
    
    // Write PDF buffer to temporary file
    await fs.writeFile(tempFile, pdfBuffer)
    
    // Get Python executable path from environment
    const pythonExecutable = 'C:/Users/adams/projects/Github-Copilot/science-nova 2.0/.venv/Scripts/python.exe'
    const scriptPath = path.join(__dirname, 'docling_extractor.py')
    
    // Execute Python Docling extractor with file path
    const result = await new Promise<DoclingExtractionResult>((resolve, reject) => {
      const pythonProcess = spawn(pythonExecutable, [
        scriptPath,
        'file',
        tempFile
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      let stdout = ''
      let stderr = ''
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
        // Log progress messages from Python script
        const progressMsg = data.toString().trim()
        if (progressMsg) {
          console.log(`Docling: ${progressMsg}`)
        }
      })
      
      pythonProcess.on('close', async (code) => {
        // Clean up temporary file
        try {
          await fs.unlink(tempFile)
        } catch (cleanupError) {
          console.warn('Failed to clean up temp file:', cleanupError)
        }
        
        if (code !== 0) {
          console.error(`Docling process exited with code ${code}`)
          console.error(`STDERR: ${stderr}`)
          reject(new Error(`Docling extraction failed with exit code ${code}: ${stderr}`))
          return
        }
        
        try {
          const jsonResult = JSON.parse(stdout.trim())
          resolve(jsonResult)
        } catch (parseError) {
          console.error('Failed to parse Docling output:', stdout)
          reject(new Error(`Failed to parse Docling JSON output: ${parseError}`))
        }
      })
      
      pythonProcess.on('error', async (error) => {
        // Clean up temporary file on error
        try {
          await fs.unlink(tempFile)
        } catch (cleanupError) {
          console.warn('Failed to clean up temp file:', cleanupError)
        }
        reject(new Error(`Failed to spawn Docling process: ${error.message}`))
      })
      
      // Set timeout for very large files (10 minutes)
      setTimeout(() => {
        pythonProcess.kill('SIGTERM')
        reject(new Error('Docling extraction timeout (10 minutes)'))
      }, 10 * 60 * 1000)
    })
    
    console.log(`Docling extraction completed: ${result.method}, ${result.character_count} characters in ${result.duration?.toFixed(2)}s`)
    
    return result
    
  } catch (error) {
    // Clean up temporary file if error occurs before process starts
    try {
      await fs.unlink(tempFile)
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    console.error('Docling extraction error:', error)
    
    return {
      success: false,
      text: '',
      method: 'docling-wrapper-error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Extract text from PDF file using Docling with OCR support
 */
export async function extractFileWithDocling(filePath: string): Promise<DoclingExtractionResult> {
  try {
    // Read file and extract using buffer method
    const pdfBuffer = await fs.readFile(filePath)
    const filename = path.basename(filePath)
    
    return await extractWithDocling(pdfBuffer, filename)
    
  } catch (error) {
    return {
      success: false,
      text: '',
      method: 'docling-file-error',
      error: error instanceof Error ? error.message : 'Unknown file error'
    }
  }
}

/**
 * Check if Docling is available and properly configured
 */
export async function checkDoclingAvailability(): Promise<boolean> {
  try {
    const pythonExecutable = 'C:/Users/adams/projects/Github-Copilot/science-nova 2.0/.venv/Scripts/python.exe'
    
    const result = await new Promise<boolean>((resolve) => {
      const pythonProcess = spawn(pythonExecutable, [
        '-c',
        'import docling; print("Docling available")'
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      pythonProcess.on('close', (code) => {
        resolve(code === 0)
      })
      
      pythonProcess.on('error', () => {
        resolve(false)
      })
      
      // Timeout after 5 seconds
      setTimeout(() => {
        pythonProcess.kill('SIGTERM')
        resolve(false)
      }, 5000)
    })
    
    return result
    
  } catch (error) {
    return false
  }
}