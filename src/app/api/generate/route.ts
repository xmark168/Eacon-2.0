import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { saveImage } from '@/lib/database'
import { prisma } from '@/lib/prisma'
import { withSecurity, auditLog, validateTokenOperation } from '@/lib/security'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Valid dimensions for Stability AI SDXL models
const VALID_DIMENSIONS = [
  { width: 1024, height: 1024 },
  { width: 1152, height: 896 },
  { width: 1216, height: 832 },
  { width: 1344, height: 768 },
  { width: 1536, height: 640 },
  { width: 640, height: 1536 },
  { width: 768, height: 1344 },
  { width: 832, height: 1216 },
  { width: 896, height: 1152 }
]

// Security constants
const SECURITY_CONSTANTS = {
  MAX_PROMPT_LENGTH: 2000,
  MAX_CAPTION_LENGTH: 500,
  MIN_TOKENS_REQUIRED: 30,
  MAX_IMAGES_PER_HOUR: 20,
  BLOCKED_KEYWORDS: [
    'nude', 'naked', 'sexual', 'porn', 'violence', 'weapon', 'drug',
    'hate', 'illegal', 'harmful', 'dangerous', 'extremist'
  ]
}

// Function to validate and resize image if needed
async function ensureValidDimensions(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0
    
    console.log(`Source image dimensions: ${width}x${height}`)
    
    // Check if dimensions are valid
    const isValid = VALID_DIMENSIONS.some(dim => dim.width === width && dim.height === height)
    
    if (isValid) {
      console.log('Image dimensions are already valid for Stability AI')
      return imageBuffer
    }
    
    // Find best matching dimensions
    const originalRatio = width / height
    let bestDimension = VALID_DIMENSIONS[0]
    let smallestDifference = Number.MAX_VALUE
    
    for (const dimension of VALID_DIMENSIONS) {
      const dimensionRatio = dimension.width / dimension.height
      const ratioDifference = Math.abs(originalRatio - dimensionRatio)
      
      if (ratioDifference < smallestDifference) {
        smallestDifference = ratioDifference
        bestDimension = dimension
      }
    }
    
    console.log(`Resizing image from ${width}x${height} to ${bestDimension.width}x${bestDimension.height}`)
    
    // Resize image
    const resizedBuffer = await sharp(imageBuffer)
      .resize(bestDimension.width, bestDimension.height, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toBuffer()
    
    return resizedBuffer
  } catch (error) {
    console.error('Error validating/resizing image dimensions:', error)
    return imageBuffer
  }
}

// Function to ensure uploads directory exists
async function ensureUploadsDir() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  try {
    await fs.access(uploadsDir)
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true })
  }
  return uploadsDir
}

// Download and save image locally
async function saveImageLocally(imageUrl: string, imageId: string): Promise<string> {
  try {
    const uploadsDir = await ensureUploadsDir()
    
    // Download the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }
    
    const imageBuffer = await response.arrayBuffer()
    
    // Generate filename
    const filename = `${imageId}.png`
    const filepath = path.join(uploadsDir, filename)
    
    // Save to filesystem
    await fs.writeFile(filepath, Buffer.from(imageBuffer))
    
    // Return public URL
    return `/uploads/${filename}`
  } catch (error) {
    console.error('Failed to save image locally:', error)
    // Return original URL as fallback
    return imageUrl
  }
}

