import { NextRequest, NextResponse } from 'next/server';
import PayOS from '@payos/node';
import { prisma } from '@/lib/prisma';

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID!,
  process.env.PAYOS_API_KEY!,
  process.env.PAYOS_CHECKSUM_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const webhookData = JSON.parse(body);

    // Verify webhook signature for security
    const isValidSignature = payOS.verifyPaymentWebhookData(webhookData);

    if (!isValidSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const { data } = webhookData;
    const orderCode = data.orderCode;
    const status = data.status;

    console.log('PayOS Webhook received:', { orderCode, status });

    // Handle different payment statuses
    switch (status) {
      case 'PAID':
        // Payment successful - update user tokens
        console.log(`Payment successful for order: ${orderCode}`);
        
        // Find payment record
        const payment = await (prisma as any).payment.findUnique({
          where: { orderCode: orderCode.toString() },
        });

        if (payment && payment.status === 'PENDING') {
          console.log(`Webhook processing payment ${payment.id}: ${payment.tokens} tokens to user ${payment.userId}`);
          
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

            // Use atomic transaction to prevent race conditions
            await prisma.$transaction(async (tx) => {
              // Try to update payment status atomically - only if still PENDING
              const updatedPayment = await (tx as any).payment.updateMany({
                where: { 
                  id: payment.id,
                  status: 'PENDING' // Critical: only update if still PENDING
                },
                data: { 
                  status: 'PAID',
                  payosData: data,
                },
              });

              // If no rows updated, payment was already processed
              if (updatedPayment.count === 0) {
                console.log(`⚠️ Webhook: Payment ${payment.id} already processed - updateMany returned 0 rows`);
                return; // Exit gracefully
              }

              // Update user tokens
              await tx.user.update({
                where: { id: payment.userId },
                data: userUpdateData,
              });

              // Create token transaction
              await tx.tokenTransaction.create({
                data: {
                  userId: payment.userId,
                  amount: payment.tokens,
                  type: 'PURCHASED',
                  description: `Purchased ${payment.packageType} package via webhook - orderCode:${payment.orderCode}`,
                },
              });
            });
            
            console.log(`✅ Webhook: Successfully processed payment ${payment.id}: Added ${payment.tokens} tokens to user ${payment.userId}`);
          } catch (error) {
            // Payment may have been processed by verify endpoint already
            console.log(`⚠️ Webhook: Payment ${payment.id} processing failed (may be already processed):`, error);
          }
        } else if (payment && payment.status === 'PAID') {
          console.log(`Payment ${payment.id} already processed with status: ${payment.status}`);
        } else {
          console.log(`Payment record not found for orderCode: ${orderCode}`);
        }
        break;

      case 'CANCELLED':
        console.log(`Payment cancelled for order: ${orderCode}`);
        // Handle cancelled payment
        break;

      case 'PENDING':
        console.log(`Payment pending for order: ${orderCode}`);
        // Handle pending payment
        break;

      default:
        console.log(`Unknown payment status: ${status} for order: ${orderCode}`);
    }

    // Return success response to PayOS
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('PayOS webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 