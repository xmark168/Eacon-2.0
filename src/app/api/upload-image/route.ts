import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

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

// Function to find the best fitting dimension for an image
function findBestDimension(originalWidth: number, originalHeight: number): { width: number, height: number } {
  const originalRatio = originalWidth / originalHeight
  
  let bestDimension = VALID_DIMENSIONS[0] // Default to 1024x1024
  let smallestDifference = Number.MAX_VALUE
  
  for (const dimension of VALID_DIMENSIONS) {
    const dimensionRatio = dimension.width / dimension.height
    const ratioDifference = Math.abs(originalRatio - dimensionRatio)
    
    if (ratioDifference < smallestDifference) {
      smallestDifference = ratioDifference
      bestDimension = dimension
    }
  }
  
  return bestDimension
}

// Function to resize image to valid Stability AI dimensions
async function resizeImageForStability(buffer: Buffer): Promise<Buffer> {
  try {
    // Get original image metadata
    const metadata = await sharp(buffer).metadata()
    const originalWidth = metadata.width || 0
    const originalHeight = metadata.height || 0
    
    console.log(`Original image dimensions: ${originalWidth}x${originalHeight}`)
    
    // Check if already valid dimension
    const isValidDimension = VALID_DIMENSIONS.some(dim => 
      dim.width === originalWidth && dim.height === originalHeight
    )
    
    if (isValidDimension) {
      console.log('Image already has valid dimensions')
      return buffer
    }
    
    // Find best fitting dimension
    const targetDimension = findBestDimension(originalWidth, originalHeight)
    console.log(`Resizing to: ${targetDimension.width}x${targetDimension.height}`)
    
    // Resize image while maintaining aspect ratio and center cropping if needed
    const resizedBuffer = await sharp(buffer)
      .resize(targetDimension.width, targetDimension.height, {
        fit: 'cover', // This will crop the image to fit exactly
        position: 'center'
      })
      .png() // Convert to PNG for consistency
      .toBuffer()
    
    return resizedBuffer
  } catch (error) {
    console.error('Error resizing image:', error)
    // Return original buffer if resize fails
    return buffer
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

    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPG, PNG, or WebP' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Please upload an image smaller than 5MB' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const imageBuffer = Buffer.from(bytes)
    
    // For cropped images, we assume they're already in the correct format and dimensions
    // If the filename suggests it's a cropped image, save directly
    let processedBuffer = imageBuffer
    let fileName: string
    
    if (file.name === 'cropped-image.png') {
      // This is a cropped image from the frontend, use as-is
      fileName = `${Date.now()}${Math.random().toString(36).substring(2)}.png`
    } else {
      // This might be a raw upload, try to resize it
      processedBuffer = await resizeImageForStability(imageBuffer)
      fileName = `${Date.now()}${Math.random().toString(36).substring(2)}.png`
    }

    const filePath = path.join(uploadDir, fileName)

    // Save processed image
    fs.writeFileSync(filePath, processedBuffer)

    const imageUrl = `/uploads/${fileName}`

    console.log('Image uploaded and processed successfully:', {
      fileName,
      originalFileSize: file.size,
      processedFileSize: processedBuffer.length,
      fileType: 'image/png',
      imageUrl,
      wasCropped: file.name === 'cropped-image.png'
    })

    return NextResponse.json({
      success: true,
      imageUrl,
      fileName,
      fileSize: processedBuffer.length,
      message: file.name === 'cropped-image.png' 
        ? 'Cropped image uploaded successfully' 
        : 'Image uploaded and automatically resized for optimal processing'
    })

  } catch (error) {
    console.error('Upload image error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 