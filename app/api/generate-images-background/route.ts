// Background image generation API for adventure stories
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

// Robust Supabase initialization with fallback
function getSupabaseClient() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Supabase environment variables not configured')
      return null
    }
    
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { adventureId, storyPages, gradeLevel } = await request.json()
    
    if (!adventureId || !storyPages) {
      return NextResponse.json({ error: "Adventure ID and story pages are required" }, { status: 400 })
    }

    console.log(`🔄 Checking background image generation for adventure: ${adventureId}`)

    // Check if we should even attempt background generation
    // Test with a simple request to see current quota status
    try {
      const testResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3002'}/api/generate-image-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test quota status',
          aspectRatio: '16:9',
          gradeLevel: gradeLevel
        })
      })

      const testResult = await testResponse.json()
      
      if (testResult.quotaExhausted) {
        console.log(`🎭 Quota exhausted - skipping background job creation`)
        return NextResponse.json({ 
          success: true, 
          message: "Quota exhausted - using direct fallbacks",
          jobId: null,
          quotaExhausted: true
        })
      }
    } catch (error) {
      console.warn('Could not test quota status, proceeding with job creation')
    }

    // Get Supabase client
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.log('📝 Supabase not available - using direct generation mode')
      return NextResponse.json({ 
        success: true, 
        message: "Background processing not available - using direct generation",
        jobId: null 
      })
    }

    // Test if the required table exists
    try {
      const { error: testError } = await supabase
        .from('adventure_image_jobs')
        .select('id')
        .limit(1)
      
      if (testError && testError.message.includes('does not exist')) {
        console.log('📝 Image jobs table does not exist - using direct generation mode')
        return NextResponse.json({ 
          success: true, 
          message: "Image jobs table not created yet - using direct generation",
          jobId: null,
          needsTableCreation: true
        })
      }
    } catch (error) {
      console.log('📝 Cannot access image jobs table - using direct generation')
      return NextResponse.json({ 
        success: true, 
        message: "Database access issue - using direct generation",
        jobId: null 
      })
    }

    // Filter pages that need image generation
    const pagesToGenerate = storyPages.filter((page: any) => 
      page.backgroundPrompt && !page.backgroundImage
    )

    if (pagesToGenerate.length === 0) {
      console.log('ℹ️ No images to generate - all pages already have images')
      return NextResponse.json({ 
        success: true, 
        message: "No images to generate",
        jobId: null 
      })
    }

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('adventure_image_jobs')
      .insert({
        adventure_id: adventureId,
        story_pages: storyPages,
        status: 'pending',
        progress: 0,
        total_images: pagesToGenerate.length
      })
      .select()
      .single()

    if (jobError) {
      console.error('Failed to create image generation job:', {
        error: jobError,
        message: jobError.message,
        details: jobError.details,
        hint: jobError.hint,
        code: jobError.code
      })
      return NextResponse.json({ 
        success: true, 
        message: "Job creation failed - using direct generation",
        jobId: null,
        error: jobError.message || 'Database error'
      })
    }

    console.log(`📝 Created job ${job.id} for ${pagesToGenerate.length} images`)

    // Start background processing (don't await - let it run async)
    processImageGenerationJob(job.id, pagesToGenerate, gradeLevel)
      .catch(error => {
        console.error(`Background job ${job.id} failed:`, error)
      })

    return NextResponse.json({ 
      success: true, 
      jobId: job.id,
      totalImages: pagesToGenerate.length
    })

  } catch (error) {
    console.error("Background image generation error:", error)
    return NextResponse.json(
      { error: `Failed to start background generation: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const adventureId = searchParams.get('adventureId')

    if (!jobId && !adventureId) {
      return NextResponse.json({ error: "Job ID or Adventure ID is required" }, { status: 400 })
    }

    // Get Supabase client
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    let query = supabase.from('adventure_image_jobs').select('*')
    
    if (jobId) {
      query = query.eq('id', jobId)
    } else if (adventureId) {
      query = query.eq('adventure_id', adventureId).order('created_at', { ascending: false }).limit(1)
    }

    const { data: job, error } = await query.single()

    if (error || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        adventureId: job.adventure_id,
        status: job.status,
        progress: job.progress,
        totalImages: job.total_images,
        errorMessage: job.error_message,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
        completedAt: job.completed_at
      }
    })

  } catch (error) {
    console.error("Job status check error:", error)
    return NextResponse.json(
      { error: `Failed to check job status: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    )
  }
}

// Background processing function
async function processImageGenerationJob(jobId: string, pages: any[], gradeLevel?: number) {
  try {
    console.log(`🚀 Starting background processing for job ${jobId}`)

    // Get Supabase client
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('Supabase not available for background processing')
      return
    }

    // Update job status to processing
    await supabase
      .from('adventure_image_jobs')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    let successCount = 0
    let errorCount = 0

    // Process each page sequentially to avoid overwhelming the API
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      
      try {
        console.log(`🎨 Generating image ${i + 1}/${pages.length} for page: ${page.id}`)

        // Call the enhanced image generation API
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3002'}/api/generate-image-enhanced`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: page.backgroundPrompt,
            aspectRatio: '16:9',
            gradeLevel: gradeLevel
          })
        })

        if (response.ok) {
          const result = await response.json()
          
          // For background processing, we'll just log the result
          // In a real implementation, you'd update the story pages in the database
          if (result.success && result.imageUrl) {
            successCount++
            console.log(`✅ Successfully generated image for page: ${page.id} (${result.type})`)
          } else {
            errorCount++
            console.warn(`⚠️ Image generation returned no URL for page: ${page.id}`)
          }
        } else {
          errorCount++
          console.error(`❌ Image generation failed for page: ${page.id}`)
        }

        // Update progress
        await supabase
          .from('adventure_image_jobs')
          .update({ 
            progress: i + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId)

        // Add delay between requests to be respectful of quotas
        await new Promise(resolve => setTimeout(resolve, 5000)) // 5 second delay

      } catch (error) {
        errorCount++
        console.error(`❌ Error processing page ${page.id}:`, error)
      }
    }

    // Mark job as completed
    await supabase
      .from('adventure_image_jobs')
      .update({ 
        status: errorCount > 0 ? 'completed_with_errors' : 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error_message: errorCount > 0 ? `${errorCount} images failed to generate` : null
      })
      .eq('id', jobId)

    console.log(`🎉 Background job ${jobId} completed: ${successCount} success, ${errorCount} errors`)

  } catch (error) {
    console.error(`💥 Background job ${jobId} failed:`, error)
    
    // Get Supabase client for error handling
    const supabase = getSupabaseClient()
    if (supabase) {
      // Mark job as failed
      await supabase
        .from('adventure_image_jobs')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', jobId)
    }
  }
}
