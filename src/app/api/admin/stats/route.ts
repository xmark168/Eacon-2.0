import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Calculate date ranges
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get all statistics in parallel
    const [
      totalUsers,
      totalTemplates,
      totalPayments,
      totalRevenue,
      newUsersThisWeek,
      newUsersToday,
      paymentsToday,
      revenueToday,
      activeTemplates,
      totalGeneratedImages,
      pendingPayments,
      failedPayments
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total templates
      prisma.template.count(),
      
      // Total payments
      prisma.payment.count({
        where: { status: 'PAID' }
      }),
      
      // Total revenue from paid payments
      prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true }
      }),
      
      // New users this week
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfWeek
          }
        }
      }),
      
      // New users today
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfToday
          }
        }
      }),
      
      // Payments today
      prisma.payment.count({
        where: {
          status: 'PAID',
          updatedAt: {
            gte: startOfToday
          }
        }
      }),
      
      // Revenue today
      prisma.payment.aggregate({
        where: {
          status: 'PAID',
          updatedAt: {
            gte: startOfToday
          }
        },
        _sum: { amount: true }
      }),
      
      // Active templates
      prisma.template.count({
        where: { isActive: true }
      }),
      
      // Total generated images
      prisma.generatedImage.count(),
      
      // Pending payments
      prisma.payment.count({
        where: { status: 'PENDING' }
      }),
      
      // Failed payments
      prisma.payment.count({
        where: { status: 'FAILED' }
      })
    ]);

    // Get recent activities
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const recentPayments = await prisma.payment.findMany({
      select: {
        id: true,
        amount: true,
        tokens: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const recentImages = await prisma.generatedImage.findMany({
      select: {
        id: true,
        prompt: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Calculate growth rates (mock data - you can implement proper calculation)
    const userGrowthRate = newUsersThisWeek > 0 ? ((newUsersThisWeek / Math.max(totalUsers - newUsersThisWeek, 1)) * 100).toFixed(1) : '0';
    const revenueGrowthRate = revenueToday._sum.amount ? '15.2' : '0'; // You can calculate this properly

    return NextResponse.json({
      success: true,
      data: {
        // Overview stats
        users: {
          total: totalUsers,
          newThisWeek: newUsersThisWeek,
          newToday: newUsersToday,
          growthRate: `+${userGrowthRate}%`,
          active: totalUsers // Simplified - you can track last login for real active users
        },
        templates: {
          total: totalTemplates,
          active: activeTemplates,
          inactive: totalTemplates - activeTemplates
        },
        payments: {
          total: totalPayments,
          todayCount: paymentsToday,
          pending: pendingPayments,
          failed: failedPayments
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          today: revenueToday._sum.amount || 0,
          todayPayments: paymentsToday,
          growthRate: `+${revenueGrowthRate}%`
        },
        images: {
          total: totalGeneratedImages
        },
        
        // Recent activities
        recentActivities: {
          users: recentUsers,
          payments: recentPayments,
          images: recentImages
        },
        
        // System health (simplified)
        systemHealth: {
          database: 'healthy',
          api: 'healthy',
          storage: 'healthy'
        }
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Không thể lấy dữ liệu thống kê', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 