// Transform image using GPT Image 1 (GPT-4o Image Generation)
async function transformImageWithOpenAI(sourceImageUrl: string, prompt: string, style: string): Promise<string> {
  try {
    console.log('🎨 Processing image transformation with GPT Image 1...')
    console.log('Source image URL:', sourceImageUrl)
    console.log('Transformation prompt:', prompt)
    console.log('Style:', style)
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.')
    }

    // Read the source image file
    let sourceImageBuffer: Buffer
    
    if (sourceImageUrl.startsWith('/uploads/')) {
      const imagePath = path.join(process.cwd(), 'public', sourceImageUrl)
      sourceImageBuffer = await fs.readFile(imagePath)
    } else {
      const response = await fetch(sourceImageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch source image: ${response.status}`)
      }
      sourceImageBuffer = Buffer.from(await response.arrayBuffer())
    }

    // Use the provided prompt directly from database/template
    let transformPrompt = prompt
    
    // Only enhance mermaid prompts with additional magical effects
    if (prompt.toLowerCase().includes('mermaid')) {
      transformPrompt = `${prompt} Add magical underwater effects: glowing bioluminescence, floating bubbles, sparkles, mystical aquatic atmosphere, crystal clear water refraction effects.`
      console.log('🧜‍♀️ Enhanced mermaid prompt with magical effects')
    }

    console.log('🚀 Using GPT Image 1 to transform the image with prompt:', transformPrompt.substring(0, 200) + '...')

    // Convert buffer to File object for GPT Image 1 API
    const imageFile = new File([sourceImageBuffer], 'image.png', { 
      type: sourceImageUrl.includes('.jpg') || sourceImageUrl.includes('.jpeg') ? 'image/jpeg' : 'image/png' 
    })

    // Use GPT Image 1 via images.edit endpoint for direct image transformation
    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt: transformPrompt,
      size: '1024x1024',
      quality: 'high'
    })

    if (!response.data || response.data.length === 0) {
      throw new Error('No image data returned from GPT Image 1')
    }

    // GPT Image 1 returns base64 encoded image
    const imageBase64 = response.data[0]?.b64_json
    
    if (!imageBase64) {
      throw new Error('No base64 image data returned from GPT Image 1')
    }

    // Save the base64 image to local storage
    const resultImageBuffer = Buffer.from(imageBase64, 'base64')
    const imageId = 'transform_' + Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const uploadsDir = await ensureUploadsDir()
    const filename = `${imageId}.png`
    const filepath = path.join(uploadsDir, filename)
    
    await fs.writeFile(filepath, resultImageBuffer)

    return `/uploads/${filename}`

  } catch (error) {
    console.error('GPT Image 1 transformation error:', error)
    
    // Check if the error is because GPT Image 1 is not available
    if (error instanceof Error && (error.message.includes('not available') || error.message.includes('not supported'))) {
      console.log('⚠️ GPT Image 1 not available, falling back to GPT-4o + DALL-E 3...')
    } else {
      console.log('⚠️ GPT Image 1 error occurred, falling back to GPT-4o + DALL-E 3...')
    }
    
    try {
      // Use the original Vision + DALL-E 3 approach as fallback
      const sourceImageBuffer = sourceImageUrl.startsWith('/uploads/') 
        ? await fs.readFile(path.join(process.cwd(), 'public', sourceImageUrl))
        : Buffer.from(await (await fetch(sourceImageUrl)).arrayBuffer())
        
      const base64Image = sourceImageBuffer.toString('base64')
      const mimeType = sourceImageUrl.includes('.jpg') || sourceImageUrl.includes('.jpeg') ? 'image/jpeg' : 'image/png'
      
      const visionResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image in detail. Describe the main subject, their appearance, pose, clothing, facial features, hair, background, lighting, colors, and overall composition.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 800
      })

      const imageDescription = visionResponse.choices[0]?.message?.content
      
      if (imageDescription) {
        const dalleResponse = await openai.images.generate({
          model: 'dall-e-3',
          prompt: `${prompt}\n\nBased on this image: ${imageDescription}`,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid'
        })

        if (dalleResponse.data && dalleResponse.data[0]?.url) {
          const imageId = 'dalle3_fallback_' + Date.now().toString() + Math.random().toString(36).substr(2, 9)
          const savedImageUrl = await saveImageLocally(dalleResponse.data[0].url, imageId)
          
          return savedImageUrl
        }
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
    }
    
    throw error
  }
}

// Create image variations using OpenAI - New approach with Vision + DALL-E 3
async function createVariationsWithOpenAI(sourceImageUrl: string): Promise<string[]> {
  try {
    console.log('Creating image variations with OpenAI (Vision + DALL-E 3)...')
    console.log('Source image URL:', sourceImageUrl)
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.')
    }

    // Read and describe the image using Vision model
    let imageBuffer: Buffer
    
    if (sourceImageUrl.startsWith('/uploads/')) {
      const imagePath = path.join(process.cwd(), 'public', sourceImageUrl)
      imageBuffer = await fs.readFile(imagePath)
    } else {
      const response = await fetch(sourceImageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch source image: ${response.status}`)
      }
      imageBuffer = Buffer.from(await response.arrayBuffer())
    }

    // Convert to base64 for vision API
    const base64Image = imageBuffer.toString('base64')
    const mimeType = sourceImageUrl.includes('.jpg') || sourceImageUrl.includes('.jpeg') ? 'image/jpeg' : 'image/png'

    // Use GPT-4o to describe the image
    const visionResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image comprehensively. Describe the subject, style, composition, colors, lighting, mood, and all visual elements. This will be used to generate creative variations while maintaining the core essence of the image.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 600
    })

    const imageDescription = visionResponse.choices[0]?.message?.content
    
    if (!imageDescription) {
      throw new Error('Failed to get image description from GPT-4o')
    }

    console.log('📝 Image description for variations:', imageDescription)

    // Create multiple variations with slight prompt variations
    const variationPrompts = [
      `${imageDescription}, same subject and composition, slight variation in pose and expression`,
      `${imageDescription}, same character, different angle and lighting`,
      `${imageDescription}, similar scene with minor changes in background and colors`
    ]

    const imageUrls: string[] = []

    // Generate variations using DALL-E 3
    for (let i = 0; i < variationPrompts.length; i++) {
      console.log(`⏳ Generating variation ${i + 1}/3 with DALL-E 3...`)
      
      try {
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: variationPrompts[i],
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          style: 'natural'
        })

        if (response.data && response.data[0]?.url) {
          const imageId = `dalle3_variation_${i + 1}_` + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9)
          const savedImageUrl = await saveImageLocally(response.data[0].url, imageId)
          imageUrls.push(savedImageUrl)
          console.log(`✅ Variation ${i + 1} completed:`, savedImageUrl)
        }
      } catch (error) {
        console.error(`❌ Error generating variation ${i + 1}:`, error)
        // Continue with other variations even if one fails
      }
    }

    if (imageUrls.length === 0) {
      throw new Error('Failed to generate any variations')
    }

    console.log(`🎉 Generated ${imageUrls.length} variations successfully`)
    return imageUrls

  } catch (error) {
    console.error('OpenAI variations error:', error)
    throw error
  }
}

