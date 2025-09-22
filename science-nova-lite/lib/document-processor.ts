import { createClient } from '@supabase/supabase-js';
import { processDocumentForEmbeddings, EMBEDDING_CONFIG } from './openai-embeddings';

// Import the existing PDF processing methods from the current textbook processor
// We'll reuse the PDF extraction logic but enhance it for the new system
// Note: extractTextFromPDF will be imported dynamically where needed

// Enhanced file processing types
export interface FileProcessingJob {
  filePath: string;
  fileName: string;
  bucketName: string;
  gradeLevel: number;
  documentType: 'textbook' | 'curriculum' | 'lesson_plan';
  priority: 'high' | 'normal' | 'low';
  lastModified?: Date;
}

export interface ProcessingResult {
  filePath: string;
  fileName: string;
  success: boolean;
  chunksCreated: number;
  totalTokens: number;
  error?: string;
  extractionMethod?: string;
  embeddingModel: string;
  processingTimeMs: number;
}

export interface BucketScanResult {
  totalFiles: number;
  newFiles: number;
  updatedFiles: number;
  processingJobs: FileProcessingJob[];
  errors: string[];
}

// Supported file types for processing
const SUPPORTED_FILE_TYPES = ['.pdf', '.txt', '.md', '.docx'];

// Grade level detection from folder names and file names
function detectGradeLevel(folderName: string, fileName: string): number {
  // Try to extract grade from folder name first (e.g., "grade_4", "Grade 3", "grade-2")
  const folderGradeMatch = folderName.match(/grade[\s_-]*(\d+)/i);
  if (folderGradeMatch) {
    return parseInt(folderGradeMatch[1]);
  }

  // Try to extract grade from file name
  const fileGradeMatch = fileName.match(/grade[\s_-]*(\d+)/i);
  if (fileGradeMatch) {
    return parseInt(fileGradeMatch[1]);
  }

  // Try to extract numeric grade patterns
  const numericMatch = fileName.match(/\b(\d+)(?:st|nd|rd|th)?\s*grade\b/i) || 
                      folderName.match(/\b(\d+)(?:st|nd|rd|th)?\s*grade\b/i);
  if (numericMatch) {
    return parseInt(numericMatch[1]);
  }

  // Default to grade 1 if no grade detected
  console.warn(`Could not detect grade level for ${fileName} in ${folderName}, defaulting to grade 1`);
  return 1;
}

// Determine document type based on bucket and file name
function determineDocumentType(bucketName: string, fileName: string): 'textbook' | 'curriculum' | 'lesson_plan' {
  const lowerFileName = fileName.toLowerCase();
  
  if (bucketName === 'textbook_content' || bucketName === 'Textbook Content') {
    return 'textbook';
  }
  
  if (bucketName === 'Curriculums' || bucketName === 'curriculums') {
    if (lowerFileName.includes('lesson') || lowerFileName.includes('plan')) {
      return 'lesson_plan';
    }
    return 'curriculum';
  }

  // Fallback based on filename patterns
  if (lowerFileName.includes('textbook') || lowerFileName.includes('book')) {
    return 'textbook';
  }
  
  if (lowerFileName.includes('lesson') || lowerFileName.includes('plan')) {
    return 'lesson_plan';
  }
  
  return 'curriculum';
}

// Check if file is supported for processing
function isSupportedFile(fileName: string): boolean {
  const extension = '.' + fileName.split('.').pop()?.toLowerCase();
  return SUPPORTED_FILE_TYPES.includes(extension);
}

