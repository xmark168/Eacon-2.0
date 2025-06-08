import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs/promises'

export interface SavedImage {
  id: string
  userId: string
  imageUrl: string
  originalImageUrl?: string // For transform templates, store the original uploaded image
  prompt: string
  caption?: string
  style: string
  size: string
  platform: string
  quality?: string
  createdAt: string
  downloads: number
  isFavorite: boolean
  isPublic?: boolean
  templateId?: string
  suggestionId?: string
  generationSource?: 'template' | 'suggestion' | 'manual'
}

export interface TemplateUnlock {
  id: string
  userId: string
  templateId: string
  unlockedAt: Date
}

export interface Template {
  id: string
  title: string
  description: string
  prompt: string
  style: string
  platform: string
  tags: string[]
  cost: number
  unlockCost: number // Cost to unlock and view the prompt
  category: string
  isActive: boolean
  type?: 'GENERATE' | 'TRANSFORM'
  requiresUpload?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  displayName: string
  description: string
  icon: string
  color: string
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

// Save or update image using PostgreSQL
export async function saveImage(image: Omit<SavedImage, 'id' | 'createdAt' | 'downloads' | 'isFavorite' | 'isPublic'>): Promise<SavedImage> {
  try {
    // Check if image already exists for this user (by imageUrl)
    const existingImage = await prisma.generatedImage.findFirst({
      where: {
        userId: image.userId,
        imageUrl: image.imageUrl
      }
    })

    if (existingImage) {
      // Update existing image
      const updatedImage = await prisma.generatedImage.update({
        where: { id: existingImage.id },
        data: {
          prompt: image.prompt,
          ...(image.caption && { caption: image.caption }),
          ...(image.originalImageUrl && { originalImageUrl: image.originalImageUrl }),
          style: image.style,
          size: image.size,
          platform: image.platform,
          // Add tracking fields for updates
          ...(image.templateId && { templateId: image.templateId }),
          ...(image.suggestionId && { suggestionId: image.suggestionId }),
          ...(image.generationSource && { generationSource: image.generationSource })
        } as any
      })

      console.log('Updated existing image with tracking:', updatedImage.id, {
        templateId: image.templateId,
        suggestionId: image.suggestionId,
        generationSource: image.generationSource
      })
      
              return {
        id: updatedImage.id,
        userId: updatedImage.userId,
        imageUrl: updatedImage.imageUrl,
        originalImageUrl: (updatedImage as any).originalImageUrl || undefined,
        prompt: updatedImage.prompt,
        caption: (updatedImage as any).caption || undefined,
        style: updatedImage.style || 'realistic',
        size: updatedImage.size,
        platform: updatedImage.platform || 'instagram',
        createdAt: updatedImage.createdAt.toISOString(),
        downloads: (updatedImage as any).downloads || 0,
        isFavorite: (updatedImage as any).isFavorite || false,
        isPublic: updatedImage.isPublic || false,
        templateId: updatedImage.templateId || undefined,
        // Add tracking fields to response
        suggestionId: (updatedImage as any).suggestionId || undefined,
        generationSource: (updatedImage as any).generationSource || undefined
      }
    } else {
      // Create new image
      const newImage = await prisma.generatedImage.create({
        data: {
          userId: image.userId,
          imageUrl: image.imageUrl,
          prompt: image.prompt,
          ...(image.caption && { caption: image.caption }),
          ...(image.originalImageUrl && { originalImageUrl: image.originalImageUrl }),
          style: image.style,
          size: image.size,
          platform: image.platform,
          isFavorite: false,
          downloads: 0,
          isPublic: false,
          // Add tracking fields for new images
          ...(image.templateId && { templateId: image.templateId }),
          ...(image.suggestionId && { suggestionId: image.suggestionId }),
          ...(image.generationSource && { generationSource: image.generationSource })
        } as any
      })

      console.log('Created new image with tracking:', newImage.id, {
        templateId: image.templateId,
        suggestionId: image.suggestionId,
        generationSource: image.generationSource
      })
      
      return {
        id: newImage.id,
        userId: newImage.userId,
        imageUrl: newImage.imageUrl,
        originalImageUrl: (newImage as any).originalImageUrl || undefined,
        prompt: newImage.prompt,
        caption: (newImage as any).caption || undefined,
        style: newImage.style || 'realistic',
        size: newImage.size,
        platform: newImage.platform || 'instagram',
        createdAt: newImage.createdAt.toISOString(),
        downloads: (newImage as any).downloads || 0,
        isFavorite: (newImage as any).isFavorite || false,
        isPublic: newImage.isPublic || false,
        templateId: newImage.templateId || undefined,
        // Add tracking fields to response
        suggestionId: (newImage as any).suggestionId || undefined,
        generationSource: (newImage as any).generationSource || undefined
      }
    }
  } catch (error) {
    console.error('Error saving image to PostgreSQL:', error)
    throw new Error('Failed to save image to database')
  }
}

// Get user's images from PostgreSQL
export async function getUserImages(userId: string): Promise<SavedImage[]> {
  try {
    const images = await prisma.generatedImage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: {
            title: true,
            category: true
          }
        }
      }
    })

    return images.map(img => ({
      id: img.id,
      userId: img.userId,
      imageUrl: img.imageUrl,
      originalImageUrl: (img as any).originalImageUrl || undefined,
      prompt: img.prompt,
      caption: (img as any).caption || undefined,
      style: img.style || 'realistic',
      size: img.size,
      platform: img.platform || 'instagram',
      createdAt: img.createdAt.toISOString(),
      downloads: (img as any).downloads || 0,
      isFavorite: (img as any).isFavorite || false,
      isPublic: img.isPublic || false,
      templateId: img.templateId || undefined,
      // Add tracking fields
      suggestionId: (img as any).suggestionId || undefined,
      generationSource: (img as any).generationSource || undefined
    }))
  } catch (error) {
    console.error('Error fetching images from PostgreSQL:', error)
    return []
  }
}