// Content moderation function
function moderateContent(prompt: string, caption?: string): { allowed: boolean; reason?: string } {
  const textToCheck = `${prompt} ${caption || ''}`.toLowerCase()
  
  for (const keyword of SECURITY_CONSTANTS.BLOCKED_KEYWORDS) {
    if (textToCheck.includes(keyword)) {
      return { allowed: false, reason: `Content contains prohibited keyword: ${keyword}` }
    }
  }
  
  // Check for suspicious patterns
  if (textToCheck.length > SECURITY_CONSTANTS.MAX_PROMPT_LENGTH) {
    return { allowed: false, reason: 'Prompt too long' }
  }
  
  if (caption && caption.length > SECURITY_CONSTANTS.MAX_CAPTION_LENGTH) {
    return { allowed: false, reason: 'Caption too long' }
  }
  
  return { allowed: true }
}

// Calculate token cost for generation
function calculateTokenCost(style: string, platform: string): number {
  const baseCost = 30
  
  // Style modifiers
  const styleMultiplier = {
    'realistic': 1.2,
    'artistic': 1.0,
    'cartoon': 0.8,
    'fantasy': 1.1,
    'minimalist': 0.7,
    'vintage': 0.9,
    'modern': 1.0,
    'abstract': 0.8
  }[style] || 1.0
  
  // Platform modifiers (higher res platforms cost more)
  const platformMultiplier = {
    'instagram': 1.0,
    'facebook': 1.0,
    'twitter': 0.8,
    'linkedin': 1.0,
    'pinterest': 1.2,
    'tiktok': 1.1
  }[platform] || 1.0
  
  return Math.ceil(baseCost * styleMultiplier * platformMultiplier)
}

