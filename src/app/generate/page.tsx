'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wand2, 
  Download, 
  Share, 
  Heart, 
  Copy, 
  Settings, 
  Sparkles,
  Image as ImageIcon,
  Palette,
  Sliders,
  Zap,
  ArrowLeft,
  AlertCircle,
  X,
  MessageSquare,
  Eye,
  Star,
  Upload,
  RefreshCw,
  Edit3,
  Lock,
  Unlock,
  HeartHandshake,
  Loader,
  ChevronDown,
  ChevronUp,
  Info,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Check
} from 'lucide-react'
import Link from 'next/link'
import ImageCropper from '@/components/ImageCropper'
import { getAndClearTemplateData } from '@/lib/template-utils'
import { BuyTokensModal } from '@/components/ui/BuyTokensModal'

interface GenerationSettings {
  size: string
  style: string
  quality: string
  platform: string
}

interface GenerationResult {
  success: boolean
  imageUrl?: string
  prompt?: string
  caption?: string
  settings?: {
    size: string
    style: string
    quality: string
  }
  generatedAt?: string
  newTokenBalance?: number
  tokenCost?: number
  error?: string
}

interface ImageForCropping {
  file: File
  previewUrl: string
}

// Loading component for Suspense fallback
function GenerateLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader className="h-5 w-5 animate-spin text-indigo-600" />
        <span>Loading generator...</span>
      </div>
    </div>
  )
}