// Get single image by ID for specific user
export async function getImageById(imageId: string, userId: string): Promise<SavedImage | null> {
  try {
    const image = await prisma.generatedImage.findFirst({
      where: { 
        id: imageId,
        userId 
      },
      include: {
        template: {
          select: {
            title: true,
            category: true
          }
        }
      }
    })

    if (!image) return null

    return {
      id: image.id,
      userId: image.userId,
      imageUrl: image.imageUrl,
      originalImageUrl: (image as any).originalImageUrl || undefined,
      prompt: image.prompt,
      caption: (image as any).caption || undefined,
      style: image.style || 'realistic',
      size: image.size,
      platform: image.platform || 'instagram',
      createdAt: image.createdAt.toISOString(),
      downloads: (image as any).downloads || 0,
      isFavorite: (image as any).isFavorite || false,
      isPublic: image.isPublic || false,
      templateId: image.templateId || undefined,
      // Add tracking fields
      suggestionId: (image as any).suggestionId || undefined,
      generationSource: (image as any).generationSource || undefined
    }
  } catch (error) {
    console.error('Error fetching image from PostgreSQL:', error)
    return null
  }
}

// Update image
export async function updateImage(
  imageId: string, 
  userId: string, 
  updates: Partial<Omit<SavedImage, 'id' | 'userId' | 'createdAt' | 'downloads' | 'isFavorite'>>
): Promise<SavedImage | null> {
  try {
    const updatedImage = await prisma.generatedImage.update({
      where: {
        id: imageId,
        userId: userId
      },
      data: {
        ...(updates.imageUrl && { imageUrl: updates.imageUrl }),
        ...(updates.prompt && { prompt: updates.prompt }),
        ...(updates.caption !== undefined && { caption: updates.caption || null }),
        ...(updates.style && { style: updates.style }),
        ...(updates.size && { size: updates.size }),
        ...(updates.platform && { platform: updates.platform })
      } as any
    })

    console.log('Updated image:', updatedImage.id)
    return {
      id: updatedImage.id,
      userId: updatedImage.userId,
      imageUrl: updatedImage.imageUrl,
      prompt: updatedImage.prompt,
      caption: (updatedImage as any).caption || undefined,
      style: updatedImage.style || 'realistic',
      size: updatedImage.size,
      platform: updatedImage.platform || 'instagram',
      createdAt: updatedImage.createdAt.toISOString(),
      downloads: (updatedImage as any).downloads || 0,
      isFavorite: (updatedImage as any).isFavorite || false,
      isPublic: updatedImage.isPublic || false,
      templateId: updatedImage.templateId || undefined
    }
  } catch (error) {
    console.error('Error updating image in PostgreSQL:', error)
    return null
  }
}