// Main secure handler
const secureHandler = withSecurity(
  async (request: NextRequest, context: any) => {
    const { user, validatedData } = context
    const { prompt, caption, style, platform, templateId, size } = validatedData

    try {
      // Audit log generation attempt
      await auditLog('IMAGE_GENERATION_ATTEMPT', user.id, {
        prompt: prompt.substring(0, 100), // Only log first 100 chars for privacy
        style,
        platform,
        templateId,
        timestamp: Date.now()
      }, request)

      // Content moderation
      const moderationResult = moderateContent(prompt, caption)
      if (!moderationResult.allowed) {
        await auditLog('IMAGE_GENERATION_BLOCKED', user.id, {
          reason: moderationResult.reason,
          prompt: prompt.substring(0, 100)
        }, request)
        
        return NextResponse.json(
          { error: `Content not allowed: ${moderationResult.reason}` },
          { status: 400 }
        )
      }

      // Calculate token cost
      const tokenCost = calculateTokenCost(style, platform)

      // Validate token operation
      const tokenValidation = await validateTokenOperation(user.id, 'SUBTRACT', tokenCost, 'Image generation')
      if (!tokenValidation.success) {
        await auditLog('IMAGE_GENERATION_INSUFFICIENT_TOKENS', user.id, {
          required: tokenCost,
          reason: tokenValidation.error
        }, request)
        
        return NextResponse.json(
          { 
            error: 'Insufficient tokens',
            required: tokenCost,
            details: tokenValidation.error
          },
          { status: 402 }
        )
      }

      // Check rate limiting (additional to middleware)
      const recentGenerations = await prisma.generatedImage.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        }
      })

      if (recentGenerations >= SECURITY_CONSTANTS.MAX_IMAGES_PER_HOUR) {
        await auditLog('IMAGE_GENERATION_RATE_LIMITED', user.id, {
          recentCount: recentGenerations
        }, request)
        
        return NextResponse.json(
          { error: 'Rate limit exceeded. Maximum 20 images per hour.' },
          { status: 429 }
        )
      }

      // Deduct tokens first (atomic operation)
      await prisma.$transaction(async (tx) => {
        // Deduct tokens
        await tx.user.update({
          where: { id: user.id },
          data: { tokens: { decrement: tokenCost } }
        })
        
        // Record token transaction
        await tx.tokenTransaction.create({
          data: {
            userId: user.id,
            amount: -tokenCost,
            type: 'USED',
            description: `Image generation - ${style} style for ${platform}`
          }
        })
      })

      // Generate image with error handling
      let imageResponse
      try {
        imageResponse = await openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: (size as any) || '1024x1024',
          quality: 'standard',
        })
      } catch (openaiError: any) {
        // Refund tokens on failure using EARNED type
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: user.id },
            data: { tokens: { increment: tokenCost } }
          })
          
          await tx.tokenTransaction.create({
            data: {
              userId: user.id,
              amount: tokenCost,
              type: 'EARNED',
              description: `Refund for failed image generation - ${openaiError.message?.substring(0, 100)}`
            }
          })
        })

        await auditLog('IMAGE_GENERATION_FAILED', user.id, {
          error: openaiError.message,
          tokenCost,
          refunded: true
        }, request)

        console.error('OpenAI API error:', openaiError)
        
        if (openaiError.status === 429) {
          return NextResponse.json(
            { error: 'AI service is busy. Please try again later.' },
            { status: 429 }
          )
        } else if (openaiError.status === 402) {
          return NextResponse.json(
            { error: 'AI service quota exceeded. Please try again later.' },
            { status: 503 }
          )
        }
        
        throw openaiError
      }

      // Safely get image URL
      const imageUrl = imageResponse.data?.[0]?.url
      if (!imageUrl) {
        throw new Error('No image URL received from OpenAI')
      }

      // Download and process image
      const imageBuffer = await fetch(imageUrl).then(res => res.arrayBuffer()).then(Buffer.from)
      const processedBuffer = await ensureValidDimensions(imageBuffer)

      // Save image securely
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      await fs.mkdir(uploadsDir, { recursive: true })
      
      const filename = `generated_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
      const filepath = path.join(uploadsDir, filename)
      
      await fs.writeFile(filepath, processedBuffer)

      // Save to database with metadata
      const savedImage = await saveImage({
        userId: user.id,
        imageUrl: `/uploads/${filename}`,
        prompt,
        caption: caption || '',
        style,
        platform,
        size: size || '1024x1024',
        templateId: templateId || undefined,
        originalImageUrl: imageUrl,
        generationSource: 'manual' as any
      })

      // Audit log success
      await auditLog('IMAGE_GENERATION_SUCCESS', user.id, {
        imageId: savedImage.id,
        tokenCost,
        style,
        platform,
        fileSize: processedBuffer.length
      }, request)

      return NextResponse.json({
        success: true,
        image: {
          id: savedImage.id,
          url: `/uploads/${filename}`,
          prompt,
          caption: caption || '',
          style,
          platform,
          tokensUsed: tokenCost,
          createdAt: savedImage.createdAt
        }
      })

    } catch (error: any) {
      // Audit log error
      await auditLog('IMAGE_GENERATION_ERROR', user.id, {
        error: error.message,
        stack: error.stack?.substring(0, 500)
      }, request)

      console.error('Image generation error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to generate image' },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    rateLimit: 'GENERATION',
    validateInput: 'imageGeneration',
    allowedMethods: ['POST'],
    requireTokens: SECURITY_CONSTANTS.MIN_TOKENS_REQUIRED
  }
)

export const POST = secureHandler
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { 
      prompt, 
      size = '1024x1024', 
      style = 'realistic', 
      quality = 'standard',
      transform = false,
      sourceImage,
      createVariations = false,
      templateId,
      suggestionId,
      generationSource,
      templateCost
    } = await request.json()

    // Log tracking information for analytics
    if (templateId || suggestionId || generationSource) {
      console.log('📊 Generation tracking:', {
        templateId,
        suggestionId,
        generationSource,
        style,
        size,
        transform: transform || createVariations
      })
    }

    if (!prompt && !createVariations) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // For transform mode or variations, require source image
    if ((transform || createVariations) && !sourceImage) {
      return NextResponse.json(
        { error: 'Source image is required for transformation or variations' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    console.log('Processing request:', { prompt, size, style, quality, transform, createVariations })
    
    // Calculate token cost and deduct tokens
    let tokenCost = templateCost || 25 // Use template cost if provided, otherwise default
    
    if (!templateCost) {
      // Calculate cost based on size for non-template generations
      const sizeMultipliers: { [key: string]: number } = {
        '1024x1024': 25,
        '1024x1792': 35,
        '1792x1024': 35
      }
      tokenCost = sizeMultipliers[size] || 25
    }

    // Get user and check token balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tokens: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.tokens < tokenCost) {
      return NextResponse.json(
        { error: `Insufficient tokens. Need ${tokenCost} tokens, you have ${user.tokens}` },
        { status: 402 }
      )
    }

    // Deduct tokens before generation
    const result = await prisma.$transaction(async (tx) => {
      // Update user tokens
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: { tokens: user.tokens - tokenCost }
      })

      // Create token transaction record
      const transaction = await tx.tokenTransaction.create({
        data: {
          userId: session.user.id,
          amount: -tokenCost,
          type: 'USED',
          description: `${transform ? 'Image transformation' : 'Image generation'} - ${style} style${templateId ? ` (Template)` : ''}`
        }
      })

      return { user: updatedUser, transaction }
    })

    // Handle image variations
    if (createVariations && sourceImage) {
      console.log('Creating image variations...')
      const variationImageUrls = await createVariationsWithOpenAI(sourceImage)
      
      return NextResponse.json({
        success: true,
        imageUrls: variationImageUrls,
        message: 'Image variations created successfully',
        generatedAt: new Date().toISOString(),
        isVariations: true,
        newTokenBalance: result.user.tokens,
        tokenCost,
        tracking: {
          templateId,
          suggestionId,
          generationSource
        }
      })
    }

    // Handle image transformation
    if (transform && sourceImage) {
      console.log('Processing image transformation...')
      console.log('Source image path:', sourceImage)
      
      const transformedImageUrl = await transformImageWithOpenAI(sourceImage, prompt, style)
      
      // Save transformed image to database with original image URL
      const savedImage = await saveImage({
        userId: session.user.id,
        imageUrl: transformedImageUrl,
        originalImageUrl: sourceImage, // Store the original image URL
        prompt,
        caption: undefined,
        style,
        size,
        platform: 'instagram',
        quality,
        templateId: templateId || undefined,
        suggestionId: suggestionId || undefined,
        generationSource: generationSource || undefined
      })
      
      return NextResponse.json({
        success: true,
        imageUrl: transformedImageUrl,
        prompt,
        settings: {
          size,
          style,
          quality
        },
        generatedAt: new Date().toISOString(),
        isTransformation: true,
        newTokenBalance: result.user.tokens,
        tokenCost,
        tracking: {
          templateId,
          suggestionId,
          generationSource
        }
      })
    }

    // Regular image generation with DALL-E 3
    let enhancedPrompt = prompt
    
    // Style-specific enhancements for generation
    if (style === 'artistic') {
      enhancedPrompt = `${prompt}, artistic style, creative, expressive, vibrant colors`
    } else if (style === 'photographic') {
      enhancedPrompt = `${prompt}, professional photography, high quality, detailed, realistic lighting`
    } else if (style === 'digital-art') {
      enhancedPrompt = `${prompt}, digital art, illustration, modern, clean design`
    } else if (style === 'anime') {
      enhancedPrompt = `${prompt}, anime style, manga art, Japanese animation, colorful`
    } else if (style === 'vintage') {
      enhancedPrompt = `${prompt}, vintage style, retro aesthetic, nostalgic, classic`
    }

    try {
      // OpenAI DALL-E 3 API call
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: size as '1024x1024' | '1024x1792' | '1792x1024',
        quality: quality as 'standard' | 'hd',
        style: style === 'realistic' ? 'natural' : 'vivid'
      })

      if (!response.data || response.data.length === 0) {
        throw new Error('No image data returned from OpenAI')
      }

      const imageUrl = response.data[0]?.url

      if (!imageUrl) {
        throw new Error('No image URL returned from OpenAI')
      }

      console.log('Image generated successfully:', imageUrl)

      // Generate unique ID for the image
      const imageId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      
      // Save image locally to avoid URL expiration
      const savedImageUrl = await saveImageLocally(imageUrl, imageId)

      return NextResponse.json({
        success: true,
        imageUrl: savedImageUrl,
        prompt,
        revisedPrompt: response.data[0]?.revised_prompt, // DALL-E 3 often revises prompts
        settings: {
          size,
          style,
          quality
        },
        generatedAt: new Date().toISOString(),
        newTokenBalance: result.user.tokens,
        tokenCost,
        tracking: {
          templateId,
          suggestionId,
          generationSource
        }
      })

    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError)
      
      // Handle specific OpenAI errors
      if (openaiError.status === 400) {
        return NextResponse.json(
          { error: 'Invalid prompt or settings' },
          { status: 400 }
        )
      } else if (openaiError.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      } else if (openaiError.status === 402) {
        return NextResponse.json(
          { error: 'Insufficient credits. Please check your OpenAI billing.' },
          { status: 402 }
        )
      }
      
      throw openaiError
    }

  } catch (error) {
    console.error('Generate API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process request',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 