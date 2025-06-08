import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { updateImageCaption } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { caption } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    if (typeof caption !== 'string') {
      return NextResponse.json({ error: 'Caption must be a string' }, { status: 400 })
    }

    console.log('Updating caption for image:', id, 'Caption:', caption)

    // Update caption in database
    const success = await updateImageCaption(id, session.user.id, caption)

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Caption updated successfully',
        caption 
      })
    } else {
      return NextResponse.json({ error: 'Image not found or not authorized' }, { status: 404 })
    }

  } catch (error) {
    console.error('Update caption error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update caption' 
      }, 
      { status: 500 }
    )
  }
} 