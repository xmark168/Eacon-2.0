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

// SECURITY: Server-side token calculation only
const TOKEN_RATE = 400; // 400 tokens per 1 USD - FIXED RATE
const VND_RATE = 26000; // 1 USD = 26,000 VND - FIXED RATE

// Calculate tokens from USD amount - SERVER SIDE ONLY
function calculateTokensFromUSD(amountUSD: number): number {
  // Security validations
  if (amountUSD < 1 || amountUSD > 100) {
    throw new Error('Amount must be between $1 and $100 USD');
  }
  
  if (!Number.isFinite(amountUSD) || amountUSD !== Math.floor(amountUSD)) {
    throw new Error('Amount must be a valid integer');
  }
  
  return amountUSD * TOKEN_RATE;
}

// Convert USD to VND - SERVER SIDE ONLY  
function convertUSDtoVND(amountUSD: number): number {
  return Math.floor(amountUSD * VND_RATE);
}

// Account upgrade detection (optional)
function getAccountUpgrade(packageType: string): string | null {
  const upgrades: Record<string, string> = {
    'PRO Monthly': 'PRO',
    'PRO Annual': 'PRO', 
    'Business Monthly': 'BUSINESS',
    'Business Annual': 'BUSINESS',
    'Enterprise Monthly': 'ENTERPRISE',
    'Enterprise Annual': 'ENTERPRISE',
  };
  return upgrades[packageType] || null;
}

// Main secure handler
const secureHandler = withSecurity(
  async (request: NextRequest, context: any) => {
    const { user, validatedData } = context;
    const { packageType, amountUSD } = validatedData;

    try {
      // Audit log payment attempt
      await auditLog('PAYMENT_CREATE_ATTEMPT', user.id, {
        packageType,
        amountUSD,
        timestamp: Date.now()
      }, request);

      // SECURITY: Server calculates tokens - client cannot manipulate
      const tokens = calculateTokensFromUSD(amountUSD);
      const amountVND = convertUSDtoVND(amountUSD);
      
      console.log(`🔒 SECURE CALCULATION: $${amountUSD} USD = ${tokens} tokens = ${amountVND.toLocaleString()} VND`);

      // Get user data for audit
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { 
          tokens: true,
          email: true,
          name: true,
          createdAt: true
        }
      });

      if (!userData) {
        await auditLog('PAYMENT_USER_NOT_FOUND', user.id, {}, request);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Fraud detection: Check recent payment attempts
      const recentTransactions = await prisma.tokenTransaction.count({
        where: {
          userId: user.id,
          type: 'PURCHASED',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      if (recentTransactions >= 10) {
        await auditLog('PAYMENT_SUSPICIOUS_ACTIVITY', user.id, {
          recentTransactionCount: recentTransactions
        }, request);
        
        return NextResponse.json(
          { error: 'Too many payment attempts. Please contact support.' },
          { status: 429 }
        );
      }

      // Generate secure order code
      const orderCode = Date.now() + Math.floor(Math.random() * 1000);
      
      // Account upgrade check
      const accountUpgrade = getAccountUpgrade(packageType);

      // Prepare payment data for PayOS
      const paymentData = {
        orderCode: orderCode,
        amount: amountVND, // Send VND to PayOS
        description: `${tokens} tokens - ${packageType}`.substring(0, 25),
        items: [
          {
            name: `${tokens} tokens`.substring(0, 25),
            quantity: 1,
            price: amountVND,
          },
        ],
        returnUrl: `${process.env.NEXTAUTH_URL}/payment/success`,
        cancelUrl: `${process.env.NEXTAUTH_URL}/payment/cancel`,
        buyerName: (userData.name || 'Customer').substring(0, 25),
        buyerEmail: userData.email.substring(0, 50),
      };

      // Create payment link
      let paymentLinkResponse;
      try {
        paymentLinkResponse = await payOS.createPaymentLink(paymentData);
      } catch (payosError: any) {
        await auditLog('PAYMENT_PAYOS_ERROR', user.id, {
          error: payosError.message,
          orderCode,
          amountUSD,
          amountVND
        }, request);
        
        console.error('PayOS API error:', payosError);
        return NextResponse.json(
          { error: 'Payment service temporarily unavailable' },
          { status: 503 }
        );
      }

      // Store payment tracking with server-calculated values
      await prisma.tokenTransaction.create({
        data: {
          userId: user.id,
          amount: 0, // Will be updated on payment verification
          type: 'PURCHASED',
          description: `Payment pending - orderCode:${orderCode} - ${packageType} - USD:${amountUSD} - tokens:${tokens} - VND:${amountVND}`,
        }
      });

      // Audit log successful payment creation
      await auditLog('PAYMENT_CREATED', user.id, {
        orderCode,
        amountUSD,
        amountVND,
        tokens,
        packageType,
        accountUpgrade,
        calculationSecure: true
      }, request);

      return NextResponse.json({
        success: true,
        data: paymentLinkResponse,
        orderCode,
        // Return calculated values for client display
        calculation: {
          amountUSD,
          amountVND,
          tokens,
          rate: `${TOKEN_RATE} tokens per $1 USD`,
          serverCalculated: true
        }
      });

    } catch (error: any) {
      // Audit log error
      await auditLog('PAYMENT_CREATE_ERROR', user.id, {
        error: error.message,
        amountUSD: amountUSD || 'unknown',
        stack: error.stack?.substring(0, 500)
      }, request);

      console.error('Payment creation error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create payment. Please try again.' },
        { status: 500 }
      );
    }
  },
  {
    requireAuth: true,
    rateLimit: 'PAYMENT',
    validateInput: 'tokenPurchase',
    allowedMethods: ['POST']
  }
);

export const POST = secureHandler; 