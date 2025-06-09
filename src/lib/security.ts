import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'

// Rate limiting store (In production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Security configuration
export const SECURITY_CONFIG = {
  // Rate limiting configurations
  RATE_LIMITS: {
    DEFAULT: { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 req/15min
    AUTH: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 req/15min
    PAYMENT: { maxRequests: 3, windowMs: 60 * 1000 }, // 3 req/min
    GENERATION: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 req/min
    TOKEN_OPERATIONS: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 req/min
  },
  
  // Input validation limits
  INPUT_LIMITS: {
    MAX_STRING_LENGTH: 10000,
    MAX_PROMPT_LENGTH: 2000,
    MAX_CAPTION_LENGTH: 500,
    MAX_FILE_SIZE: 8 * 1024 * 1024, // 8MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  },
  
  // Token operation limits
  TOKEN_LIMITS: {
    MAX_PURCHASE_TOKENS: 50000,
    MIN_PURCHASE_TOKENS: 100,
    MAX_GENERATION_COST: 100,
    MIN_USER_BALANCE: 0,
  }
}

// Rate limiting function
export function checkRateLimit(
  identifier: string, 
  config: { maxRequests: number; windowMs: number }
): { allowed: boolean; remainingRequests: number; resetTime: number } {
  const now = Date.now()
  const key = identifier
  
  const existing = rateLimitStore.get(key)
  
  // Clean expired entries
  if (existing && now > existing.resetTime) {
    rateLimitStore.delete(key)
  }
  
  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + config.windowMs }
  
  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remainingRequests: 0,
      resetTime: current.resetTime
    }
  }
  
  current.count++
  rateLimitStore.set(key, current)
  
  return {
    allowed: true,
    remainingRequests: config.maxRequests - current.count,
    resetTime: current.resetTime
  }
}

// Get client IP for rate limiting
export function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  return (
    cfConnectingIP ||
    realIP ||
    (forwardedFor ? forwardedFor.split(',')[0] : null) ||
    'unknown'
  ).trim()
}

// Authentication middleware
export async function authenticateRequest(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'Unauthorized',
      status: 401,
      user: null
    }
  }
  
  return {
    success: true,
    error: null,
    status: 200,
    user: session.user
  }
}

// Input validation schemas
export const ValidationSchemas = {
  // Token operations - SECURITY: Only accept amount, server calculates tokens
  tokenPurchase: z.object({
    packageType: z.string().min(1).max(100),
    amountUSD: z.number().min(1).max(100), // Only amount in USD, min $1, max $100
  }),
  
  // Image generation
  imageGeneration: z.object({
    prompt: z.string().min(1).max(SECURITY_CONFIG.INPUT_LIMITS.MAX_PROMPT_LENGTH),
    caption: z.string().max(SECURITY_CONFIG.INPUT_LIMITS.MAX_CAPTION_LENGTH).optional(),
    style: z.enum(['realistic', 'artistic', 'cartoon', 'fantasy', 'minimalist', 'vintage', 'modern', 'abstract']),
    platform: z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'pinterest', 'tiktok']),
    templateId: z.string().optional(),
    size: z.enum(['1024x1024', '1152x896', '1216x832', '1344x768', '1536x640', '640x1536', '768x1344', '832x1216', '896x1152']).optional(),
  }),
  
  // User profile updates
  profileUpdate: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
  }),
  
  // Password change
  passwordChange: z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6).max(128),
  }),
  
  // Contact form
  contact: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    subject: z.string().min(1).max(200),
    message: z.string().min(10).max(2000),
  }),
}

