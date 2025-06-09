import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllTemplates, getTemplateById } from '@/lib/database'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (templateId) {
      // Get specific template
      const template = await getTemplateById(templateId)
      
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        template: template
      })
    }

    // Get all templates
    const templates = await getAllTemplates()

    return NextResponse.json({
      success: true,
      templates: templates,
      count: templates.length,
      message: 'Templates loaded from PostgreSQL database'
    })

  } catch (error) {
    console.error('Templates API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 