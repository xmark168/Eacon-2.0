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

    // Get all token transactions for the user
    const transactions = await prisma.tokenTransaction.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate totals
    const totalEarned = transactions
      .filter(t => t.type === 'EARNED' || t.type === 'PURCHASED')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const totalUsed = transactions
      .filter(t => t.type === 'USED')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const totalAdjustments = transactions
      .filter(t => t.type === 'ADJUSTMENT')
      .reduce((sum, t) => sum + t.amount, 0)

    return NextResponse.json({
      success: true,
      totalEarned,
      totalUsed,
      totalAdjustments,
      netBalance: totalEarned - totalUsed + totalAdjustments,
      transactions
    })

  } catch (error) {
    console.error('Get all token history error:', error)
    return NextResponse.json(
      { error: 'Failed to get token history' },
      { status: 500 }
    )
  }
} 