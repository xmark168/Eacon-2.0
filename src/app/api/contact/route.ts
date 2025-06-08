import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for contact form
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.enum(['general', 'technical', 'billing', 'enterprise', 'partnership', 'feedback']),
  message: z.string().min(10, 'Message must be at least 10 characters')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the form data
    const validatedData = contactSchema.parse(body)
    
    // In a real application, you would:
    // 1. Send an email notification to your support team
    // 2. Store the message in a database
    // 3. Send an auto-reply to the user
    
    // For now, we'll simulate a successful submission
    console.log('Contact form submission:', validatedData)
    
    // Simulate email sending (replace with actual email service)
    await simulateEmailSending(validatedData)
    
    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you within 24 hours.'
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.errors
        },
        { status: 400 }
      )
    }
    
    console.error('Contact form error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while sending your message. Please try again.'
      },
      { status: 500 }
    )
  }
}

// Simulate email sending (replace with actual email service like SendGrid, Mailgun, etc.)
async function simulateEmailSending(data: any) {
  // In production, you would use an email service here
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail')
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  
  const msg = {
    to: 'support@eacon.ai',
    from: 'noreply@eacon.ai',
    subject: `Contact Form: ${data.subject}`,
    html: `
      <h3>New Contact Form Submission</h3>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Category:</strong> ${data.category}</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <p><strong>Message:</strong></p>
      <p>${data.message}</p>
    `,
  }
  
  await sgMail.send(msg)
  */
  
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 1000))
}

// Rate limiting helper (in production, use a proper rate limiting solution)
const rateLimitMap = new Map()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 5 // 5 requests per minute
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return false
  }
  
  const data = rateLimitMap.get(ip)
  
  if (now > data.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return false
  }
  
  if (data.count >= maxRequests) {
    return true
  }
  
  data.count++
  return false
} 