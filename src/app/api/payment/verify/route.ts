import { NextRequest, NextResponse } from 'next/server';
import PayOS from '@payos/node';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'

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

    const { orderCode } = await request.json();

    if (!orderCode) {
      return NextResponse.json(
        { error: 'Order code is required' },
        { status: 400 }
      );
    }

    // Verify payment with PayOS
    const paymentInfo = await payOS.getPaymentLinkInformation(orderCode);

    if (paymentInfo.status === 'PAID') {
      // Find payment record  
      const payment = await (prisma as any).payment.findUnique({
        where: { orderCode: orderCode.toString() },
      });

      if (!payment) {
        return NextResponse.json(
          { error: 'Payment record not found' },
          { status: 404 }
        );
      }

      // Check if payment already processed to prevent duplicate token addition
      if (payment.status === 'PAID') {
        console.log(`Payment ${payment.id} already processed with status: PAID`);
        return NextResponse.json({
          success: true,
          status: 'PAID',
          message: 'Payment already processed',
          data: paymentInfo,
        });
      }

      console.log(`Processing payment ${payment.id} with status: ${payment.status} for orderCode: ${payment.orderCode}`);

      // Process tokens only if payment status is still PENDING
      // Use atomic update with WHERE condition to prevent race conditions
      try {
        // Prepare user update data
        const userUpdateData: any = {
          tokens: { increment: payment.tokens },
        };

        // If payment includes account upgrade, update account type
        if (payment.accountUpgrade) {
          userUpdateData.accountType = payment.accountUpgrade;
          // Set plan expiration for paid plans (30 days from now)
          userUpdateData.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }

        // Use atomic transaction with conditional update to prevent race conditions
        const result = await prisma.$transaction(async (tx) => {
          // Try to update payment status atomically - only if still PENDING
          const updatedPayment = await (tx as any).payment.updateMany({
            where: { 
              id: payment.id,
              status: 'PENDING' // Critical: only update if still PENDING
            },
            data: { 
              status: 'PAID',
              payosData: paymentInfo,
            },
          });

          // If no rows updated, payment was already processed
          if (updatedPayment.count === 0) {
            console.log(`⚠️ Payment ${payment.id} already processed - updateMany returned 0 rows`);
            throw new Error('ALREADY_PROCESSED');
          }

          // Update user tokens
          const updatedUser = await tx.user.update({
            where: { id: session.user.id! },
            data: userUpdateData,
          });

          // Create token transaction
          const tokenTransaction = await tx.tokenTransaction.create({
            data: {
              userId: session.user.id!,
              amount: payment.tokens,
              type: 'PURCHASED',
              description: `Purchased ${payment.packageType} package (verified) - orderCode:${payment.orderCode}`,
            },
          });

          return { updatedUser, tokenTransaction };
        });

        console.log(`✅ Payment verified and processed: ${payment.tokens} tokens added to user ${session.user.id}`);

      } catch (error) {
        // If payment was already processed, return success anyway
        if (error instanceof Error && error.message === 'ALREADY_PROCESSED') {
          console.log(`⚠️ Payment ${payment.id} already processed by webhook or concurrent request`);
          return NextResponse.json({
            success: true,
            status: 'PAID',
            message: 'Payment already processed',
            data: paymentInfo,
          });
        }
        
        console.error(`❌ Payment processing error for ${payment.id}:`, error);
        throw error;
      }
      
      return NextResponse.json({
        success: true,
        status: 'PAID',
        data: paymentInfo,
      });

    } else {
      return NextResponse.json({
        success: false,
        status: paymentInfo.status,
        data: paymentInfo,
      });
    }

  } catch (error) {
    console.error('PayOS payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}