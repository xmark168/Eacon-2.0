import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createTemplateUnlock, getTemplateUnlock, getUserUnlockedTemplates } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { templateId } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Check if template is already unlocked for this user
    const existingUnlock = await getTemplateUnlock(session.user.id, templateId)

    if (existingUnlock) {
      return NextResponse.json({
        success: true,
        message: 'Template already unlocked',
        alreadyUnlocked: true
      })
    }

    // Create new unlock record
    const unlock = await createTemplateUnlock({
      userId: session.user.id,
      templateId: templateId
    })

    console.log('🔓 Template unlocked:', templateId, 'for user:', session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Template unlocked successfully',
      unlock: {
        id: unlock.id,
        templateId: unlock.templateId,
        unlockedAt: unlock.unlockedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Template unlock error:', error)
    return NextResponse.json(
      { error: 'Failed to unlock template' },
      { status: 500 }
    )
  }
}

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
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      // Get all unlocked templates for user
      const unlockedTemplates = await getUserUnlockedTemplates(session.user.id)

      return NextResponse.json({
        success: true,
        unlockedTemplates: unlockedTemplates
      })
    }

    // Check specific template unlock status
    const unlock = await getTemplateUnlock(session.user.id, templateId)

    return NextResponse.json({
      success: true,
      isUnlocked: !!unlock,
      unlockedAt: unlock?.unlockedAt?.toISOString()
    })

  } catch (error) {
    console.error('Template unlock check error:', error)
    return NextResponse.json(
      { error: 'Failed to check unlock status' },
      { status: 500 }
    )
  }
} 