// Delete image
export async function deleteImage(imageId: string, userId: string): Promise<boolean> {
  try {
    await prisma.generatedImage.delete({
      where: {
        id: imageId,
        userId: userId
      }
    })
    
    console.log('Deleted image:', imageId)
    return true
  } catch (error) {
    console.error('Error deleting image from PostgreSQL:', error)
    return false
  }
}

// Toggle favorite status
export async function toggleImageFavorite(imageId: string, userId: string): Promise<SavedImage | null> {
  try {
    // First get current image
    const currentImage = await prisma.generatedImage.findFirst({
      where: { id: imageId, userId }
    })

    if (!currentImage) return null

    // Toggle favorite status
    const updatedImage = await prisma.generatedImage.update({
      where: { id: imageId },
      data: { isFavorite: !(currentImage as any).isFavorite } as any
    })

    return {
      id: updatedImage.id,
      userId: updatedImage.userId,
      imageUrl: updatedImage.imageUrl,
      prompt: updatedImage.prompt,
      caption: (updatedImage as any).caption || undefined,
      style: updatedImage.style || 'realistic',
      size: updatedImage.size,
      platform: updatedImage.platform || 'instagram',
      createdAt: updatedImage.createdAt.toISOString(),
      downloads: (updatedImage as any).downloads || 0,
      isFavorite: (updatedImage as any).isFavorite || false,
      isPublic: updatedImage.isPublic || false,
      templateId: updatedImage.templateId || undefined
    }
  } catch (error) {
    console.error('Error toggling favorite in PostgreSQL:', error)
    return null
  }
}

// Increment download count
export async function incrementDownloadCount(imageId: string, userId: string): Promise<SavedImage | null> {
  try {
    const updatedImage = await prisma.generatedImage.update({
      where: {
        id: imageId,
        userId: userId
      },
      data: {
        downloads: {
          increment: 1
        }
      } as any
    })

    return {
      id: updatedImage.id,
      userId: updatedImage.userId,
      imageUrl: updatedImage.imageUrl,
      prompt: updatedImage.prompt,
      caption: (updatedImage as any).caption || undefined,
      style: updatedImage.style || 'realistic',
      size: updatedImage.size,
      platform: updatedImage.platform || 'instagram',
      createdAt: updatedImage.createdAt.toISOString(),
      downloads: (updatedImage as any).downloads || 0,
      isFavorite: (updatedImage as any).isFavorite || false,
      isPublic: updatedImage.isPublic || false,
      templateId: updatedImage.templateId || undefined
    }
  } catch (error) {
    console.error('Error incrementing download count in PostgreSQL:', error)
    return null
  }
}

// Update image caption
export async function updateImageCaption(imageId: string, userId: string, caption: string): Promise<boolean> {
  try {
    const result = await prisma.generatedImage.updateMany({
      where: {
        id: imageId,
        userId: userId
      },
      data: {
        caption: caption
      } as any
    })

    return result.count > 0
  } catch (error) {
    console.error('Error updating image caption in PostgreSQL:', error)
    return false
  }
}

// Template unlock functions using PostgreSQL
export async function createTemplateUnlock(unlock: Omit<TemplateUnlock, 'id' | 'unlockedAt'>): Promise<TemplateUnlock> {
  try {
    // Check if already unlocked
    const existing = await prisma.templateUnlock.findUnique({
      where: {
        userId_templateId: {
          userId: unlock.userId,
          templateId: unlock.templateId
        }
      }
    })

    if (existing) {
      console.log('🔓 Template already unlocked:', unlock.templateId)
      return {
        id: existing.id,
        userId: existing.userId,
        templateId: existing.templateId,
        unlockedAt: existing.unlockedAt
      }
    }

    const newUnlock = await prisma.templateUnlock.create({
      data: {
        userId: unlock.userId,
        templateId: unlock.templateId
      }
    })

    console.log('✅ Template unlock created in PostgreSQL:', unlock.templateId)
    return {
      id: newUnlock.id,
      userId: newUnlock.userId,
      templateId: newUnlock.templateId,
      unlockedAt: newUnlock.unlockedAt
    }
  } catch (error) {
    console.error('Error creating template unlock in PostgreSQL:', error)
    throw error
  }
}

