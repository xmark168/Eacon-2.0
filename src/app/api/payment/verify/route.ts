import { NextRequest, NextResponse } from 'next/server';
import PayOS from '@payos/node';
import { withSecurity, auditLog } from '@/lib/security';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID!,
  process.env.PAYOS_API_KEY!,
  process.env.PAYOS_CHECKSUM_KEY!
);

// SECURITY: Same constants as payment creation
const TOKEN_RATE = 400; // 400 tokens per 1 USD
const VND_RATE = 26050; // 1 USD = 26,050 VND

// Parse payment data from tracking description
function parsePaymentData(description: string): {
  amountUSD: number;
  tokens: number;
  amountVND: number;
  orderCode: string;
} | null {
  try {
    const usdMatch = description.match(/USD:(\d+)/);
    const tokensMatch = description.match(/tokens:(\d+)/);
    const vndMatch = description.match(/VND:(\d+)/);
    const orderCodeMatch = description.match(/orderCode:(\d+)/);
    
    if (!usdMatch || !tokensMatch || !vndMatch || !orderCodeMatch) {
      return null;
    }
    
    return {
      amountUSD: parseInt(usdMatch[1]),
      tokens: parseInt(tokensMatch[1]),
      amountVND: parseInt(vndMatch[1]),
      orderCode: orderCodeMatch[1]
    };
  } catch {
    return null;
  }
}

// Validate payment amounts match expected calculations
function validatePaymentAmounts(
  paidVND: number,
  expectedUSD: number,
  expectedTokens: number,
  expectedVND: number
): { valid: boolean; reason?: string } {
  // Check if paid amount matches expected VND amount (allow small rounding differences)
  const vndDifference = Math.abs(paidVND - expectedVND);
  if (vndDifference > 100) { // Allow 100 VND difference for rounding
    return {
      valid: false,
      reason: `Amount mismatch: paid ${paidVND} VND, expected ${expectedVND} VND`
    };
  }
  
  // Verify server-side calculation integrity
  const calculatedTokens = expectedUSD * TOKEN_RATE;
  const calculatedVND = expectedUSD * VND_RATE;
  
  if (calculatedTokens !== expectedTokens) {
    return {
      valid: false,
      reason: `Token calculation mismatch: calculated ${calculatedTokens}, expected ${expectedTokens}`
    };
  }
  
  if (Math.abs(calculatedVND - expectedVND) > 100) {
    return {
      valid: false,
      reason: `VND calculation mismatch: calculated ${calculatedVND}, expected ${expectedVND}`
    };
  }
  
  return { valid: true };
}

