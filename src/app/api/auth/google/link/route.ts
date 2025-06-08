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

    const { action, googleEmail, googleId, accessToken } = await request.json()

    if (action === 'link') {
      // Check if Google account is already linked to another user
      const existingConnection = await prisma.socialConnection.findFirst({
        where: {
          platform: 'GOOGLE',
          platformId: googleId
        }
      })

      if (existingConnection && existingConnection.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'This Google account is already linked to another user' },
          { status: 400 }
        )
      }

      // Link Google account
      const connection = await prisma.socialConnection.upsert({
        where: {
          userId_platform: {
            userId: session.user.id,
            platform: 'GOOGLE'
          }
        },
        update: {
          platformId: googleId,
          accessToken: accessToken || '',
          isActive: true
        },
        create: {
          userId: session.user.id,
          platform: 'GOOGLE',
          platformId: googleId,
          accessToken: accessToken || '',
          isActive: true
        }
      })

      console.log(`✅ Google account linked for user ${session.user.id}: ${googleEmail}`)

      return NextResponse.json({
        success: true,
        message: 'Google account linked successfully',
        connection: {
          platform: connection.platform,
          platformId: connection.platformId,
          isActive: connection.isActive,
          createdAt: connection.createdAt
        }
      })

    } else if (action === 'unlink') {
      // Unlink Google account
      await prisma.socialConnection.updateMany({
        where: {
          userId: session.user.id,
          platform: 'GOOGLE'
        },
        data: {
          isActive: false
        }
      })

      console.log(`✅ Google account unlinked for user ${session.user.id}`)

      return NextResponse.json({
        success: true,
        message: 'Google account unlinked successfully'
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "link" or "unlink"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Google account link error:', error)
    return NextResponse.json(
      { error: 'Failed to process Google account linking' },
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

    // Get linked Google accounts
    const connections = await prisma.socialConnection.findMany({
      where: {
        userId: session.user.id,
        platform: 'GOOGLE',
        isActive: true
      },
      select: {
        id: true,
        platform: true,
        platformId: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      connections
    })

  } catch (error) {
    console.error('Get Google connections error:', error)
    return NextResponse.json(
      { error: 'Failed to get Google connections' },
      { status: 500 }
    )
  }
} 