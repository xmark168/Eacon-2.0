import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user's generation history from PostgreSQL
    const images = await prisma.generatedImage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        template: {
          select: {
            title: true,
            cost: true
          }
        }
      }
    })

    // Format as history data
    const history = images.map(img => ({
      id: img.id,
      imageUrl: img.imageUrl,
      prompt: img.prompt,
      settings: {
        size: img.size,
        style: img.style || 'realistic',
        platform: img.platform || 'instagram'
      },
      createdAt: img.createdAt.toISOString(),
      cost: img.template?.cost || 25 // Default cost or from template
    }))

    return NextResponse.json({
      success: true,
      history: history,
      total: history.length
    })

  } catch (error) {
    console.error('Fetch history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch generation history' },
      { status: 500 }
    )
  }
} 