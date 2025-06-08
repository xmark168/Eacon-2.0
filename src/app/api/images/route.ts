import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { saveImage, getUserImages, SavedImage } from '@/lib/database'
import OpenAI from 'openai'
import fs from 'fs/promises'
import path from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

// Function to save generated image locally
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

// Function to generate image with OpenAI DALL-E
async function generateImageWithOpenAI(
  prompt: string,
  size: string = '1024x1024',
  quality: string = 'standard',
  style: string = 'realistic'
): Promise<{ imageUrl: string; revisedPrompt?: string }> {
  try {
    
    // Enhance prompt based on style
    let enhancedPrompt = prompt
    
    if (style === 'artistic') {
      enhancedPrompt = `${prompt}, artistic style, creative, expressive, vibrant colors`
    } else if (style === 'photographic') {
      enhancedPrompt = `${prompt}, professional photography, high quality, detailed, realistic lighting`
    } else if (style === 'digital-art') {
      enhancedPrompt = `${prompt}, digital art, illustration, modern, clean design`
    }

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
    const revisedPrompt = response.data[0]?.revised_prompt

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI')
    }

    // Generate unique ID and save image locally
    const imageId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const savedImageUrl = await saveImageLocally(imageUrl, imageId)

    return { 
      imageUrl: savedImageUrl, 
      revisedPrompt 
    }

  } catch (error) {
    console.error('OpenAI image generation error:', error)
    throw error
  }
}

// Function to edit image with OpenAI DALL-E 2 (for image editing with masks)
async function editImageWithOpenAI(
  imageBuffer: Buffer,
  maskBuffer: Buffer | null,
  prompt: string,
  size: string = '1024x1024'
): Promise<{ imageUrl: string }> {
  try {
    console.log('Editing image with OpenAI DALL-E 2:', prompt)

    // Convert buffer to File objects for OpenAI API
    const imageFile = new File([imageBuffer], 'image.png', { type: 'image/png' })
    const maskFile = maskBuffer ? new File([maskBuffer], 'mask.png', { type: 'image/png' }) : undefined

    const response = await openai.images.edit({
      image: imageFile,
      mask: maskFile,
      prompt: prompt,
      n: 1,
      size: size as '256x256' | '512x512' | '1024x1024'
    })

    if (!response.data || response.data.length === 0) {
      throw new Error('No image data returned from OpenAI')
    }

    const imageUrl = response.data[0]?.url

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI')
    }

    // Save edited image locally
    const imageId = 'edited_' + Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const savedImageUrl = await saveImageLocally(imageUrl, imageId)

    return { imageUrl: savedImageUrl }

  } catch (error) {
    console.error('OpenAI image editing error:', error)
    throw error
  }
}

