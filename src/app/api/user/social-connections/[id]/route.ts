import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const connectionId = params.id

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      )
    }

    // Check if connection exists and belongs to user
    const connection = await prisma.socialConnection.findFirst({
      where: {
        id: connectionId,
        userId: session.user.id
      }
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    // Delete the connection
    await prisma.socialConnection.delete({
      where: { id: connectionId }
    })

    return NextResponse.json({
      success: true,
      message: 'Social account disconnected successfully'
    })

  } catch (error) {
    console.error('Delete social connection error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect social account' },
      { status: 500 }
    )
  }
} 