export async function getTemplateUnlock(userId: string, templateId: string): Promise<TemplateUnlock | null> {
  try {
    const unlock = await prisma.templateUnlock.findUnique({
      where: {
        userId_templateId: {
          userId,
          templateId
        }
      }
    })

    if (!unlock) return null

    return {
      id: unlock.id,
      userId: unlock.userId,
      templateId: unlock.templateId,
      unlockedAt: unlock.unlockedAt
    }
  } catch (error) {
    console.error('Error getting template unlock from PostgreSQL:', error)
    return null
  }
}

export async function getUserUnlockedTemplates(userId: string): Promise<string[]> {
  try {
    const unlocks = await prisma.templateUnlock.findMany({
      where: { userId },
      select: { templateId: true }
    })

    return unlocks.map(unlock => unlock.templateId)
  } catch (error) {
    console.error('Error getting user unlocked templates from PostgreSQL:', error)
    return []
  }
}

// Template functions using PostgreSQL
export async function getTemplateById(templateId: string): Promise<Template | null> {
  try {
    const template = await prisma.template.findUnique({
      where: { id: templateId, isActive: true }
    })

    if (!template) return null

    return {
      id: template.id,
      title: template.title,
      description: template.description,
      prompt: template.prompt,
      style: template.style,
      platform: template.platform,
      tags: template.tags,
      cost: template.cost,
      unlockCost: template.unlockCost,
      category: template.category,
      isActive: template.isActive,
      type: template.type,
      requiresUpload: template.requiresUpload,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    }
  } catch (error) {
    console.error('Error getting template by ID from PostgreSQL:', error)
    return null
  }
}

export async function getAllTemplates(): Promise<Template[]> {
  try {
    const templates = await prisma.template.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    return templates.map(template => ({
      id: template.id,
      title: template.title,
      description: template.description,
      prompt: template.prompt,
      style: template.style,
      platform: template.platform,
      tags: template.tags,
      cost: template.cost,
      unlockCost: template.unlockCost,
      category: template.category,
      isActive: template.isActive,
      type: template.type,
      requiresUpload: template.requiresUpload,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    }))
  } catch (error) {
    console.error('Error getting all templates from PostgreSQL:', error)
    return []
  }
}

export async function saveTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> {
  try {
    const newTemplate = await prisma.template.create({
      data: {
        title: template.title,
        description: template.description,
        prompt: template.prompt,
        style: template.style,
        platform: template.platform,
        tags: template.tags,
        cost: template.cost,
        unlockCost: template.unlockCost,
        category: template.category,
        isActive: template.isActive
      }
    })

    console.log('✅ Template saved to PostgreSQL:', newTemplate.title)
    return {
      id: newTemplate.id,
      title: newTemplate.title,
      description: newTemplate.description,
      prompt: newTemplate.prompt,
      style: newTemplate.style,
      platform: newTemplate.platform,
      tags: newTemplate.tags,
      cost: newTemplate.cost,
      unlockCost: newTemplate.unlockCost,
      category: newTemplate.category,
      isActive: newTemplate.isActive,
      createdAt: newTemplate.createdAt,
      updatedAt: newTemplate.updatedAt
    }
  } catch (error) {
    console.error('Error saving template to PostgreSQL:', error)
    throw error
  }
}

