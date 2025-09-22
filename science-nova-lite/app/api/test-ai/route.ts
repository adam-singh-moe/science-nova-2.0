import { NextRequest, NextResponse } from 'next/server'
import { SimpleAI } from '@/lib/simple-ai'

export async function POST(req: NextRequest) {
  try {
    console.log('Testing AI system...')
    
    const ai = new SimpleAI()
    const status = await ai.getStatus()
    const isAvailable = await ai.isAvailable()
    
    console.log('AI Status:', status)
    console.log('AI Available:', isAvailable)
    
    if (!isAvailable) {
      return NextResponse.json({
        success: false,
        status,
        error: 'AI system not available'
      })
    }
    
    // Test a simple generation
    const response = await ai.generateText('Say "Hello! AI system is working properly."')
    
    return NextResponse.json({
      success: true,
      status,
      response,
      isAvailable
    })
    
  } catch (error) {
    console.error('AI test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}