// Main Generate component that uses useSearchParams
function GeneratePageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<any[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [tokens, setTokens] = useState(90)
  const [showVariations, setShowVariations] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<GenerationSettings>({
    size: '1024x1024',
    style: 'realistic',
    quality: 'standard',
    platform: 'instagram'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false)
  const [caption, setCaption] = useState('')
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false)
  const [isEditingExistingImage, setIsEditingExistingImage] = useState(false)
  const [editingImageId, setEditingImageId] = useState<string | null>(null)
  const [isFromTemplate, setIsFromTemplate] = useState(false)
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [promptUnlocked, setPromptUnlocked] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isTransformTemplate, setIsTransformTemplate] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [templateInfo, setTemplateInfo] = useState<{title?: string, description?: string, cost?: number} | null>(null)
  
  // Template and suggestion tracking
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [suggestionId, setSuggestionId] = useState<string | null>(null)
  const [generationSource, setGenerationSource] = useState<'template' | 'suggestion' | 'manual' | null>(null)
  
  // Template unlock system
  const [isTemplateUnlocked, setIsTemplateUnlocked] = useState(false)
  const [hiddenPrompt, setHiddenPrompt] = useState<string | null>(null)
  const [isCheckingUnlock, setIsCheckingUnlock] = useState(false)
  
  // New states for image cropping
  const [imageForCropping, setImageForCropping] = useState<ImageForCropping | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  
  // Buy tokens modal
  const [showBuyTokensModal, setShowBuyTokensModal] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/login')
    }

    // Load user's current token balance from database
    const fetchTokens = async () => {
      try {
        const response = await fetch('/api/users/tokens')
        const data = await response.json()
        
        if (data.success) {
          setTokens(data.tokens)
        }
      } catch (error) {
        console.error('Failed to fetch tokens:', error)
      }
    }

    fetchTokens()
  }, [session, status])

  // Restore state from URL parameters (when coming from preview, edit, or template)
  useEffect(() => {
    const imageParam = searchParams.get('image')
    const idParam = searchParams.get('id')
    const modeParam = searchParams.get('mode')
    const templateParam = searchParams.get('template')

    // Handle template from URL parameter (load from database)
    if (templateParam) {
      console.log('🎯 Template ID detected in URL:', templateParam)
      loadTemplateData(templateParam)
    } else {
      // Fallback to URL parameters for backwards compatibility (mostly for suggestions)
      const promptParam = searchParams.get('prompt')
      const captionParam = searchParams.get('caption')
      const styleParam = searchParams.get('style')
      const platformParam = searchParams.get('platform')
      const templateIdParam = searchParams.get('templateId')
      const suggestionIdParam = searchParams.get('suggestionId')
      const suggestionTitleParam = searchParams.get('suggestionTitle')
      const fromParam = searchParams.get('from')

      // Set tracking information
      if (templateIdParam) {
        setTemplateId(templateIdParam)
        setGenerationSource('template')
        loadTemplateData(templateIdParam)
      } else if (suggestionIdParam) {
        setSuggestionId(suggestionIdParam)
        setGenerationSource('suggestion')
      } else {
        setGenerationSource('manual')
      }

      // For suggestions, prompt is not hidden
      if (fromParam === 'suggestions' && promptParam) {
        setPrompt(decodeURIComponent(promptParam))
        setIsFromTemplate(false)
      }

      // Do NOT set prompt from URL if we have an image ID - it will be loaded from database
      // This prevents template prompts from being exposed via URL parameters
      if (!idParam && promptParam && fromParam !== 'suggestions') {
        // Only set prompt from URL if it's not an image edit and not from suggestions
        console.log('⚠️ Warning: Setting prompt from URL param (non-template, non-image edit):', promptParam.substring(0, 50) + '...')
        setPrompt(decodeURIComponent(promptParam))
      }

      // Set other parameters (but don't set them if we have an image ID - they'll be loaded from database)
      if (!idParam) {
        if (captionParam) setCaption(decodeURIComponent(captionParam))
        if (styleParam || platformParam) {
          setSettings(prev => ({
            ...prev,
            ...(styleParam && { style: styleParam }),
            ...(platformParam && { platform: platformParam })
          }))
        }
      }

      // Extract template/suggestion information for display
      if (suggestionTitleParam) {
        setTemplateInfo({
          title: decodeURIComponent(suggestionTitleParam),
          description: 'AI-generated content suggestion'
        })
      }
    }

    // Handle image and ID parameters (these can stay in URL for direct linking)
    if (imageParam) {
      const decodedImageUrl = decodeURIComponent(imageParam)
      console.log('🖼️ Setting image from URL param:', decodedImageUrl)
      
      // Always set as generated image for preview/edit
      setGeneratedImages([decodedImageUrl])
    }

    if (idParam) {
      console.log('✏️ Setting up editing mode for image ID:', idParam)
      setEditingImageId(idParam)
      setIsEditingExistingImage(true)
      
      // Clean URL if we have prompt parameters for image editing (to hide template prompts)
      const hasPromptParams = searchParams.get('prompt') || searchParams.get('caption') || 
                             searchParams.get('style') || searchParams.get('platform')
      if (hasPromptParams) {
        console.log('🧹 Cleaning URL to hide template data from image edit...')
        const cleanUrl = `/generate?id=${idParam}&image=${encodeURIComponent(imageParam)}`
        window.history.replaceState({}, '', cleanUrl)
      }
      
      // When editing an existing image, try to load template data if the image was created from a template
      loadImageTemplateData(idParam)
    }
  }, [searchParams])

  // Function to check if template is unlocked for current user
  const checkTemplateUnlock = async (templateId: string) => {
    if (!templateId) return
    
    setIsCheckingUnlock(true)
    try {
      const response = await fetch(`/api/templates/unlock?templateId=${templateId}`)
      const data = await response.json()
      
      if (data.success) {
        setIsTemplateUnlocked(data.isUnlocked)
        console.log('🔒 Template unlock status:', data.isUnlocked ? 'UNLOCKED' : 'LOCKED')
        
        // If unlocked, show the prompt
        if (data.isUnlocked && hiddenPrompt) {
          setPrompt(hiddenPrompt)
          setPromptUnlocked(true)
        }
      }
    } catch (error) {
      console.error('Error checking template unlock:', error)
      setIsTemplateUnlocked(false)
    } finally {
      setIsCheckingUnlock(false)
    }
  }

  // Function to load template data for an existing image (when editing)
  const loadImageTemplateData = async (imageId: string) => {
    try {
      console.log('🔍 Loading image template data for image:', imageId)
      
      const response = await fetch(`/api/images/${imageId}`)
      const data = await response.json()
      
      if (data.success && data.image) {
        const image = data.image
        console.log('📸 Loaded image data:', {
          id: image.id,
          templateId: image.templateId,
          prompt: image.prompt?.substring(0, 100) + '...',
          hasTemplate: !!image.templateId
        })
        
        // Load template data first if this image was created from a template
        if (image.templateId) {
          console.log('✅ Image has template ID:', image.templateId)
          await loadTemplateData(image.templateId)
          
          // For transform templates, load both original and transformed images
          if (image.originalImageUrl) {
            console.log('🔄 Loading original image for transform template:', image.originalImageUrl)
            setUploadedImage(image.originalImageUrl)
            // Keep the transformed image visible in the generated image area
            // So user can see the result while being able to edit with the original image
          }
        } else {
          console.log('ℹ️ Image was not created from a template')
          
          // Only set prompt from saved image if it's not from a template
          if (image.prompt) {
            console.log('📝 Setting prompt from saved image (non-template):', image.prompt.substring(0, 100) + '...')
            setPrompt(image.prompt)
          }
        }
        
        // Always set caption from saved image
        if (image.caption) {
          setCaption(image.caption)
        }
      } else {
        console.log('❌ Failed to load image data')
      }
    } catch (error) {
      console.error('Error loading image template data:', error)
      // Don't show error to user, it's optional functionality
    }
  }

  // Function to load template data from template ID (for direct URL access)
  const loadTemplateData = async (templateId: string) => {
    try {
      console.log('🔍 Loading template data from database:', templateId)
      
      const response = await fetch(`/api/templates?id=${templateId}`)
      const data = await response.json()
      
      if (data.success && data.template) {
        const template = data.template
        console.log('✅ Template loaded from database:', template.title)
        
        // Set template information
        setIsFromTemplate(true)
        setIsTransformTemplate(template.type === 'TRANSFORM' || template.requiresUpload === true)
        setTemplateId(template.id)
        setGenerationSource('template')
        
        // Set template info for display
        setTemplateInfo({
          title: template.title,
          description: template.description,
          cost: template.cost
        })
        
        // Store hidden prompt - templates always start with hidden prompts
        setHiddenPrompt(template.prompt)
        
        // For all templates (including transform), don't show prompt initially
        // The hidden prompt will be used for generation via effectivePrompt logic
        setPrompt('') // Always start with empty visible prompt
        setPromptUnlocked(false) // Prompt is locked for viewing until unlocked
        
        console.log('✅ Template prompt stored as hidden:', template.prompt.substring(0, 100) + '...')
        console.log('🔄 Is transform template:', template.type === 'TRANSFORM' || template.requiresUpload === true)
        
        // Always check unlock status to show unlock option
        await checkTemplateUnlock(template.id)
        
        // Set settings
        setSettings(prev => ({
          ...prev,
          style: template.style || 'realistic',
          platform: template.platform || 'instagram'
        }))
        
        console.log('🎯 Template loaded successfully from database')
      } else {
        console.warn('❌ Template not found in database:', templateId)
        setError('Template not found')
      }
    } catch (error) {
      console.error('Error loading template data:', error)
      setError('Failed to load template data')
    }
  }

  const sizeOptions = [
    { value: '1024x1024', label: 'Square (1:1)', price: 25 },
    { value: '1024x1792', label: 'Portrait (9:16)', price: 30 },
    { value: '1792x1024', label: 'Landscape (16:9)', price: 30 },
    { value: '1080x1920', label: 'Story (9:16)', price: 25 },
  ]

  const styleOptions = [
    { value: 'realistic', label: 'Realistic' },
    { value: 'artistic', label: 'Artistic' },
    { value: 'anime', label: 'Anime' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'vintage', label: 'Vintage' },
  ]

  const platformOptions = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'tiktok', label: 'TikTok' },
  ]

  const handleGenerate = async () => {
    // For templates, always use hidden prompt; for manual, use visible prompt
    const effectivePrompt = isFromTemplate && hiddenPrompt ? hiddenPrompt : prompt.trim()
    
    console.log('🎯 Generation prompt logic:', {
      isFromTemplate,
      hasHiddenPrompt: !!hiddenPrompt,
      hiddenPromptLength: hiddenPrompt?.length || 0,
      hiddenPromptPreview: hiddenPrompt?.substring(0, 150) + '...',
      visiblePrompt: prompt.trim(),
      effectivePrompt: effectivePrompt.substring(0, 150) + '...',
      isTransformTemplate,
      templateId,
      templateTitle: templateInfo?.title
    })
    
    if (!effectivePrompt) {
      setError('Please enter a prompt or use a template')
      return
    }

    // For transform templates, ensure image is uploaded
    if (isTransformTemplate && !uploadedImage) {
      setError('Please upload an image for transformation')
      return
    }

    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: effectivePrompt, // Use effective prompt (hidden or visible)
          size: settings.size,
          style: settings.style,
          quality: settings.quality,
          templateId: templateId,
          suggestionId: suggestionId,
          generationSource: generationSource,
          templateCost: templateInfo ? templateInfo.cost : undefined, // Pass template cost for proper token deduction
          ...(isTransformTemplate && { 
            transform: true, 
            sourceImage: uploadedImage
          })
        })
      })

      const data: GenerationResult = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }

      if (data.success) {
        setGeneratedImages([data.imageUrl ?? null])
        
        // Update token balance from API response (tokens should be deducted on server side)
        if (data.newTokenBalance !== undefined) {
          setTokens(data.newTokenBalance)
          console.log('💰 Token balance updated:', data.newTokenBalance)
        } else {
          // Fallback: refresh token balance from API
          try {
            const tokenResponse = await fetch('/api/users/tokens')
            const tokenData = await tokenResponse.json()
            if (tokenData.success) {
              setTokens(tokenData.tokens)
            }
          } catch (tokenError) {
            console.error('Error refreshing token balance:', tokenError)
          }
        }
        
        // Auto-save to database immediately after generation
        if (data.imageUrl) {
          try {
            // Only auto-save if we're not editing an existing image
            if (!editingImageId) {
              await fetch('/api/images', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  imageUrl: data.imageUrl,
                  prompt: data.prompt || effectivePrompt, // Save effective prompt used
                  caption: caption,
                  settings: {
                    ...settings,
                    ...data.settings
                  },
                  templateId: templateId,
                  suggestionId: suggestionId,
                  generationSource: generationSource
                })
              })
            }
          } catch (saveError) {
            console.error('Auto-save error:', saveError)
            // Don't show error to user, they can manually save later
          }
        }
        
        // Reset editing state when generating new image
        setIsEditingExistingImage(false)
      }
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedImages.length) return
    
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      // If we're editing an existing image, use PUT to update it
      if (editingImageId) {
        const response = await fetch(`/api/images/${editingImageId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: generatedImages[selectedImageIndex],
            prompt: isFromTemplate && hiddenPrompt ? hiddenPrompt : prompt.trim(), // Use effective prompt
            caption: caption,
            settings: settings,
            templateId: templateId,
            suggestionId: suggestionId,
            generationSource: generationSource
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update image')
        }

        if (data.success) {
          setSuccessMessage('✅ Image updated successfully!')
          setTimeout(() => setSuccessMessage(null), 3000)
        }
      } else {
        // If it's a new image, use POST to create it
        const response = await fetch('/api/images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: generatedImages[selectedImageIndex],
            prompt: isFromTemplate && hiddenPrompt ? hiddenPrompt : prompt.trim(), // Use effective prompt
            caption: caption,
            settings: settings,
            templateId: templateId,
            suggestionId: suggestionId,
            generationSource: generationSource
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to save image')
        }

        if (data.success) {
          setSuccessMessage('✅ Image and caption saved to gallery successfully!')
          setTimeout(() => setSuccessMessage(null), 3000)
        }
      }
    } catch (err) {
      console.error('Save error:', err)
      setError(editingImageId ? 'Failed to update image' : 'Failed to save image to gallery')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedImages.length) return
    
    setIsDownloading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const response = await fetch(generatedImages[selectedImageIndex])
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `eacon-generated-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      setSuccessMessage('💾 Image downloaded successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Download error:', err)
      setError('Failed to download image')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = async () => {
    if (!generatedImages.length) return
    
    setIsSharing(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Eacon AI Generated Image',
          text: `Check out this AI-generated image: "${prompt}"`,
          url: generatedImages[selectedImageIndex]
        })
        setSuccessMessage('📤 Image shared successfully!')
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(generatedImages[selectedImageIndex])
        setSuccessMessage('📋 Image URL copied to clipboard!')
      }
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled share dialog, don't show error
        return
      }
      console.error('Share error:', err)
      setError('Failed to share image')
    } finally {
      setIsSharing(false)
    }
  }

  const handleImprovePrompt = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt first')
      return
    }

    if (tokens < 2) {
      setError('Not enough tokens (2 required for prompt improvement)')
      setShowBuyTokensModal(true)
      return
    }

    setIsImprovingPrompt(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/improve-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: settings.style
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to improve prompt')
      }

      if (data.success) {
        setPrompt(data.improvedPrompt)
        
        // Deduct 2 tokens for prompt improvement
        try {
          const tokenResponse = await fetch('/api/users/tokens', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: 2,
              type: 'USED',
              description: 'AI prompt improvement'
            })
          })

          const tokenData = await tokenResponse.json()
          
          if (tokenData.success) {
            setTokens(tokenData.newBalance)
          } else {
            console.error('Failed to deduct tokens for prompt improvement:', tokenData.error)
            setTokens(prev => prev - 2) // Fallback
          }
        } catch (tokenError) {
          console.error('Token deduction error:', tokenError)
          setTokens(prev => prev - 2) // Fallback
        }
        
        setSuccessMessage('✨ Prompt improved by AI! Enhanced with better details and style.')
        setTimeout(() => setSuccessMessage(null), 4000)
      }
    } catch (err) {
      console.error('Improve prompt error:', err)
      setError(err instanceof Error ? err.message : 'Failed to improve prompt')
    } finally {
      setIsImprovingPrompt(false)
    }
  }

  const handleUsePromptAgain = async () => {
    try {
      // Copy current prompt to clipboard
      await navigator.clipboard.writeText(prompt)
      
      // Clear current image and caption to prepare for regeneration
      setGeneratedImages([])
      setCaption('')
      setError(null)
      setSuccessMessage('📋 Prompt copied! Ready to generate again.')
      
      // Auto-hide success message
      setTimeout(() => setSuccessMessage(null), 3000)
      
      // Scroll to top to see the prompt input
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Copy prompt error:', err)
      // Fallback: just clear image for regeneration
      setGeneratedImages([])
      setCaption('')
      setError(null)
      setSuccessMessage('🔄 Ready to generate again!')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const handleUnlockPrompt = async () => {
    if (!templateInfo || !templateId || !hiddenPrompt) {
      setError('No template information available')
      return
    }

    // Get template data to check unlock cost
    try {
      const templateResponse = await fetch(`/api/templates?id=${templateId}`)
      const templateData = await templateResponse.json()
      
      if (!templateData.success || !templateData.template) {
        setError('Template not found')
        return
      }

      const template = templateData.template
      const unlockCost = template.unlockCost || 100 // Default unlock cost

      if (tokens < unlockCost) {
        setError(`Not enough tokens. Need ${unlockCost} tokens to unlock prompt.`)
        setShowBuyTokensModal(true)
        return
      }

      setIsUnlocking(true)
      setError(null)

      // Deduct unlock tokens
      const tokenResponse = await fetch('/api/users/tokens', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: unlockCost,
          type: 'USED',
          description: `Template prompt unlock - ${templateInfo.title}`
        })
      })

      const tokenData = await tokenResponse.json()

      if (tokenData.success) {
        setTokens(tokenData.newBalance)

        // Create unlock record
        const unlockResponse = await fetch('/api/templates/unlock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateId: templateId
          })
        })

        const unlockData = await unlockResponse.json()

        if (unlockData.success) {
          // Show the unlocked prompt
          setPrompt(hiddenPrompt)
          setPromptUnlocked(true)
          setIsTemplateUnlocked(true)
          setSuccessMessage(`🔓 Prompt unlocked! Used ${unlockCost} tokens.`)
          setTimeout(() => setSuccessMessage(null), 5000)
        } else {
          throw new Error(unlockData.error || 'Failed to record unlock')
        }
      } else {
        throw new Error(tokenData.error || 'Failed to deduct tokens')
      }
    } catch (error) {
      console.error('Unlock prompt error:', error)
      setError(error instanceof Error ? error.message : 'Failed to unlock prompt')
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, WebP)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Please upload an image smaller than 5MB')
      return
    }

    setError(null)

    // Create preview URL for cropper
    const previewUrl = URL.createObjectURL(file)
    
    // Set up image for cropping
    setImageForCropping({
      file,
      previewUrl
    })
    
    // Show cropper modal
    setShowCropper(true)
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setShowCropper(false)
    setIsUploadingImage(true)
    setError(null)

    try {
      // Clean up preview URL
      if (imageForCropping?.previewUrl) {
        URL.revokeObjectURL(imageForCropping.previewUrl)
      }

      // Create FormData with cropped image
      const formData = new FormData()
      formData.append('image', croppedImageBlob, 'cropped-image.png')

      console.log('🔄 Uploading cropped image...', {
        blobSize: croppedImageBlob.size,
        blobType: croppedImageBlob.type
      })

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      console.log('📤 Upload response:', data)

      if (data.success) {
        console.log('✅ Setting uploadedImage to:', data.imageUrl)
        setUploadedImage(data.imageUrl)
        setSuccessMessage('📸 Image cropped and uploaded successfully! Ready for transformation.')
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        throw new Error(data.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      setError(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploadingImage(false)
      setImageForCropping(null)
    }
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    
    // Clean up preview URL
    if (imageForCropping?.previewUrl) {
      URL.revokeObjectURL(imageForCropping.previewUrl)
    }
    
    setImageForCropping(null)
  }

  const generateImageCaption = async () => {
    if (!generatedImages.length) {
      setError('Please generate an image first')
      return
    }

    if (tokens < 3) {
      setError('Not enough tokens (3 required for caption generation)')
      setShowBuyTokensModal(true)
      return
    }

    setIsGeneratingCaption(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: generatedImages[selectedImageIndex],
          style: settings.style,
          platform: settings.platform
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate caption')
      }

      if (data.success) {
        setCaption(data.caption)
        
        // Deduct 3 tokens for caption generation
        try {
          const tokenResponse = await fetch('/api/users/tokens', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: 3,
              type: 'USED',
              description: 'AI caption generation'
            })
          })

          const tokenData = await tokenResponse.json()
          
          if (tokenData.success) {
            setTokens(tokenData.newBalance)
          } else {
            console.error('Failed to deduct tokens for caption generation:', tokenData.error)
            setTokens(prev => prev - 3) // Fallback
          }
        } catch (tokenError) {
          console.error('Token deduction error:', tokenError)
          setTokens(prev => prev - 3) // Fallback
        }
        
        setSuccessMessage('✨ Caption generated successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err) {
      console.error('Caption generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate caption')
    } finally {
      setIsGeneratingCaption(false)
    }
  }

  const getCurrentPrice = () => {
    // If using template, use template cost instead of size-based pricing
    if (templateInfo && templateInfo.cost !== undefined) {
      return templateInfo.cost
    }
    
    // Fallback to size-based pricing for manual generations
    const sizeOption = sizeOptions.find(option => option.value === settings.size)
    return sizeOption?.price || 25
  }

  // Add debug logging for button state
  useEffect(() => {
    console.log('🔍 Generate Button State Debug:', {
      prompt: prompt.trim(),
      promptLength: prompt.trim().length,
      isGenerating,
      tokens,
      currentPrice: getCurrentPrice(),
      hasEnoughTokens: tokens >= getCurrentPrice(),
      isTransformTemplate,
      uploadedImage,
      templateId,
      templateInfo,
      buttonShouldBeEnabled: prompt.trim() && !isGenerating && tokens >= getCurrentPrice() && (!isTransformTemplate || uploadedImage),
      generatedImages: generatedImages.map(img => img?.substring(0, 50) + '...'),
      selectedImageIndex,
      isEditingExistingImage
    })
  }, [prompt, isGenerating, tokens, isTransformTemplate, uploadedImage, templateId, templateInfo, generatedImages, selectedImageIndex, isEditingExistingImage])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link 
                href="/dashboard"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wand2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Image Generator</h1>
                <p className="text-gray-600">Create stunning visuals with artificial intelligence</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Token balance moved below to be aligned with action buttons */}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Template Info Banner */}
        {templateInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900">
                  🎯 Using Template: {templateInfo.title}
                </h3>
                {templateInfo.description && (
                  <p className="text-blue-700 text-sm mt-1">
                    {templateInfo.description}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-xs text-blue-600">
                  <span>Style: <span className="font-medium capitalize">{settings.style}</span></span>
                  {isTransformTemplate && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                      🔄 Transform Mode - Upload Required
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3"
          >
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Generation Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}

        {/* Success Message Display */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3"
          >
            <div className="flex-1">
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-400 hover:text-green-600"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Prompt Input */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {isFromTemplate ? 'Template Selected' : 'Describe Your Image'}
                </h3>
              </div>
              
              <div className="space-y-3">
                {isFromTemplate ? (
                  // Show template info instead of editable prompt
                  <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          {templateInfo?.title || 'Premium Template Active'}
                        </span>
                      </div>
                      {!isTemplateUnlocked ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Professional prompt hidden. Unlock to view and edit.
                          </span>
                          <button
                            onClick={handleUnlockPrompt}
                            disabled={isUnlocking || isCheckingUnlock}
                            className="text-xs px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium shadow-sm"
                          >
                            {isUnlocking || isCheckingUnlock ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1 inline-block"></div>
                                Unlocking...
                              </>
                            ) : (
                              <>
                                🔓 Unlock Prompt (Check cost)
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                            🔓 Unlocked Forever
                          </span>
                          <button
                            onClick={() => setShowPromptEditor(!showPromptEditor)}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            {showPromptEditor ? 'Hide Prompt' : 'Show Prompt'}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-blue-700">
                      {!isTemplateUnlocked 
                        ? 'Professional AI-optimized prompt is hidden for quality assurance. Unlock once to view and edit forever.'
                        : 'Professional AI-optimized prompt is permanently unlocked. You can view and edit it anytime.'
                      }
                    </p>
                    
                    {templateInfo?.description && (
                      <p className="text-sm text-blue-600 mt-1 italic">
                        "{templateInfo.description}"
                      </p>
                    )}
                    
                    <div className="mt-2 text-xs text-blue-600">
                      Style: <span className="font-medium capitalize">{settings.style}</span>
                      {isTransformTemplate && (
                        <span className="ml-3 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          Transform Mode
                        </span>
                      )}
                    </div>
                    
                    {/* Show prompt if unlocked and editor is open */}
                    {isTemplateUnlocked && showPromptEditor && prompt && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-blue-900 mb-1">Template Prompt (Editable):</label>
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="w-full h-24 p-3 text-sm border border-blue-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          placeholder="Professional AI-optimized prompt..."
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          ⚠️ Editing the template prompt may affect the quality of results.
                        </p>
                      </div>
                    )}
                    
                    {/* Show hint for hidden prompt */}
                    {!isTemplateUnlocked && hiddenPrompt && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0 h-5 w-5 bg-amber-100 rounded-full flex items-center justify-center">
                            <span className="text-amber-600 text-xs font-bold">?</span>
                          </div>
                          <div className="text-xs text-amber-800">
                            <p className="font-medium">Hidden Professional Prompt</p>
                            <p className="mt-1">This template contains a carefully crafted, AI-optimized prompt that ensures the highest quality results. Unlock it to see the professional techniques used.</p>
                            <p className="mt-1 text-amber-600">Prompt Length: {hiddenPrompt.length} characters</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to create... Be as detailed as possible for better results."
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
                
                {!isFromTemplate && (
                  <div className="flex justify-start">
                    <button 
                      onClick={handleImprovePrompt}
                      disabled={!prompt.trim() || isImprovingPrompt || tokens < 2}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white font-medium text-sm rounded-xl hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600 disabled:from-gray-300 disabled:via-gray-400 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                      {isImprovingPrompt ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Improving...</span>
                        </>
                      ) : tokens < 2 ? (
                        <>
                          <Sparkles className="h-4 w-4 opacity-50" />
                          <span>Need 2 tokens</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>✨ AI Improve</span>
                          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">2 tokens</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {isFromTemplate && showPromptEditor && (
                  <div className="flex justify-start">
                    <button 
                      onClick={handleImprovePrompt}
                      disabled={!prompt.trim() || isImprovingPrompt || tokens < 2}
                      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white font-medium text-xs rounded-lg hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600 disabled:from-gray-300 disabled:via-gray-400 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {isImprovingPrompt ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          <span>Improving...</span>
                        </>
                      ) : tokens < 2 ? (
                        <>
                          <Sparkles className="h-3 w-3 opacity-50" />
                          <span>Need 2 tokens</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" />
                          <span>Improve</span>
                          <span className="text-xs bg-white/20 px-1 py-0.5 rounded">2 tokens</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                <div className="text-sm text-gray-600">
                  {isFromTemplate ? (
                    <>
                      <strong>🎯 Template:</strong> This premium template includes a professionally crafted prompt optimized for the best results.
                      {!promptUnlocked && (
                        <>
                          <br />
                          <strong>🔓 Unlock Prompt:</strong> Pay unlock cost to view and edit the professional prompt for advanced customization.
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <strong>💡 Tip:</strong> Include style, colors, mood, and composition details for better results.
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Image Upload Section - Only for Transform Templates */}
            {isTransformTemplate && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Upload className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Upload Image for Transformation</h3>
                </div>

                <div className="space-y-4">
                  {!uploadedImage ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <div className="space-y-2">
                        <p className="text-gray-600">Upload an image to transform</p>
                        <p className="text-sm text-gray-500">JPG, PNG or WebP • Max 5MB</p>
                      </div>
                      
                      <label className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors">
                        {isUploadingImage ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Choose Image
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <img 
                          src={uploadedImage} 
                          alt="Uploaded" 
                          className="w-full max-h-64 object-contain rounded-lg border border-gray-300 bg-gray-50"
                        />
                        <button
                          onClick={() => setUploadedImage(null)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-green-600 font-medium">✅ Image uploaded successfully!</p>
                        <p className="text-sm text-gray-500">Ready for AI transformation</p>
                      </div>
                      
                      <label className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors text-sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Change Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                      </label>
                    </div>
                  )}

                  <div className="text-sm text-gray-600">
                    <strong>🎯 Transform Mode:</strong> Upload your image and the AI will apply the selected template transformation style using OpenAI DALL-E 2's advanced image editing technology.
                    <br />
                    <strong>🎨 Powered by OpenAI:</strong> Professional-grade image transformation with precise editing capabilities for artistic effects and style transfers.
                  </div>
                </div>
              </div>
            )}

            {/* Generation Settings */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
              </div>

              <div className="space-y-4">
                {/* Size Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Size & Aspect Ratio</label>
                  <select
                    value={settings.size}
                    onChange={(e) => setSettings({...settings, size: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.price} tokens
                      </option>
                    ))}
                  </select>
                </div>

                {/* Style Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Art Style</label>
                  <select
                    value={settings.style}
                    onChange={(e) => setSettings({...settings, style: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {styleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Platform Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                  <select
                    value={settings.platform}
                    onChange={(e) => setSettings({...settings, platform: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {platformOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Caption Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Social Media Caption</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
                  <textarea
                    value={caption}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setCaption(e.target.value)
                      }
                    }}
                    placeholder="Write your own caption or generate one with AI..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={generateImageCaption}
                    disabled={!generatedImages.length || isGeneratingCaption || tokens < 3}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGeneratingCaption ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : tokens < 3 ? (
                      'Need 3 tokens'
                    ) : !generatedImages.length ? (
                      'Generate image first'
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Generate Caption (3 tokens)
                      </>
                    )}
                  </button>

                  <div className="text-sm text-gray-500">
                    <span className={caption.length > 500 ? 'text-red-500' : ''}>
                      {caption.length}/500 characters
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <strong>💡 Tip:</strong> AI will create platform-specific captions with hashtags based on your image and settings.
                  <br />
                  <strong>✨ Auto-save:</strong> Caption will be automatically saved when you save the image to gallery.
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={
                (!prompt.trim() && !(isFromTemplate && hiddenPrompt)) || 
                isGenerating || 
                tokens < getCurrentPrice() || 
                (isTransformTemplate && !uploadedImage)
              }
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors h-12 text-lg flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isTransformTemplate ? 'Transforming...' : 'Generating...'}
                </>
              ) : tokens < getCurrentPrice() ? (
                `Not enough tokens (${getCurrentPrice()} required)`
              ) : isTransformTemplate && !uploadedImage ? (
                'Please upload an image first'
              ) : !prompt.trim() && !(isFromTemplate && hiddenPrompt) ? (
                'Please enter a prompt or use a template'
              ) : (
                <>
                  <Wand2 className="h-5 w-5 mr-2" />
                  {isTransformTemplate ? `Transform Image (${getCurrentPrice()} tokens)` : `Generate Image (${getCurrentPrice()} tokens)`}
                </>
              )}
            </button>
          </div>

          {/* Right Panel - Result */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Generated Image</h3>
              </div>

              {/* Image Display Area */}
              <div className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-6">
                {isGenerating ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Creating your masterpiece...</p>
                    <p className="text-sm text-gray-500 mt-2">This usually takes 2-3 seconds</p>
                  </div>
                ) : generatedImages.length ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group w-full h-full"
                  >
                    <img 
                      src={generatedImages[selectedImageIndex]} 
                      alt="Generated" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    
                    {/* Action Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        <button onClick={handleDownload} className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                          <Download className="h-5 w-5 text-gray-600" />
                        </button>
                        <button onClick={handleShare} className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                          <Share className="h-5 w-5 text-gray-600" />
                        </button>
                        <button onClick={handleSave} className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                          <Heart className="h-5 w-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center">
                    <Palette className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No image generated yet</p>
                    <p className="text-sm text-gray-500">Enter a prompt and click generate to create your image</p>
                  </div>
                )}
              </div>

              {/* Action Buttons and Token Balance */}
              {generatedImages.length && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={handleDownload} 
                      disabled={isDownloading}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isDownloading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={handleSave} 
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingImageId ? 'Updating...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4 mr-2" />
                          {editingImageId ? 'Update Image' : 'Save to Gallery'}
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={handleShare} 
                      disabled={isSharing}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSharing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sharing...
                        </>
                      ) : (
                        <>
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </>
                      )}
                    </button>
                    
                    <Link 
                      href={`/preview?image=${encodeURIComponent(generatedImages[selectedImageIndex])}`}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Link>
                  </div>
                  
                  {/* Token Balance aligned with action buttons */}
                  <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">{tokens} tokens</span>
                  </div>
                </div>
              )}

                             {/* Secondary Action Buttons */}
               {generatedImages.length && (
                 <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-200">
                    <button 
                      onClick={handleUsePromptAgain}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Use Prompt Again
                    </button>
                    
                    <button 
                      onClick={handleGenerate}
                      disabled={isGenerating || tokens < getCurrentPrice()}
                      className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Regenerate ({getCurrentPrice()} tokens)
                        </>
                      )}
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Image Cropper Modal */}
      {showCropper && imageForCropping && (
        <ImageCropper
          imageSrc={imageForCropping.previewUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {/* Buy Tokens Modal */}
      <BuyTokensModal
        isOpen={showBuyTokensModal}
        onClose={() => setShowBuyTokensModal(false)}
        currentTokens={tokens}
      />
    </div>
  )
}

// Wrap the Generate component in Suspense
const GeneratePage = () => {
  return (
    <Suspense fallback={<GenerateLoading />}>
      <GeneratePageContent />
    </Suspense>
  )
}

export default GeneratePage 