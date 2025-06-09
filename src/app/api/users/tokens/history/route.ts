import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get start and end of current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Get token transactions for current month
    const transactions = await prisma.tokenTransaction.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
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

    return NextResponse.json({
      success: true,
      totalEarned,
      totalUsed,
      transactions
    })

  } catch (error) {
    console.error('Get token history error:', error)
    return NextResponse.json(
      { error: 'Failed to get token history' },
      { status: 500 }
    )
  }
} 