// Scan a bucket for files that need processing
export async function scanBucketForFiles(
  bucketName: string,
  supabase: any,
  forceReprocess: boolean = false
): Promise<BucketScanResult> {
  const result: BucketScanResult = {
    totalFiles: 0,
    newFiles: 0,
    updatedFiles: 0,
    processingJobs: [],
    errors: []
  };

  try {
    console.log(`Scanning bucket: ${bucketName}`);

    // Get all files from the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

    if (listError) {
      result.errors.push(`Error listing files in ${bucketName}: ${listError.message}`);
      return result;
    }

    if (!files || files.length === 0) {
      console.log(`No files found in bucket ${bucketName}`);
      return result;
    }

    // Process each folder/file
    for (const item of files) {
      if (item.name.startsWith('grade_') || item.name.match(/grade[\s_-]*\d+/i)) {
        // This is a grade folder, scan its contents
        const folderResult = await scanGradeFolder(bucketName, item.name, supabase, forceReprocess);
        
        result.totalFiles += folderResult.totalFiles;
        result.newFiles += folderResult.newFiles;
        result.updatedFiles += folderResult.updatedFiles;
        result.processingJobs.push(...folderResult.processingJobs);
        result.errors.push(...folderResult.errors);
        
      } else if (isSupportedFile(item.name)) {
        // This is a file in the root of the bucket
        const filePath = item.name;
        const gradeLevel = detectGradeLevel('', item.name);
        const documentType = determineDocumentType(bucketName, item.name);
        
        result.totalFiles++;
        
        const needsProcessing = await checkIfFileNeedsProcessing(
          filePath, 
          bucketName, 
          item.updated_at || item.created_at, 
          supabase, 
          forceReprocess
        );
        
        if (needsProcessing.needed) {
          const job: FileProcessingJob = {
            filePath,
            fileName: item.name,
            bucketName,
            gradeLevel,
            documentType,
            priority: 'normal',
            lastModified: new Date(item.updated_at || item.created_at || Date.now())
          };
          
          result.processingJobs.push(job);
          
          if (needsProcessing.isNew) {
            result.newFiles++;
          } else {
            result.updatedFiles++;
          }
        }
      }
    }

    console.log(`Scan complete for ${bucketName}: ${result.totalFiles} total files, ${result.processingJobs.length} need processing`);
    return result;

  } catch (error) {
    const errorMsg = `Error scanning bucket ${bucketName}: ${error}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
    return result;
  }
}

// Scan a specific grade folder
async function scanGradeFolder(
  bucketName: string,
  folderName: string,
  supabase: any,
  forceReprocess: boolean
): Promise<BucketScanResult> {
  const result: BucketScanResult = {
    totalFiles: 0,
    newFiles: 0,
    updatedFiles: 0,
    processingJobs: [],
    errors: []
  };

  try {
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list(folderName, { limit: 100 });

    if (error) {
      result.errors.push(`Error listing files in ${bucketName}/${folderName}: ${error.message}`);
      return result;
    }

    if (!files || files.length === 0) {
      return result;
    }

    const gradeLevel = detectGradeLevel(folderName, '');

    for (const file of files) {
      if (file.name && isSupportedFile(file.name)) {
        const filePath = `${folderName}/${file.name}`;
        const documentType = determineDocumentType(bucketName, file.name);
        
        result.totalFiles++;
        
        const needsProcessing = await checkIfFileNeedsProcessing(
          filePath, 
          bucketName, 
          file.updated_at || file.created_at, 
          supabase, 
          forceReprocess
        );
        
        if (needsProcessing.needed) {
          const job: FileProcessingJob = {
            filePath,
            fileName: file.name,
            bucketName,
            gradeLevel,
            documentType,
            priority: 'normal',
            lastModified: new Date(file.updated_at || file.created_at || Date.now())
          };
          
          result.processingJobs.push(job);
          
          if (needsProcessing.isNew) {
            result.newFiles++;
          } else {
            result.updatedFiles++;
          }
        }
      }
    }

  } catch (error) {
    result.errors.push(`Error scanning folder ${folderName}: ${error}`);
  }

  return result;
}

// Check if a file needs processing (new or updated)
async function checkIfFileNeedsProcessing(
  filePath: string,
  bucketName: string,
  fileLastModified: string | null,
  supabase: any,
  forceReprocess: boolean
): Promise<{ needed: boolean; isNew: boolean }> {
  if (forceReprocess) {
    return { needed: true, isNew: false };
  }

  try {
    // Check if we have any embeddings for this file
    const { data: existingEmbeddings, error } = await supabase
      .from('openai_embeddings')
      .select('created_at, updated_at')
      .eq('file_path', filePath)
      .limit(1);

    if (error) {
      console.warn(`Error checking existing embeddings for ${filePath}:`, error);
      return { needed: true, isNew: true };
    }

    if (!existingEmbeddings || existingEmbeddings.length === 0) {
      // No embeddings exist, this is a new file
      return { needed: true, isNew: true };
    }

    // Check if file has been modified since last processing
    if (fileLastModified) {
      const fileModTime = new Date(fileLastModified);
      const lastProcessed = new Date(existingEmbeddings[0].updated_at || existingEmbeddings[0].created_at);
      
      if (fileModTime > lastProcessed) {
        // File has been modified since last processing
        return { needed: true, isNew: false };
      }
    }

    // File doesn't need processing
    return { needed: false, isNew: false };

  } catch (error) {
    console.warn(`Error checking file processing status for ${filePath}:`, error);
    return { needed: true, isNew: true };
  }
}

// Process a single file job
export async function processFileJob(
  job: FileProcessingJob,
  model: string = EMBEDDING_CONFIG.DEFAULT_MODEL
): Promise<ProcessingResult> {
  const startTime = Date.now();
  
  try {
    console.log(`Processing file: ${job.fileName} (${job.documentType}, Grade ${job.gradeLevel})`);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Download the file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(job.bucketName)
      .download(job.filePath);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert to buffer for PDF processing
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from the file
    let textContent: string;
    let extractionMethod: string;

    if (job.fileName.toLowerCase().endsWith('.pdf')) {
      // Simple PDF text extraction
      try {
        const pdfParse = await import('pdf-parse');
        const pdfData = await pdfParse.default(buffer);
        textContent = pdfData.text;
        extractionMethod = 'pdf-parse';
      } catch (pdfError) {
        throw new Error(`PDF extraction failed: ${pdfError}`);
      }
    } else if (job.fileName.toLowerCase().endsWith('.txt')) {
      textContent = buffer.toString('utf-8');
      extractionMethod = 'text-file';
    } else {
      throw new Error(`Unsupported file type: ${job.fileName}`);
    }

    if (!textContent || textContent.trim().length < 100) {
      throw new Error('Insufficient text content extracted from file');
    }

    // Process the document for embeddings
    const result = await processDocumentForEmbeddings(
      job.filePath,
      job.fileName,
      job.bucketName,
      job.gradeLevel,
      job.documentType,
      textContent,
      extractionMethod,
      model
    );

    const processingTime = Date.now() - startTime;

    return {
      filePath: job.filePath,
      fileName: job.fileName,
      success: result.success,
      chunksCreated: result.chunksProcessed,
      totalTokens: result.totalTokens,
      error: result.error,
      extractionMethod: result.extractionMethod,
      embeddingModel: result.embeddingModel,
      processingTimeMs: processingTime
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`Error processing ${job.fileName}:`, errorMessage);

    return {
      filePath: job.filePath,
      fileName: job.fileName,
      success: false,
      chunksCreated: 0,
      totalTokens: 0,
      error: errorMessage,
      embeddingModel: model,
      processingTimeMs: processingTime
    };
  }
}

// Process multiple files in batches
export async function processBatchJobs(
  jobs: FileProcessingJob[],
  batchSize: number = 3,
  model: string = EMBEDDING_CONFIG.DEFAULT_MODEL
): Promise<{
  results: ProcessingResult[];
  summary: {
    totalProcessed: number;
    totalSuccessful: number;
    totalFailed: number;
    totalChunks: number;
    totalTokens: number;
    totalTimeMs: number;
  };
}> {
  const results: ProcessingResult[] = [];
  const startTime = Date.now();

  console.log(`Processing ${jobs.length} files in batches of ${batchSize}`);

  // Sort jobs by priority (high first) and then by grade level
  const sortedJobs = jobs.sort((a, b) => {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.gradeLevel - b.gradeLevel;
  });

  // Process in batches
  for (let i = 0; i < sortedJobs.length; i += batchSize) {
    const batch = sortedJobs.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sortedJobs.length / batchSize)}`);

    // Process batch in parallel
    const batchPromises = batch.map(job => processFileJob(job, model));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);

    // Add a small delay between batches to avoid overwhelming the system
    if (i + batchSize < sortedJobs.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const totalTime = Date.now() - startTime;

  const summary = {
    totalProcessed: results.length,
    totalSuccessful: results.filter(r => r.success).length,
    totalFailed: results.filter(r => !r.success).length,
    totalChunks: results.reduce((sum, r) => sum + r.chunksCreated, 0),
    totalTokens: results.reduce((sum, r) => sum + r.totalTokens, 0),
    totalTimeMs: totalTime
  };

  console.log(`Batch processing complete:`, summary);

  return { results, summary };
}

