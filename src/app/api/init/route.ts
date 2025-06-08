import { NextRequest, NextResponse } from 'next/server'
import { initializeDefaultData } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting database initialization...')
    
    // Initialize default templates and categories
    await initializeDefaultData()
    
    return NextResponse.json({
      success: true,
      message: 'Default data initialized successfully in PostgreSQL'
    })
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to initialize data',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST method to initialize default data',
    endpoint: '/api/init'
  })
} 