// Secure API wrapper
export function withSecurity(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean
    rateLimit?: keyof typeof SECURITY_CONFIG.RATE_LIMITS
    validateInput?: keyof typeof ValidationSchemas
    allowedMethods?: string[]
    requireTokens?: number
  } = {}
) {
  return async (request: NextRequest, context: any = {}) => {
    try {
      // Method validation
      if (options.allowedMethods && !options.allowedMethods.includes(request.method)) {
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        )
      }
      
      // Rate limiting
      if (options.rateLimit) {
        const clientIP = getClientIP(request)
        const rateLimitConfig = SECURITY_CONFIG.RATE_LIMITS[options.rateLimit]
        const rateLimitResult = checkRateLimit(clientIP, rateLimitConfig)
        
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            { 
              error: 'Rate limit exceeded',
              resetTime: rateLimitResult.resetTime
            },
            { 
              status: 429,
              headers: {
                'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
              }
            }
          )
        }
      }
      
      // Authentication
      let user = null
      if (options.requireAuth) {
        const authResult = await authenticateRequest(request)
        if (!authResult.success) {
          return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
          )
        }
        user = authResult.user
      }
      
      // Input validation
      if (options.validateInput && request.method !== 'GET') {
        try {
          const body = await request.json()
          const schema = ValidationSchemas[options.validateInput]
          const validatedData = schema.parse(body)
          context.validatedData = validatedData
        } catch (error) {
          if (error instanceof z.ZodError) {
            return NextResponse.json(
              { 
                error: 'Invalid input data',
                details: error.errors
              },
              { status: 400 }
            )
          }
          throw error
        }
      }
      
      // Token balance check
      if (options.requireTokens && user) {
        const { prisma } = await import('@/lib/prisma')
        const userData = await prisma.user.findUnique({
          where: { id: user.id },
          select: { tokens: true }
        })
        
        if (!userData || userData.tokens < options.requireTokens) {
          return NextResponse.json(
            { 
              error: 'Insufficient tokens',
              required: options.requireTokens,
              available: userData?.tokens || 0
            },
            { status: 402 }
          )
        }
      }
      
      // Add security context
      context.user = user
      context.security = {
        clientIP: getClientIP(request),
        authenticated: !!user,
        timestamp: Date.now()
      }
      
      // Call the actual handler
      return await handler(request, context)
      
    } catch (error) {
      console.error('Security middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Sanitize user input
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential XSS
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim()
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}

// Token operation security
export async function validateTokenOperation(
  userId: string,
  operation: 'ADD' | 'SUBTRACT',
  amount: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { prisma } = await import('@/lib/prisma')
  
  // Validate amount
  if (amount < 0 || amount > SECURITY_CONFIG.TOKEN_LIMITS.MAX_PURCHASE_TOKENS) {
    return { success: false, error: 'Invalid token amount' }
  }
  
  // Check current balance for subtraction
  if (operation === 'SUBTRACT') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokens: true }
    })
    
    if (!user || user.tokens < amount) {
      return { success: false, error: 'Insufficient token balance' }
    }
  }
  
  // Validate reason
  if (!reason || reason.length > 500) {
    return { success: false, error: 'Invalid operation reason' }
  }
  
  return { success: true }
}

// Audit logging
export async function auditLog(
  action: string,
  userId?: string,
  details: any = {},
  request?: NextRequest
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId: userId || 'anonymous',
    ip: request ? getClientIP(request) : 'unknown',
    userAgent: request?.headers.get('user-agent') || 'unknown',
    details: sanitizeInput(details)
  }
  
  // In production, send to logging service
  console.log('AUDIT:', JSON.stringify(logEntry))
  
  // Could also store in database for critical operations
  if (['PAYMENT_PROCESSED', 'TOKEN_MANIPULATION', 'AUTH_FAILURE'].includes(action)) {
    try {
      const { prisma } = await import('@/lib/prisma')
      // Store in audit table if exists
    } catch (error) {
      console.error('Audit log storage failed:', error)
    }
  }
}

export default {
  withSecurity,
  authenticateRequest,
  checkRateLimit,
  sanitizeInput,
  validateTokenOperation,
  auditLog,
  SECURITY_CONFIG,
  ValidationSchemas
} 