// Main function to scan all buckets and process files
export async function processAllDocuments(
  forceReprocess: boolean = false,
  model: string = EMBEDDING_CONFIG.DEFAULT_MODEL
): Promise<{
  success: boolean;
  bucketResults: Record<string, BucketScanResult>;
  processingResults: ProcessingResult[];
  summary: {
    totalFiles: number;
    totalProcessed: number;
    totalSuccessful: number;
    totalFailed: number;
    totalChunks: number;
    totalTokens: number;
    processingTimeMs: number;
  };
}> {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Starting comprehensive document processing...');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Define buckets to scan
    const bucketsToScan = [
      'textbook_content',
      'Textbook Content',
      'Curriculums',
      'curriculums'
    ];

    const bucketResults: Record<string, BucketScanResult> = {};
    const allJobs: FileProcessingJob[] = [];

    // Scan all buckets
    for (const bucketName of bucketsToScan) {
      const scanResult = await scanBucketForFiles(bucketName, supabase, forceReprocess);
      bucketResults[bucketName] = scanResult;
      allJobs.push(...scanResult.processingJobs);
    }

    console.log(`Found ${allJobs.length} files to process across all buckets`);

    if (allJobs.length === 0) {
      console.log('No files need processing');
      return {
        success: true,
        bucketResults,
        processingResults: [],
        summary: {
          totalFiles: Object.values(bucketResults).reduce((sum, r) => sum + r.totalFiles, 0),
          totalProcessed: 0,
          totalSuccessful: 0,
          totalFailed: 0,
          totalChunks: 0,
          totalTokens: 0,
          processingTimeMs: Date.now() - startTime
        }
      };
    }

    // Process all files
    const { results, summary: batchSummary } = await processBatchJobs(allJobs, 3, model);

    const totalTime = Date.now() - startTime;

    const summary = {
      totalFiles: Object.values(bucketResults).reduce((sum, r) => sum + r.totalFiles, 0),
      totalProcessed: batchSummary.totalProcessed,
      totalSuccessful: batchSummary.totalSuccessful,
      totalFailed: batchSummary.totalFailed,
      totalChunks: batchSummary.totalChunks,
      totalTokens: batchSummary.totalTokens,
      processingTimeMs: totalTime
    };

    console.log('🎉 Document processing complete!', summary);

    return {
      success: batchSummary.totalSuccessful > 0,
      bucketResults,
      processingResults: results,
      summary
    };

  } catch (error) {
    console.error('Error in comprehensive document processing:', error);
    
    return {
      success: false,
      bucketResults: {},
      processingResults: [],
      summary: {
        totalFiles: 0,
        totalProcessed: 0,
        totalSuccessful: 0,
        totalFailed: 1,
        totalChunks: 0,
        totalTokens: 0,
        processingTimeMs: Date.now() - startTime
      }
    };
  }
}

export default {
  scanBucketForFiles,
  processFileJob,
  processBatchJobs,
  processAllDocuments,
  detectGradeLevel,
  determineDocumentType,
  isSupportedFile
};