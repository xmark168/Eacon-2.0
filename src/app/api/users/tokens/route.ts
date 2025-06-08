import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { amount, type, description } = await request.json()

    if (!amount || !type) {
      return NextResponse.json(
        { error: 'Amount and type are required' },
        { status: 400 }
      )
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tokens: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate new token balance
    let newBalance: number
    if (type === 'USED') {
      newBalance = user.tokens - Math.abs(amount)
      if (newBalance < 0) {
        return NextResponse.json(
          { error: 'Insufficient tokens' },
          { status: 400 }
        )
      }
    } else {
      newBalance = user.tokens + Math.abs(amount)
    }

    // Update user tokens and create transaction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user tokens
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: { tokens: newBalance }
      })

      // Create token transaction record
      const transaction = await tx.tokenTransaction.create({
        data: {
          userId: session.user.id,
          amount: type === 'USED' ? -Math.abs(amount) : Math.abs(amount),
          type: type,
          description: description || `${type === 'USED' ? 'Spent' : 'Earned'} ${Math.abs(amount)} tokens`
        }
      })

      return { user: updatedUser, transaction }
    })

    return NextResponse.json({
      success: true,
      newBalance: result.user.tokens,
      transaction: result.transaction
    })

  } catch (error) {
    console.error('Update tokens error:', error)
    return NextResponse.json(
      { error: 'Failed to update tokens' },
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

    // Get user's current token balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tokens: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      tokens: user.tokens
    })

  } catch (error) {
    console.error('Get tokens error:', error)
    return NextResponse.json(
      { error: 'Failed to get tokens' },
      { status: 500 }
    )
  }
} 