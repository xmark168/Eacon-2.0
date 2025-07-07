import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const dateFilter = searchParams.get('dateFilter') || 'all';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    if (status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      switch (dateFilter) {
        case 'today':
          where.createdAt = {
            gte: new Date(now.setHours(0, 0, 0, 0))
          };
          break;
        case 'week':
          where.createdAt = {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          };
          break;
        case 'month':
          where.createdAt = {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          };
          break;
      }
    }

    // Get payments with user info
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.count({ where })
    ]);

    // Format payments data
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      userId: payment.userId,
      userEmail: payment.user?.email || 'Unknown',
      userName: payment.user?.name || 'Unknown User',
      amount: payment.amount || 0,
      originalAmount: payment.originalAmount || payment.amount,
      discountPercent: payment.discountPercent || 0,
      currency: 'VND',
      tokens: payment.tokens || 0,
      packageType: payment.packageType,
      accountUpgrade: payment.accountUpgrade,
      status: payment.status.toLowerCase(),
      paymentMethod: payment.paymentMethod || 'PayOS',
      orderCode: payment.orderCode,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString()
    }));

    return NextResponse.json({
      payments: formattedPayments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Admin payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
} 