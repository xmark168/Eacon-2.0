import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { imageUrl, prompt, caption, style, platform, scheduledAt } = await request.json()

    if (!imageUrl || !platform || !scheduledAt) {
      return NextResponse.json(
        { error: 'Image URL, platform, and scheduled time are required' },
        { status: 400 }
      )
    }

    const scheduledDate = new Date(scheduledAt)
    
    // Validate scheduled time is in the future
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    console.log('Scheduling post for:', { platform, scheduledAt, imageUrl, caption })

    // Store scheduled post in database using Prisma
    const scheduledPost = await prisma.scheduledPost.create({
      data: {
        userId: session.user.id,
        imageUrl,
        prompt: prompt || null,
        caption: caption || null,
        style: style || null,
        platform,
        scheduledAt: scheduledDate,
        status: 'PENDING'
      }
    })

    console.log('Scheduled post created:', scheduledPost.id)

    return NextResponse.json({
      success: true,
      message: `Post scheduled for ${scheduledDate.toLocaleString()}!`,
      scheduledPost: {
        id: scheduledPost.id,
        platform: scheduledPost.platform,
        scheduledAt: scheduledPost.scheduledAt,
        status: scheduledPost.status
      }
    })

  } catch (error) {
    console.error('Schedule post error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to schedule post',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get scheduled posts for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's scheduled posts from database
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
      posts: scheduledPosts.map(post => ({
        id: post.id,
        imageUrl: post.imageUrl,
        prompt: post.prompt,
        caption: post.caption,
        style: post.style,
        platform: post.platform,
        scheduledAt: post.scheduledAt,
        status: post.status,
        createdAt: post.createdAt,
        publishedAt: post.publishedAt
      }))
    })

  } catch (error) {
    console.error('Get scheduled posts error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get scheduled posts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 