// Main secure handler
const secureHandler = withSecurity(
  async (request: NextRequest, context: any) => {
    const { user } = context;

    try {
      const { orderCode } = await request.json();

      if (!orderCode) {
        await auditLog('PAYMENT_VERIFY_INVALID_INPUT', user.id, {
          missing: 'orderCode'
        }, request);
        
        return NextResponse.json(
          { error: 'Order code is required' },
          { status: 400 }
        );
      }

      // Audit log verification attempt
      await auditLog('PAYMENT_VERIFY_ATTEMPT', user.id, {
        orderCode,
        timestamp: Date.now()
      }, request);

      // Get payment info from PayOS
      let paymentInfo;
      try {
        paymentInfo = await payOS.getPaymentLinkInformation(orderCode);
      } catch (payosError: any) {
        await auditLog('PAYMENT_VERIFY_PAYOS_ERROR', user.id, {
          orderCode,
          error: payosError.message
        }, request);
        
        console.error('PayOS verification error:', payosError);
        return NextResponse.json(
          { error: 'Payment verification failed' },
          { status: 500 }
        );
      }

      // Validate payment data
      if (!paymentInfo || typeof paymentInfo !== 'object') {
        await auditLog('PAYMENT_VERIFY_INVALID_RESPONSE', user.id, {
          orderCode,
          paymentInfo: typeof paymentInfo
        }, request);
        
        return NextResponse.json(
          { error: 'Invalid payment information' },
          { status: 400 }
        );
      }

      // Check if payment was successful
      if (paymentInfo.status === 'PAID') {
        // Find payment tracking record
        const existingTransaction = await prisma.tokenTransaction.findFirst({
          where: {
            userId: user.id,
            description: {
              contains: `orderCode:${orderCode}`
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        if (!existingTransaction) {
          await auditLog('PAYMENT_VERIFY_NO_RECORD', user.id, {
            orderCode
          }, request);
          
          return NextResponse.json(
            { error: 'Payment record not found' },
            { status: 404 }
          );
        }

        // Check if already processed
        if (existingTransaction.amount > 0) {
          await auditLog('PAYMENT_VERIFY_ALREADY_PROCESSED', user.id, {
            orderCode,
            transactionId: existingTransaction.id
          }, request);
          
          return NextResponse.json({
            success: true,
            status: 'PAID',
            message: 'Payment already processed',
            data: paymentInfo,
          });
        }

        // Parse expected payment data from tracking
        const expectedData = parsePaymentData(existingTransaction.description || '');
        if (!expectedData) {
          await auditLog('PAYMENT_VERIFY_PARSE_ERROR', user.id, {
            orderCode,
            description: existingTransaction.description
          }, request);
          
          return NextResponse.json(
            { error: 'Unable to parse payment data' },
            { status: 400 }
          );
        }

        // SECURITY: Validate actual paid amount against expected
        const validation = validatePaymentAmounts(
          paymentInfo.amount || 0,
          expectedData.amountUSD,
          expectedData.tokens,
          expectedData.amountVND
        );

        if (!validation.valid) {
          await auditLog('PAYMENT_VERIFY_AMOUNT_MISMATCH', user.id, {
            orderCode,
            paidAmount: paymentInfo.amount,
            expectedAmount: expectedData.amountVND,
            reason: validation.reason,
            suspiciousActivity: true
          }, request);
          
          return NextResponse.json(
            { error: `Payment amount verification failed: ${validation.reason}` },
            { status: 400 }
          );
        }

        console.log(`🔒 PAYMENT VERIFIED: User paid ${paymentInfo.amount} VND for ${expectedData.tokens} tokens`);

        // Process payment atomically
        try {
          await prisma.$transaction(async (tx) => {
            // Update user tokens with verified amount
            await tx.user.update({
              where: { id: user.id },
              data: { tokens: { increment: expectedData.tokens } }
            });

            // Update tracking transaction - ONLY update, don't create duplicate
            await tx.tokenTransaction.update({
              where: { id: existingTransaction.id },
              data: { 
                amount: expectedData.tokens,
                description: `Payment verified - orderCode:${orderCode} - ${expectedData.tokens} tokens - $${expectedData.amountUSD} USD - VERIFIED - PAID:${paymentInfo.amount}VND`
              }
            });
          });

          // Audit log successful verification
          await auditLog('PAYMENT_VERIFY_SUCCESS', user.id, {
            orderCode,
            tokenAmount: expectedData.tokens,
            amountUSD: expectedData.amountUSD,
            paidVND: paymentInfo.amount,
            verificationSecure: true
          }, request);

          console.log(`✅ Payment verified: ${expectedData.tokens} tokens added to user ${user.id}`);

          return NextResponse.json({
            success: true,
            status: 'PAID',
            tokensAdded: expectedData.tokens,
            amountUSD: expectedData.amountUSD,
            paidVND: paymentInfo.amount,
            rate: `${TOKEN_RATE} tokens per $1 USD`,
            data: paymentInfo,
          });

        } catch (dbError: any) {
          await auditLog('PAYMENT_VERIFY_DB_ERROR', user.id, {
            orderCode,
            error: dbError.message
          }, request);
          
          console.error('Database error during payment verification:', dbError);
          throw new Error('Failed to process payment');
        }

      } else {
        // Payment not successful
        await auditLog('PAYMENT_VERIFY_NOT_PAID', user.id, {
          orderCode,
          status: paymentInfo.status
        }, request);
        
        return NextResponse.json({
          success: false,
          status: paymentInfo.status,
          data: paymentInfo,
        });
      }

    } catch (error: any) {
      // Audit log error
      await auditLog('PAYMENT_VERIFY_ERROR', user.id, {
        error: error.message,
        stack: error.stack?.substring(0, 500)
      }, request);

      console.error('Payment verification error:', error);
      return NextResponse.json(
        { error: 'Failed to verify payment' },
        { status: 500 }
      );
    }
  },
  {
    requireAuth: true,
    rateLimit: 'PAYMENT',
    allowedMethods: ['POST']
  }
);

export const POST = secureHandler;