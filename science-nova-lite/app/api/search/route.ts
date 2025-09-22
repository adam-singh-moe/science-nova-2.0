import { NextRequest, NextResponse } from 'next/server';
import { searchEmbeddings, searchWithContext, searchForPromptContext } from '@/lib/vector-search';

// POST: Perform vector search operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'search': {
        const { 
          query, 
          gradeLevel, 
          documentType, 
          limit = 10, 
          threshold = 0.7,
          model = 'text-embedding-3-large'
        } = params;

        if (!query) {
          return NextResponse.json(
            { success: false, error: 'Query parameter is required' },
            { status: 400 }
          );
        }

        const results = await searchEmbeddings({
          query,
          gradeLevel: gradeLevel ? parseInt(gradeLevel) : undefined,
          documentTypes: documentType ? [documentType] : undefined,
          maxResults: parseInt(limit),
          minSimilarity: parseFloat(threshold),
          embeddingModel: model
        });

        return NextResponse.json({
          success: true,
          data: {
            results: results.results,
            metadata: {
              query,
              resultsCount: results.results.length,
              searchParams: { gradeLevel, documentType, limit, threshold, model },
              cached: results.cached
            }
          }
        });
      }

      case 'search_with_context': {
        const { 
          query, 
          context,
          gradeLevel, 
          documentType, 
          limit = 15,
          model = 'text-embedding-3-large'
        } = params;

        if (!query) {
          return NextResponse.json(
            { success: false, error: 'Query parameter is required' },
            { status: 400 }
          );
        }

        const results = await searchWithContext(
          query,
          {
            gradeLevel: gradeLevel ? parseInt(gradeLevel) : 5, // Default grade level
            subject: context?.subject,
            topicKeywords: context?.topicKeywords,
            learningObjectives: context?.learningObjectives
          },
          {
            documentTypes: documentType ? [documentType] : undefined,
            maxResults: parseInt(limit),
            embeddingModel: model
          }
        );

        return NextResponse.json({
          success: true,
          data: {
            results: results.results,
            metadata: {
              query,
              context: context ? 'provided' : 'none',
              resultsCount: results.results.length,
              searchParams: { gradeLevel, documentType, limit, model },
              cached: results.cached
            }
          }
        });
      }

      case 'search_for_prompt': {
        const { 
          query, 
          contentType,
          gradeLevel, 
          documentType, 
          model = 'text-embedding-3-large'
        } = params;

        if (!query || !contentType) {
          return NextResponse.json(
            { success: false, error: 'Query and contentType parameters are required' },
            { status: 400 }
          );
        }

        const context = await searchForPromptContext(
          query,
          gradeLevel ? parseInt(gradeLevel) : 5, // Default grade level
          contentType,
          4000 // Default max chars
        );

        return NextResponse.json({
          success: true,
          data: {
            context,
            metadata: {
              query,
              contentType,
              contextLength: context.length,
              searchParams: { gradeLevel, documentType, model }
            }
          }
        });
      }

      case 'test_search': {
        const testQueries = [
          'photosynthesis in plants',
          'solar system planets',
          'water cycle evaporation',
          'animal adaptation',
          'force and motion'
        ];

        const testResults = [];
        
        for (const testQuery of testQueries) {
          try {
            const results = await searchEmbeddings({ query: testQuery, maxResults: 3 });
            testResults.push({
              query: testQuery,
              resultsCount: results.results.length,
              topResult: results.results[0] ? {
                similarity: results.results[0].similarity,
                documentType: results.results[0].documentType,
                gradeLevel: results.results[0].gradeLevel
              } : null
            });
          } catch (error) {
            testResults.push({
              query: testQuery,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            testResults,
            summary: {
              totalQueries: testQueries.length,
              successfulQueries: testResults.filter(r => !r.error).length,
              failedQueries: testResults.filter(r => r.error).length
            }
          }
        });
      }

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: `Unknown action: ${action}`,
            availableActions: ['search', 'search_with_context', 'search_for_prompt', 'test_search']
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in search POST:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET: Basic search endpoint information
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Vector search API available',
      endpoints: {
        POST: {
          description: 'Perform vector search operations',
          actions: [
            {
              name: 'search',
              description: 'Basic similarity search',
              requiredParams: ['query'],
              optionalParams: ['gradeLevel', 'documentType', 'limit', 'threshold', 'model']
            },
            {
              name: 'search_with_context',
              description: 'Search with additional context',
              requiredParams: ['query'],
              optionalParams: ['context', 'gradeLevel', 'documentType', 'limit', 'model']
            },
            {
              name: 'search_for_prompt',
              description: 'Search optimized for AI prompt context',
              requiredParams: ['query', 'contentType'],
              optionalParams: ['gradeLevel', 'documentType', 'model']
            },
            {
              name: 'test_search',
              description: 'Run test searches to validate system',
              requiredParams: [],
              optionalParams: []
            }
          ]
        }
      }
    });

  } catch (error) {
    console.error('Error in search GET:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}