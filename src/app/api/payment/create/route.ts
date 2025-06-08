import { NextRequest, NextResponse } from 'next/server';
import PayOS from '@payos/node';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateDiscount, getAccountUpgradeFromPackage, type AccountType } from '@/lib/discounts';

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID!,
  process.env.PAYOS_API_KEY!,
  process.env.PAYOS_CHECKSUM_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageType, tokens, amount } = await request.json();

    // Validate input
    if (!packageType || !tokens || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user's current account type
    const user = await prisma.user.findUnique({
      where: { id: session.user.id! },
      select: { accountType: true }
    });

    const currentAccountType = (user?.accountType || 'FREE') as AccountType;
    
    // Calculate discount based on current account type
    const discountInfo = calculateDiscount(amount, currentAccountType);
    const finalAmount = discountInfo.discountedAmount;
    
    // Check if this purchase upgrades account
    const accountUpgrade = getAccountUpgradeFromPackage(packageType);

    // Generate unique order code
    const orderCode = Date.now();

    const paymentData = {
      orderCode: orderCode,
      amount: finalAmount,
      description: `Token purchase`,
      items: [
        {
          name: packageType.substring(0, 25),
          quantity: 1,
          price: finalAmount,
        },
      ],
      returnUrl: `${process.env.NEXTAUTH_URL}/payment/success`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/payment/cancel`,
      buyerName: (session.user?.name || 'Customer').substring(0, 25),
      buyerEmail: session.user?.email || '',
    };

    const paymentLinkResponse = await payOS.createPaymentLink(paymentData);

    // Store payment info in database
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id!,
        orderCode: orderCode.toString(),
        packageType,
        tokens,
        amount: finalAmount,
        originalAmount: discountInfo.originalAmount,
        discountPercent: discountInfo.discountPercent,
        accountUpgrade,
        status: 'PENDING',
        payosData: paymentLinkResponse,
      },
    });

    return NextResponse.json({
      success: true,
      data: paymentLinkResponse,
      orderCode,
    });

  } catch (error) {
    console.error('PayOS payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
} 