// Initialize default templates in PostgreSQL
async function initializeDefaultTemplates(): Promise<Template[]> {
  try {
    // Check if templates already exist
    const existingCount = await prisma.template.count()
    if (existingCount > 0) {
      console.log('✅ Templates already exist in PostgreSQL, skipping initialization')
      return await getAllTemplates()
    }

    const defaultTemplates = [
      {
        title: 'Professional Headshot',
        description: '📸 Create a stunning professional headshot perfect for LinkedIn, resumes, and business profiles.',
        prompt: 'professional headshot photography of a person, corporate attire, clean background, professional lighting, high-resolution, business portrait, confident expression, well-groomed appearance',
        style: 'photographic',
        platform: 'linkedin',
        tags: ['professional', 'headshot', 'business', 'corporate', 'linkedin'],
        cost: 15,
        unlockCost: 100,
        category: 'photography',
        isActive: true
      },
      {
        title: 'Instagram Portrait',
        description: '✨ Beautiful portrait optimized for Instagram with perfect lighting and composition',
        prompt: 'beautiful portrait photography, soft natural lighting, aesthetic composition, Instagram-style, vibrant colors, bokeh background, professional quality, fashionable style',
        style: 'artistic',
        platform: 'instagram',
        tags: ['portrait', 'instagram', 'beautiful', 'aesthetic', 'social-media'],
        cost: 12,
        unlockCost: 80,
        category: 'photography',
        isActive: true
      },
      {
        title: 'Product Photography',
        description: '🛍️ Professional product photos for e-commerce and marketing',
        prompt: 'professional product photography, clean white background, studio lighting, high-resolution, commercial quality, detailed, sharp focus, marketing ready',
        style: 'photographic',
        platform: 'ecommerce',
        tags: ['product', 'commercial', 'ecommerce', 'marketing', 'studio'],
        cost: 18,
        unlockCost: 120,
        category: 'commercial',
        isActive: true
      },
      {
        title: 'Fantasy Character',
        description: '🧙‍♂️ Transform into a magical fantasy character with mystical elements',
        prompt: 'fantasy character portrait, magical elements, mystical background, fantasy art style, detailed costume, magical lighting, enchanted atmosphere, high fantasy aesthetic',
        style: 'artistic',
        platform: 'instagram',
        tags: ['fantasy', 'character', 'magical', 'mystical', 'art'],
        cost: 22,
        unlockCost: 150,
        category: 'fantasy',
        isActive: true
      },
      {
        title: 'Cyberpunk Style',
        description: '🤖 Futuristic cyberpunk transformation with neon and tech elements',
        prompt: 'cyberpunk style portrait, neon lighting, futuristic elements, high-tech background, cyberpunk aesthetic, neon colors, digital art style, sci-fi atmosphere',
        style: 'artistic',
        platform: 'instagram',
        tags: ['cyberpunk', 'futuristic', 'neon', 'sci-fi', 'tech'],
        cost: 20,
        unlockCost: 130,
        category: 'sci-fi',
        isActive: true
      },
      {
        title: 'AI Mermaid Transform',
        description: '🧜‍♀️ Biến thành nàng tiên cá AI siêu đẹp! Trend 2M người dùng trên TikTok',
        prompt: 'Transform this person into a stunning mermaid underwater. Apply these specific features: magical mermaid tail with iridescent scales in turquoise and purple, flowing hair that moves like underwater currents, ethereal underwater lighting with sunbeams, coral reef background with tropical fish, dreamy aquatic atmosphere, ocean goddess aesthetic, pearl-like skin glow, enchanted expression. Maintain original facial features and pose while adding mermaid elements. High-quality fantasy art style.',
        style: 'artistic',
        platform: 'tiktok',
        tags: ['mermaid', 'underwater', 'fantasy', 'viral', 'trending', 'transform', 'biến đổi'],
        cost: 25,
        unlockCost: 200,
        category: 'viral-trends',
        isActive: true
      },
      {
        title: 'AI Manga Style',
        description: '🎌 Manga Nhật siêu hot! Biến thành nhân vật manga với đôi mắt to tròn',
        prompt: 'Transform this person into Japanese manga/anime style with characteristic large expressive eyes, soft cel-shaded coloring, clean line art, typical anime facial proportions with small nose and mouth, vibrant hair colors, smooth skin rendering, anime character aesthetic, manga art style with detailed shading and highlights, kawaii elements, professional anime artwork quality.',
        style: 'artistic',
        platform: 'instagram',
        tags: ['manga', 'anime', 'japanese', 'kawaii', 'trending', 'transform', 'biến đổi'],
        cost: 20,
        unlockCost: 180,
        category: 'viral-trends',
        isActive: true
      },
      {
        title: 'Pixar Character Transform',
        description: '🎬 Disney Pixar 3D siêu cute! Biến thành nhân vật hoạt hình Pixar',
        prompt: 'Transform this person into a Disney Pixar 3D animated character with characteristic large expressive eyes, soft rounded features, vibrant colors and lighting, 3D render style typical of Pixar movies, friendly and approachable character design, high-quality 3D animation aesthetic, Disney-style character proportions, cheerful expression, professional 3D character modeling quality.',
        style: 'artistic',
        platform: 'instagram',
        tags: ['pixar', 'disney', '3d', 'animation', 'transform', 'biến đổi'],
        cost: 22,
        unlockCost: 170,
        category: 'viral-trends',
        isActive: true
      },
      {
        title: 'AI Portrait - Lensa Style',
        description: '✨ AI Portrait siêu thật! Tạo avatar nghệ thuật như ứng dụng Lensa AI',
        prompt: 'Create an AI-generated artistic portrait with enhanced beauty features, soft artistic filters, dreamy background with bokeh effects, enhanced skin smoothing and professional retouching, artistic color grading with warm tones, subtle makeup enhancement, professional photography lighting, high-resolution portrait quality. The style should be realistic but artistically enhanced, similar to premium AI portrait generators.',
        style: 'artistic',
        platform: 'instagram',
        tags: ['ai-portrait', 'beauty', 'professional', 'trending', 'transform', 'biến đổi'],
        cost: 18,
        unlockCost: 160,
        category: 'viral-trends',
        isActive: true
      },
      {
        title: 'Kitten Shadow Effect',
        description: '😸 Trend bóng đen con mèo viral! Hiệu ứng bóng mèo cute siêu hot',
        prompt: 'Create a cute shadow effect where the person casts a shadow of a playful kitten or cat. The shadow should be clearly defined, showing cat ears, tail, and playful cat poses. The lighting should be dramatic to emphasize the shadow effect, with the main subject clearly visible while their shadow transforms into an adorable kitten silhouette. Artistic lighting with strong contrast between light and shadow areas.',
        style: 'artistic',
        platform: 'tiktok',
        tags: ['kitten', 'shadow', 'cute', 'viral', 'trending', 'transform', 'biến đổi'],
        cost: 16,
        unlockCost: 140,
        category: 'viral-trends',
        isActive: true
      },
      {
        title: 'Vintage Film Style',
        description: '📸 Aesthetic retro vintage! Biến ảnh thành phong cách film cổ điển',
        prompt: 'Transform this image into vintage film photography style with authentic retro characteristics: film grain texture, warm color grading with vintage tones, soft vignetting around edges, slightly faded colors typical of old photographs, analog film aesthetic with subtle light leaks, classic portrait composition, nostalgic atmosphere with muted colors. High-quality vintage film emulation with authentic period styling.',
        style: 'artistic',
        platform: 'instagram',
        tags: ['vintage', 'retro', 'film', 'aesthetic', 'transform', 'biến đổi'],
        cost: 14,
        unlockCost: 110,
        category: 'photography',
        isActive: true
      },
      {
        title: '3D Avatar Style',
        description: '🎮 3D Avatar siêu chất! Biến thành nhân vật game 3D chuyên nghiệp',
        prompt: 'Transform this person into a high-quality 3D avatar with game-character styling. Features should include: detailed 3D modeling with realistic textures, dynamic pose and confident expression, professional 3D rendering with proper lighting and shadows, stylized proportions balancing realism and artistic appeal, vibrant colors and clean geometric details, modern 3D character design aesthetic. High-resolution 3D artwork suitable for gaming or virtual environments.',
        style: 'artistic',
        platform: 'instagram',
        tags: ['3d', 'avatar', 'gaming', 'modern', 'transform', 'biến đổi'],
        cost: 20,
        unlockCost: 150,
        category: 'sci-fi',
        isActive: true
      }
    ]

    // Create all templates
    const createdTemplates = await prisma.template.createMany({
      data: defaultTemplates
    })

    console.log('🔧 Default templates initialized in PostgreSQL:', createdTemplates.count)
    return await getAllTemplates()
  } catch (error) {
    console.error('Error initializing default templates in PostgreSQL:', error)
    return []
  }
}

