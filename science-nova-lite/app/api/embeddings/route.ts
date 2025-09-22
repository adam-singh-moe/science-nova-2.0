import { NextRequest, NextResponse } from 'next/server';
import { processAllDocuments, processFileJob } from '@/lib/document-processor';
import { getProcessingStats, reprocessFailedDocuments } from '@/lib/openai-embeddings';

// GET: Get processing status and statistics
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'stats') {
      const stats = await getProcessingStats();
      return NextResponse.json({ success: true, stats });
    }

    // Default: return basic status
    return NextResponse.json({ 
      success: true, 
      message: 'Embeddings processing API available',
      availableActions: ['stats', 'process', 'reprocess']
    });

  } catch (error) {
    console.error('Error in embeddings GET:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// POST: Process documents or trigger specific actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'process_all': {
        const { forceReprocess = false, model } = params;
        
        console.log('🚀 Starting comprehensive document processing...');
        const result = await processAllDocuments(forceReprocess, model);
        
        return NextResponse.json({
          success: result.success,
          message: `Processed ${result.summary.totalProcessed} documents`,
          data: result
        });
      }

      case 'process_single': {
        const { filePath, fileName, bucketName, gradeLevel, documentType, model } = params;
        
        if (!filePath || !fileName || !bucketName || !gradeLevel || !documentType) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required parameters: filePath, fileName, bucketName, gradeLevel, documentType' 
            },
            { status: 400 }
          );
        }

        const job = {
          filePath,
          fileName,
          bucketName,
          gradeLevel: parseInt(gradeLevel),
          documentType,
          priority: 'high' as const
        };

        const result = await processFileJob(job, model);
        
        return NextResponse.json({
          success: result.success,
          message: result.success 
            ? `Successfully processed ${fileName}: ${result.chunksCreated} chunks created`
            : `Failed to process ${fileName}: ${result.error}`,
          data: result
        });
      }

      case 'reprocess_failed': {
        console.log('🔄 Reprocessing failed documents...');
        const result = await reprocessFailedDocuments();
        
        return NextResponse.json({
          success: result.success,
          message: `Marked ${result.reprocessedCount} documents for reprocessing`,
          data: result
        });
      }

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: `Unknown action: ${action}`,
            availableActions: ['process_all', 'process_single', 'reprocess_failed']
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in embeddings POST:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// PUT: Update processing settings or configurations
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'cleanup_cache': {
        const { cleanupEmbeddingCache } = await import('@/lib/openai-embeddings');
        const deletedCount = await cleanupEmbeddingCache();
        
        return NextResponse.json({
          success: true,
          message: `Cleaned up ${deletedCount} old cache entries`,
          data: { deletedCount }
        });
      }

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: `Unknown action: ${action}`,
            availableActions: ['cleanup_cache']
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in embeddings PUT:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}