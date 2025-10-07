import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { chunkText, generateBatchEmbeddings } from '@/lib/openai-embeddings'
import { extractTextFromPDF } from '@/lib/pdf-extractor'

interface DocumentToProcess {
  id: string
  name?: string
  path?: string
  bucket?: string
  type?: string
  grade?: number
}

interface ProcessingRequest {
  documents: DocumentToProcess[]
}

export async function POST(request: NextRequest) {
  try {
    console.log('Embeddings processing endpoint called')
    const { documents }: ProcessingRequest = await request.json()

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: 'Documents array is required' },
        { status: 400 }
      )
    }

    console.log(`Starting processing of ${documents.length} documents`)

    const results = []

    for (const doc of documents) {
      try {
        console.log(`Processing document: ${doc.name || doc.id}`)

        if (!doc.bucket || !doc.path) {
          results.push({
            id: doc.id,
            success: false,
            error: 'Document bucket and path are required'
          })
          continue
        }

        if (!doc.grade) {
          results.push({
            id: doc.id,
            success: false,
            error: 'Document grade level is required'
          })
          continue
        }

        // Download the document from Supabase storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(doc.bucket)
          .download(doc.path)

        if (downloadError || !fileData) {
          console.error(`Failed to download document ${doc.id}:`, downloadError)
          results.push({
            id: doc.id,
            success: false,
            error: `Failed to download document: ${downloadError?.message || 'Unknown error'}`
          })
          continue
        }

        console.log(`Downloaded ${doc.name || doc.id}, size: ${fileData.size} bytes`)

        let content: string = ''
        let extractionMethod: string = ''

        // Handle PDF files
        if (doc.path.toLowerCase().endsWith('.pdf')) {
          try {
            const pdfStartTime = Date.now()
            console.log(`Processing PDF: ${doc.name || doc.id}`)
            
            // Convert file data to buffer for PDF processing
            const pdfBuffer = Buffer.from(await fileData.arrayBuffer())
            const sizeMB = (pdfBuffer.length / (1024 * 1024)).toFixed(2)
            console.log(`PDF size: ${sizeMB} MB`)
            
            // Extract real text from PDF using optimized fallback strategies
            const extractionResult = await extractTextFromPDF(pdfBuffer)
            
            if (extractionResult.success && extractionResult.text.length >= 50) {
              content = extractionResult.text
              extractionMethod = extractionResult.method
              console.log(`Successfully extracted ${content.length} characters from PDF ${doc.name} using ${extractionMethod}`)
            } else {
              // If extraction failed, log the error and skip this document
              console.error(`Failed to extract text from PDF ${doc.name}:`, extractionResult.error || 'Unknown extraction error')
              results.push({
                id: doc.id,
                success: false,
                error: `PDF text extraction failed: ${extractionResult.error || 'No extractable text found'}`,
                extractionMethod: extractionResult.method || 'extraction-failed'
              })
              continue
            }
            
          } catch (pdfError) {
            console.error(`Error processing PDF ${doc.name}:`, pdfError)
            results.push({
              id: doc.id,
              success: false,
              error: `Failed to process PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown PDF processing error'}`,
              extractionMethod: 'pdf-processing-failed'
            })
            continue
          }
        } else {
          // Handle text files
          try {
            content = await fileData.text()
            extractionMethod = 'text-direct'
          } catch (textError) {
            console.error(`Failed to read text file ${doc.name}:`, textError)
            results.push({
              id: doc.id,
              success: false,
              error: `Failed to read text file: ${textError instanceof Error ? textError.message : 'Unknown text reading error'}`,
              extractionMethod: 'text-read-failed'
            })
            continue
          }
        }

        // Process the extracted content
        try {
          
          if (!content || content.trim().length === 0) {
            results.push({
              id: doc.id,
              success: false,
              error: 'Document appears to be empty or unreadable'
            })
            continue
          }

          console.log(`Extracted ${content.length} characters from ${doc.name}`)

          // Split content into chunks
          const chunks = chunkText(content)
          
          if (chunks.length === 0) {
            results.push({
              id: doc.id,
              success: false,
              error: 'No valid content chunks generated'
            })
            continue
          }

          console.log(`Generated ${chunks.length} chunks for ${doc.name}`)

          // Generate embeddings for all chunks
          const embeddings = await generateBatchEmbeddings(chunks)

          console.log(`Generated ${embeddings.length} embeddings for ${doc.name}`)

          // Prepare metadata
          const baseMetadata = {
            document_id: doc.id,
            document_name: doc.name || doc.path,
            document_type: doc.type || (extractionMethod === 'pdf-parse' ? 'pdf' : 'text'),
            processed_at: new Date().toISOString(),
            total_chunks: chunks.length,
            extraction_method: extractionMethod
          }

          // Prepare data for insertion
          const embeddingData = chunks.map((chunk, index) => ({
            grade_level: doc.grade,
            file_name: doc.name || doc.path,
            chunk_index: index,
            content: chunk,
            metadata: {
              ...baseMetadata,
              chunk_length: chunk.length,
              chunk_index: index
            },
            embedding: embeddings[index]
          }))

          // Remove existing embeddings for this document if any
          console.log(`Removing existing embeddings for ${doc.name}`)
          await supabase
            .from('textbook_embeddings')
            .delete()
            .eq('file_name', doc.name || doc.path)
            .eq('grade_level', doc.grade)

          // Insert new embeddings into database
          console.log(`Inserting ${embeddingData.length} embeddings for ${doc.name}`)
          const { data: insertData, error: insertError } = await supabase
            .from('textbook_embeddings')
            .insert(embeddingData)
            .select('id')

          if (insertError) {
            console.error(`Database error for document ${doc.id}:`, insertError)
            results.push({
              id: doc.id,
              success: false,
              error: `Failed to store embeddings: ${insertError.message}`
            })
            continue
          }

          results.push({
            id: doc.id,
            success: true,
            chunksProcessed: chunks.length,
            embeddingsStored: insertData?.length || 0,
            extractionMethod: extractionMethod
          })

          console.log(`Successfully processed ${extractionMethod === 'pdf-parse' ? 'PDF' : 'text'} file ${doc.name}: ${chunks.length} chunks`)

        } catch (processingError) {
          console.error(`Error processing ${extractionMethod === 'pdf-parse' ? 'PDF' : 'text'} file ${doc.name}:`, processingError)
          results.push({
            id: doc.id,
            success: false,
            error: `Failed to process ${extractionMethod === 'pdf-parse' ? 'PDF' : 'text'} file: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`,
            extractionMethod: extractionMethod
          })
        }

      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error)
        results.push({
          id: doc.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown processing error'
        })
      }
    }

    // Return results
    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount
    const totalChunks = results.reduce((sum, r) => sum + (r.chunksProcessed || 0), 0)

    console.log(`Processing completed: ${successCount}/${documents.length} successful, ${totalChunks} total chunks`)

    return NextResponse.json({
      message: `Processing completed. ${successCount} successful, ${failureCount} failed.`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        totalChunks
      }
    })

  } catch (error) {
    console.error('Error in document processing:', error)
    return NextResponse.json(
      { error: 'Internal server error during document processing' },
      { status: 500 }
    )
  }
}