// Category functions using PostgreSQL
export async function getAllCategories(): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      displayName: category.displayName,
      description: category.description,
      icon: category.icon,
      color: category.color,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }))
  } catch (error) {
    console.error('Error getting all categories from PostgreSQL:', error)
    // Initialize categories if none exist
    return await initializeDefaultCategories()
  }
}

export async function getCategoryById(categoryId: string): Promise<Category | null> {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId, isActive: true }
    })

    if (!category) return null

    return {
      id: category.id,
      name: category.name,
      displayName: category.displayName,
      description: category.description,
      icon: category.icon,
      color: category.color,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }
  } catch (error) {
    console.error('Error getting category by ID from PostgreSQL:', error)
    return null
  }
}

export async function saveCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
  try {
    const newCategory = await prisma.category.create({
      data: {
        name: category.name,
        displayName: category.displayName,
        description: category.description,
        icon: category.icon,
        color: category.color,
        isActive: category.isActive,
        sortOrder: category.sortOrder
      }
    })

    console.log('✅ Category saved to PostgreSQL:', newCategory.name)
    return {
      id: newCategory.id,
      name: newCategory.name,
      displayName: newCategory.displayName,
      description: newCategory.description,
      icon: newCategory.icon,
      color: newCategory.color,
      isActive: newCategory.isActive,
      sortOrder: newCategory.sortOrder,
      createdAt: newCategory.createdAt,
      updatedAt: newCategory.updatedAt
    }
  } catch (error) {
    console.error('Error saving category to PostgreSQL:', error)
    throw error
  }
}

