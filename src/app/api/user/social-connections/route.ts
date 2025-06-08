import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's social connections
    const connections = await prisma.socialConnection.findMany({
      where: { 
        userId: session.user.id,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedConnections = connections.map(conn => ({
      id: conn.id,
      platform: conn.platform,
      platformId: conn.platformId,
      username: conn.platformId, // Use platformId as username for now
      isActive: conn.isActive,
      connectedAt: conn.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      connections: formattedConnections
    })

  } catch (error) {
    console.error('Get social connections error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social connections' },
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

    const { platform, platformId, accessToken, refreshToken } = await request.json()

    if (!platform || !platformId) {
      return NextResponse.json(
        { error: 'Platform and platform ID are required' },
        { status: 400 }
      )
    }

    // Check if connection already exists
    const existingConnection = await prisma.socialConnection.findFirst({
      where: {
        userId: session.user.id,
        platform: platform.toUpperCase()
      }
    })

    if (existingConnection) {
      // Update existing connection
      const updatedConnection = await prisma.socialConnection.update({
        where: { id: existingConnection.id },
        data: {
          platformId,
          accessToken,
          refreshToken,
          isActive: true,
          createdAt: new Date() // Update connection time
        }
      })

      return NextResponse.json({
        success: true,
        connection: {
          id: updatedConnection.id,
          platform: updatedConnection.platform,
          platformId: updatedConnection.platformId,
          username: updatedConnection.platformId,
          isActive: updatedConnection.isActive,
          connectedAt: updatedConnection.createdAt.toISOString()
        },
        message: 'Social account reconnected successfully'
      })
    } else {
      // Create new connection
      const newConnection = await prisma.socialConnection.create({
        data: {
          userId: session.user.id,
          platform: platform.toUpperCase(),
          platformId,
          accessToken,
          refreshToken,
          isActive: true
        }
      })

      return NextResponse.json({
        success: true,
        connection: {
          id: newConnection.id,
          platform: newConnection.platform,
          platformId: newConnection.platformId,
          username: newConnection.platformId,
          isActive: newConnection.isActive,
          connectedAt: newConnection.createdAt.toISOString()
        },
        message: 'Social account connected successfully'
      })
    }

  } catch (error) {
    console.error('Connect social account error:', error)
    return NextResponse.json(
      { error: 'Failed to connect social account' },
      { status: 500 }
    )
  }
} 