// Function to create image variations with OpenAI DALL-E 2
async function createVariationsWithOpenAI(
  imageBuffer: Buffer,
  size: string = '1024x1024',
  n: number = 1
): Promise<{ imageUrls: string[] }> {
  try {
    console.log('Creating image variations with OpenAI DALL-E 2')

    const imageFile = new File([imageBuffer], 'image.png', { type: 'image/png' })

    const response = await openai.images.createVariation({
      image: imageFile,
      n: Math.min(n, 4), // OpenAI allows max 4 variations
      size: size as '256x256' | '512x512' | '1024x1024'
    })

    if (!response.data || response.data.length === 0) {
      throw new Error('No image data returned from OpenAI')
    }

    const imageUrls: string[] = []
    
    for (let i = 0; i < response.data.length; i++) {
      const imageUrl = response.data[i]?.url
      if (imageUrl) {
        const imageId = 'variation_' + Date.now().toString() + '_' + i + '_' + Math.random().toString(36).substr(2, 9)
        const savedImageUrl = await saveImageLocally(imageUrl, imageId)
        imageUrls.push(savedImageUrl)
      }
    }

    return { imageUrls }

  } catch (error) {
    console.error('OpenAI image variation error:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const contentType = request.headers.get('content-type')
    
    // Handle multipart form data (file uploads)
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()
      const action = formData.get('action') as string
      const prompt = formData.get('prompt') as string
      const size = formData.get('size') as string || '1024x1024'
      const quality = formData.get('quality') as string || 'standard'
      const style = formData.get('style') as string || 'realistic'
      
      if (!prompt) {
        return NextResponse.json(
          { error: 'Prompt is required' },
          { status: 400 }
        )
      }

      let result: { imageUrl?: string; imageUrls?: string[]; revisedPrompt?: string }

      switch (action) {
        case 'generate':
          // Generate new image from text prompt
          result = await generateImageWithOpenAI(prompt, size, quality, style)
          break

        case 'edit':
          // Edit existing image with mask
          const imageFile = formData.get('image') as File
          const maskFile = formData.get('mask') as File | null
          
          if (!imageFile) {
            return NextResponse.json(
              { error: 'Image file is required for editing' },
              { status: 400 }
            )
          }

          const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
          const maskBuffer = maskFile ? Buffer.from(await maskFile.arrayBuffer()) : null
          
          result = await editImageWithOpenAI(imageBuffer, maskBuffer, prompt, size)
          break

        case 'variations':
          // Create variations of uploaded image
          const varImageFile = formData.get('image') as File
          const numberOfVariations = parseInt(formData.get('n') as string || '1')
          
          if (!varImageFile) {
            return NextResponse.json(
              { error: 'Image file is required for variations' },
              { status: 400 }
            )
          }

          const varImageBuffer = Buffer.from(await varImageFile.arrayBuffer())
          result = await createVariationsWithOpenAI(varImageBuffer, size, numberOfVariations)
          break

        default:
          return NextResponse.json(
            { error: 'Invalid action. Use "generate", "edit", or "variations"' },
            { status: 400 }
          )
      }

      // Save result to database
      const imageUrl = result.imageUrl || (result.imageUrls && result.imageUrls[0])
      if (imageUrl) {
        const savedImage = await saveImage({
          userId: session.user.id,
          imageUrl,
          prompt,
          caption: undefined,
          style: style || 'realistic',
          size: size || '1024x1024',
          platform: 'custom',
          quality: quality || 'standard'
        })

        return NextResponse.json({
          success: true,
          message: `Image ${action} completed successfully`,
          image: savedImage,
          result: result
        })
      }

      return NextResponse.json({
        success: true,
        message: `Image ${action} completed successfully`,
        result: result
      })
    }
    
    // Handle JSON requests (existing save functionality)
    const { 
      imageUrl, 
      prompt, 
      caption, 
      settings, 
      action,
      // Add tracking fields
      templateId,
      suggestionId,
      generationSource
    } = await request.json()

    if (action === 'generate') {
      // Generate new image from prompt only
      if (!prompt) {
        return NextResponse.json(
          { error: 'Prompt is required for image generation' },
          { status: 400 }
        )
      }

      const result = await generateImageWithOpenAI(
        prompt,
        settings?.size || '1024x1024',
        settings?.quality || 'standard',
        settings?.style || 'realistic'
      )

      const savedImage = await saveImage({
        userId: session.user.id,
        imageUrl: result.imageUrl,
        prompt: result.revisedPrompt || prompt,
        caption: caption || undefined,
        style: settings?.style || 'realistic',
        size: settings?.size || '1024x1024',
        platform: settings?.platform || 'custom',
        quality: settings?.quality || 'standard',
        // Add tracking information
        templateId: templateId || undefined,
        suggestionId: suggestionId || undefined,
        generationSource: generationSource || undefined
      })

      return NextResponse.json({
        success: true,
        message: 'Image generated and saved successfully',
        image: savedImage,
        revisedPrompt: result.revisedPrompt
      })
    }

    // Original save functionality for existing images
    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'Image URL and prompt are required' },
        { status: 400 }
      )
    }

    const savedImage = await saveImage({
      userId: session.user.id,
      imageUrl,
      prompt,
      caption: caption || undefined,
      style: settings?.style || 'realistic',
      size: settings?.size || '1024x1024',
      platform: settings?.platform || 'instagram',
      quality: settings?.quality || 'standard',
      // Add tracking information
      templateId: templateId || undefined,
      suggestionId: suggestionId || undefined,
      generationSource: generationSource || undefined
    })

    return NextResponse.json({
      success: true,
      message: 'Image saved to gallery successfully',
      image: savedImage
    })

  } catch (error) {
    console.error('Images API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process request',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user's images from real database
    const images = await getUserImages(session.user.id)
    
    // Add some mock images if no images found for testing
    if (images.length === 0) {
      console.log('No images found in database, returning mock images for testing')
      const mockImages = [
        {
          id: 'mock-1',
          url: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop',
          imageUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop',
          prompt: 'Beautiful landscape',
          caption: 'Stunning mountain view',
          style: 'realistic',
          size: '1024x1024',
          platform: 'instagram',
          createdAt: new Date().toISOString(),
          downloads: 0,
          isFavorite: false
        },
        {
          id: 'mock-2',
          url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
          imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
          prompt: 'Ocean waves',
          caption: 'Peaceful ocean scene',
          style: 'artistic',
          size: '1024x1024',
          platform: 'instagram',
          createdAt: new Date().toISOString(),
          downloads: 0,
          isFavorite: false
        }
      ]
      
      return NextResponse.json({
        success: true,
        images: mockImages
      })
    }
    
    // Convert to expected format for frontend
    const formattedImages = images.map(img => ({
      id: img.id,
      url: img.imageUrl, // Use 'url' instead of 'imageUrl' for scheduler compatibility
      imageUrl: img.imageUrl, // Keep both for compatibility
      prompt: img.prompt,
      caption: img.caption,
      style: img.style,
      size: img.size,
      platform: img.platform,
      createdAt: img.createdAt,
      downloads: img.downloads,
      isFavorite: img.isFavorite
    }))

    console.log('API returning images:', formattedImages.length)
    if (formattedImages.length > 0) {
      console.log('Sample image URL:', formattedImages[0].url)
    }

    return NextResponse.json({
      success: true,
      images: formattedImages
    })

  } catch (error) {
    console.error('Fetch images error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    )
  }
} 