// Initialize default categories in PostgreSQL
async function initializeDefaultCategories(): Promise<Category[]> {
  try {
    // Check if categories already exist
    const existingCount = await prisma.category.count()
    if (existingCount > 0) {
      console.log('✅ Categories already exist in PostgreSQL, skipping initialization')
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      })
      return categories.map(category => ({
        id: category.id,
        name: category.name,
        displayName: category.displayName,
        description: category.description,
        icon: category.icon,
        color: category.color,
        isActive: category.isActive,
        sortOrder: category.sortOrder,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }))
    }

    const defaultCategories = [
      {
        name: 'all',
        displayName: 'All',
        description: 'All templates across all categories',
        icon: '🌟',
        color: '#3B82F6',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'viral-trends',
        displayName: 'Viral Trends',
        description: 'Hot trending templates viral on social media',
        icon: '🔥',
        color: '#EF4444',
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'transform',
        displayName: 'Transform',
        description: 'AI photo transformation templates',
        icon: '✨',
        color: '#8B5CF6',
        isActive: true,
        sortOrder: 3
      },
      {
        name: 'photography',
        displayName: 'Photography',
        description: 'Professional photography templates',
        icon: '📸',
        color: '#10B981',
        isActive: true,
        sortOrder: 4
      },
      {
        name: 'commercial',
        displayName: 'Commercial',
        description: 'Business and commercial templates',
        icon: '💼',
        color: '#F59E0B',
        isActive: true,
        sortOrder: 5
      },
      {
        name: 'fantasy',
        displayName: 'Fantasy',
        description: 'Fantasy and magical world templates',
        icon: '🧙‍♂️',
        color: '#EC4899',
        isActive: true,
        sortOrder: 6
      },
      {
        name: 'sci-fi',
        displayName: 'Sci-Fi',
        description: 'Science fiction and futuristic templates',
        icon: '🚀',
        color: '#06B6D4',
        isActive: true,
        sortOrder: 7
      }
    ]

    // Create all categories
    const createdCategories = await prisma.category.createMany({
      data: defaultCategories
    })

    console.log('📂 Default categories initialized in PostgreSQL:', createdCategories.count)
    return await getAllCategories()
  } catch (error) {
    console.error('Error initializing default categories in PostgreSQL:', error)
    return []
  }
}

// Initialize default data on app startup
export async function initializeDefaultData(): Promise<void> {
  try {
    console.log('🚀 Initializing default data in PostgreSQL...')
    
    // Initialize categories first
    await initializeDefaultCategories()
    
    // Then initialize templates
    await initializeDefaultTemplates()
    
    console.log('✅ Default data initialization complete!')
  } catch (error) {
    console.error('❌ Error initializing default data:', error)
  }
} 