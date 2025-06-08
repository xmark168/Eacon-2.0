import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface CreateScheduledPostRequest {
  content: string
  imageUrl?: string
  platform: string
  scheduledAt: string
  hashtags?: string[]
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all scheduled posts for the user
    const scheduledPosts = await prisma.scheduledPost.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      posts: scheduledPosts
    })

  } catch (error) {
    console.error('Get scheduled posts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateScheduledPostRequest = await request.json()
    const { content, imageUrl, platform, scheduledAt, hashtags } = body

    if (!content || !platform || !scheduledAt) {
      return NextResponse.json(
        { error: 'Content, platform, and scheduled time are required' },
        { status: 400 }
      )
    }

    // Create scheduled post
    const scheduledPost = await prisma.scheduledPost.create({
      data: {
        userId: session.user.id,
        imageUrl: imageUrl || null,
        prompt: content, // Store content as prompt for now
        caption: content,
        style: 'realistic', // Default style
        platform,
        scheduledAt: new Date(scheduledAt),
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      post: scheduledPost,
      message: 'Post scheduled successfully'
    })

  } catch (error) {
    console.error('Create scheduled post error:', error)
    return NextResponse.json(
      { error: 'Failed to schedule post' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId, ...updates } = await request.json()

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Update scheduled post
    const updatedPost = await prisma.scheduledPost.update({
      where: {
        id: postId,
        userId: session.user.id
      },
      data: {
        ...updates,
        ...(updates.scheduledAt && { scheduledAt: new Date(updates.scheduledAt) }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: 'Post updated successfully'
    })

  } catch (error) {
    console.error('Update scheduled post error:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Delete scheduled post
    await prisma.scheduledPost.delete({
      where: {
        id: postId,
        userId: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    })

  } catch (error) {
    console.error('Delete scheduled post error:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
} 