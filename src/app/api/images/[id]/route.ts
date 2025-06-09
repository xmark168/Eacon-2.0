import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateImage, deleteImage, toggleImageFavorite, getImageById } from '@/lib/database'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Getting image by ID:', params.id)

    const image = await getImageById(params.id, session.user.id)

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      image: image
    })

  } catch (error) {
    console.error('Get image error:', error)
    return NextResponse.json(
      { error: 'Failed to get image' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageUrl, prompt, caption, settings } = await request.json()

    if (!imageUrl || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('Updating image:', params.id)

    // Update the existing image using the new updateImage function
    const updatedImage = await updateImage(params.id, session.user.id, {
      imageUrl,
      prompt,
      caption: caption || '',
      style: settings?.style || 'realistic',
      size: settings?.size || '1024x1024',
      platform: settings?.platform || 'instagram',
      quality: settings?.quality || 'standard'
    })

    if (!updatedImage) {
      return NextResponse.json({ error: 'Image not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      image: updatedImage,
      message: 'Image updated successfully'
    })

  } catch (error) {
    console.error('Update image error:', error)
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === 'toggle-favorite') {
      console.log('Toggling favorite for image:', params.id)

      const updatedImage = await toggleImageFavorite(params.id, session.user.id)

      if (!updatedImage) {
        return NextResponse.json({ error: 'Image not found or unauthorized' }, { status: 404 })
      }

      return NextResponse.json({ 
        success: true, 
        image: updatedImage,
        isFavorite: updatedImage.isFavorite,
        message: updatedImage.isFavorite ? 'Added to favorites' : 'Removed from favorites'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Patch image error:', error)
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const success = await deleteImage(params.id, session.user.id)

    if (!success) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Image deleted successfully'
    })

  } catch (error) {
    console.error('Delete image error:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
} 