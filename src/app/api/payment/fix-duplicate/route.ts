import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all paid payments for this user
    const payments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        status: 'PAID'
      },
      orderBy: { createdAt: 'asc' }
    });

    // Find all token transactions for this user
    const tokenTransactions = await prisma.tokenTransaction.findMany({
      where: {
        userId: session.user.id,
        type: 'PURCHASED'
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`User ${session.user.id} has ${payments.length} paid payments and ${tokenTransactions.length} purchase transactions`);

    // Check if there are duplicate transactions
    const duplicates = tokenTransactions.length - payments.length;
    
    if (duplicates > 0) {
      console.log(`Found ${duplicates} duplicate token transactions for user ${session.user.id}`);
      
      // Calculate tokens that should be removed
      let tokensToRemove = 0;
      const processedPayments = new Set();
      
      for (const transaction of tokenTransactions) {
        // Try to match transaction with payment
        const matchingPayment = payments.find(p => 
          p.packageType === transaction.description?.replace('Purchased ', '').replace(' package', '').replace(' via webhook', '') ||
          p.tokens === transaction.amount
        );
        
        if (matchingPayment && processedPayments.has(matchingPayment.id)) {
          // This is a duplicate
          tokensToRemove += transaction.amount;
          console.log(`Duplicate transaction found: ${transaction.amount} tokens for payment ${matchingPayment.id}`);
        } else if (matchingPayment) {
          processedPayments.add(matchingPayment.id);
        }
      }

      if (tokensToRemove > 0) {
        // Remove excess tokens from user account
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            tokens: { decrement: tokensToRemove }
          }
        });

        // Log the correction
        await prisma.tokenTransaction.create({
          data: {
            userId: session.user.id,
            amount: -tokensToRemove,
            type: 'ADJUSTMENT',
            description: 'Corrected duplicate token additions'
          }
        });

        return NextResponse.json({
          success: true,
          message: `Removed ${tokensToRemove} duplicate tokens from your account`,
          tokensRemoved: tokensToRemove,
          duplicateTransactions: duplicates
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'No duplicate tokens found',
      payments: payments.length,
      transactions: tokenTransactions.length
    });

  } catch (error) {
    console.error('Error fixing duplicate tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fix duplicate tokens' },
      { status: 500 }
    );
  }
} 