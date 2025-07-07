import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const accountType = searchParams.get('accountType') || 'all';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (accountType !== 'all') {
      where.accountType = accountType.toUpperCase();
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get users with stats
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          tokens: true,
          accountType: true,
          planExpiresAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              generatedImages: true,
              payments: true,
              tokenTransactions: true
            }
          }
        },
        skip,
        take: limit,
        orderBy
      }),
      prisma.user.count({ where })
    ]);

    // Format users data
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name || 'Chưa đặt tên',
      email: user.email,
      image: user.image,
      tokens: user.tokens,
      accountType: user.accountType,
      planExpiresAt: user.planExpiresAt?.toISOString() || null,
      totalImages: user._count.generatedImages,
      totalPayments: user._count.payments,
      totalTransactions: user._count.tokenTransactions,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      isActive: user.planExpiresAt ? new Date(user.planExpiresAt) > new Date() : user.accountType === 'FREE'
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Không thể lấy danh sách người dùng', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, tokens, accountType, planExpiresAt } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID là bắt buộc' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (tokens !== undefined) {
      updateData.tokens = parseInt(tokens);
    }
    
    if (accountType) {
      updateData.accountType = accountType.toUpperCase();
    }
    
    if (planExpiresAt) {
      updateData.planExpiresAt = new Date(planExpiresAt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        tokens: true,
        accountType: true,
        planExpiresAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        planExpiresAt: updatedUser.planExpiresAt?.toISOString() || null,
        updatedAt: updatedUser.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json(
      { error: 'Không thể cập nhật người dùng', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID là bắt buộc' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa người dùng thành công'
    });

  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json(
      { error: 'Không thể xóa người dùng', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 