'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Download, 
  Share, 
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Camera,
  Eye,
  Star,
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
  AlertCircle,
  Target,
  ThumbsUp,
  Clock,
  ChevronDown,
  Calendar,
  X,
  Loader
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// Loading component for Suspense fallback
function PreviewLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader className="h-5 w-5 animate-spin text-indigo-600" />
        <span>Loading preview...</span>
      </div>
    </div>
  )
}

// Rename the main component
function PreviewPageContent() {
  const { data: session, status } = useSession()
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('instagram')
  const [aiReview, setAiReview] = useState<any>(null)
  const [tokens, setTokens] = useState<number>(0)
  const [isGeneratingReview, setIsGeneratingReview] = useState(false)
  const [showPostDropdown, setShowPostDropdown] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  
  // State for image data loaded from database
  const [imageData, setImageData] = useState<{
    prompt: string
    caption: string
    style: string
    platform: string
  } | null>(null)

  // Get parameters from URL
  const searchParams = useSearchParams()
  const imageUrl = searchParams.get('image') || ''
  const urlPrompt = searchParams.get('prompt') || ''
  const urlCaption = searchParams.get('caption') || ''
  const urlStyle = searchParams.get('style') || 'realistic'
  const urlPlatform = searchParams.get('platform') || 'instagram'
  const imageId = searchParams.get('id') || '' // Image ID for editing
  
  // Use URL params if available, otherwise use loaded data from database
  const prompt = urlPrompt || imageData?.prompt || ''
  const caption = urlCaption || imageData?.caption || ''
  const style = urlStyle !== 'realistic' ? urlStyle : (imageData?.style || 'realistic')
  const platform = urlPlatform !== 'instagram' ? urlPlatform : (imageData?.platform || 'instagram')
  
  // Extract image ID from imageUrl if not provided directly
  const getImageIdFromUrl = (url: string) => {
    if (imageId) return imageId
    // Extract filename from URL like '/uploads/filename.png'
    const match = url.match(/\/uploads\/(.+)\.(?:png|jpg|jpeg|webp)/)
    return match ? match[1] : ''
  }

  // Function to load image data from database when not provided in URL
  const loadImageData = async (imageId: string) => {
    try {
      console.log('🔍 Loading image data from database for ID:', imageId)
      
      const response = await fetch(`/api/images/${imageId}`)
      const data = await response.json()
      
      if (data.success && data.image) {
        const image = data.image
        console.log('📸 Loaded image data from database:', {
          prompt: image.prompt?.substring(0, 100) + '...',
          caption: image.caption,
          style: image.style,
          platform: image.platform
        })
        
        setImageData({
          prompt: image.prompt || '',
          caption: image.caption || '',
          style: image.style || 'realistic',
          platform: image.platform || 'instagram'
        })
      } else {
        console.log('❌ Failed to load image data from database')
      }
    } catch (error) {
      console.error('Error loading image data:', error)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/login')
    }
    
    // Load image data from database if we don't have prompt/caption from URL
    const needsDataFromDatabase = !urlPrompt || !urlCaption
    const actualImageId = imageId || getImageIdFromUrl(imageUrl)
    
    if (needsDataFromDatabase && actualImageId) {
      console.log('�� Loading image data from database (missing URL params):', {
        imageId: actualImageId,
        hasUrlPrompt: !!urlPrompt,
        hasUrlCaption: !!urlCaption
      })
      loadImageData(actualImageId)
    }
    
    // Set active tab based on URL parameter or loaded data
    const targetPlatform = urlPlatform !== 'instagram' ? urlPlatform : (imageData?.platform || 'instagram')
    if (targetPlatform) {
      setActiveTab(targetPlatform.toLowerCase())
    }

    // Load user tokens
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
  }, [session, status, imageId, imageUrl, urlPrompt, urlCaption, urlPlatform, imageData?.platform])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPostDropdown) {
        setShowPostDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPostDropdown])

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: '📷', color: 'from-purple-500 to-pink-500' },
    { id: 'facebook', name: 'Facebook', icon: '📘', color: 'from-blue-600 to-blue-700' },
    { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: 'from-gray-800 to-gray-900' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'from-blue-500 to-blue-600' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'from-black to-gray-800' },
    { id: 'youtube', name: 'YouTube', icon: '📺', color: 'from-red-500 to-red-600' },
    { id: 'ai-review', name: 'AI Review', icon: '🤖', color: 'from-violet-500 to-purple-600' }
  ]

  const generateAIReview = async () => {
    if (tokens < 5) {
      alert('Not enough tokens (5 required for AI Review)')
      return
    }

    setIsGeneratingReview(true)
    
    try {
      const response = await fetch('/api/ai-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          prompt,
          caption,
          style,
          platform: activeTab === 'ai-review' ? 'instagram' : activeTab
        })
      })

      const data = await response.json()

      if (data.success) {
        setAiReview(data.review)
        
        // Deduct tokens
        try {
          const tokenResponse = await fetch('/api/users/tokens', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: 5,
              type: 'USED',
              description: 'AI review and recommendations'
            })
          })

          const tokenData = await tokenResponse.json()
          if (tokenData.success) {
            setTokens(tokenData.newBalance)
          }
        } catch (tokenError) {
          console.error('Token deduction error:', tokenError)
          setTokens(prev => prev - 5)
        }
      }
    } catch (error) {
      console.error('AI Review error:', error)
      alert('Failed to generate AI review')
    } finally {
      setIsGeneratingReview(false)
    }
  }

  const handlePostNow = async () => {
    setIsPosting(true)
    setShowPostDropdown(false)
    
    try {
      // Simulate posting to social media
      const response = await fetch('/api/post-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          prompt,
          caption,
          style,
          platform: activeTab === 'ai-review' ? 'instagram' : activeTab
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('🎉 Post shared successfully!')
      } else {
        throw new Error(data.error || 'Failed to post')
      }
    } catch (error) {
      console.error('Post error:', error)
      alert('Failed to post. Please try again.')
    } finally {
      setIsPosting(false)
    }
  }

  const handleSchedulePost = () => {
    setShowPostDropdown(false)
    setShowScheduleModal(true)
    
    // Set default schedule time to tomorrow at 9 AM
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    
    setScheduleDate(tomorrow.toISOString().split('T')[0])
    setScheduleTime('09:00')
  }

  const handleConfirmSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      alert('Please select date and time')
      return
    }

    setIsScheduling(true)
    
    try {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`)
      
      // Check if scheduled time is in the future
      if (scheduledDateTime <= new Date()) {
        alert('Please select a future date and time')
        return
      }

      const response = await fetch('/api/schedule-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          prompt,
          caption,
          style,
          platform: activeTab === 'ai-review' ? 'instagram' : activeTab,
          scheduledAt: scheduledDateTime.toISOString()
        })
      })

      const data = await response.json()

      if (data.success) {
        alert(`📅 Post scheduled for ${scheduledDateTime.toLocaleString()}!`)
        setShowScheduleModal(false)
        setScheduleDate('')
        setScheduleTime('')
      } else {
        throw new Error(data.error || 'Failed to schedule post')
      }
    } catch (error) {
      console.error('Schedule error:', error)
      alert('Failed to schedule post. Please try again.')
    } finally {
      setIsScheduling(false)
    }
  }

  const getPlatformTemplate = () => {
    switch (activeTab) {
      case 'instagram':
        return (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Camera className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{session?.user?.name || 'Your Account'}</p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </div>
              <MoreHorizontal className="h-5 w-5 text-gray-600" />
            </div>

            {/* Image */}
            <div className="aspect-square bg-gray-100">
              <img 
                src={imageUrl} 
                alt={prompt}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/api/placeholder-image'
                }}
              />
            </div>

            {/* Actions */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4">
                  <button onClick={() => setLiked(!liked)} className="transition-colors">
                    <Heart className={`h-6 w-6 ${liked ? 'text-red-500 fill-current' : 'text-gray-700'}`} />
                  </button>
                  <MessageCircle className="h-6 w-6 text-gray-700" />
                  <Share className="h-6 w-6 text-gray-700" />
                </div>
                <button onClick={() => setSaved(!saved)} className="transition-colors">
                  <Bookmark className={`h-6 w-6 ${saved ? 'text-gray-900 fill-current' : 'text-gray-700'}`} />
                </button>
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <p className="font-semibold text-sm">
                  <span className="font-bold">{session?.user?.name?.split(' ')[0] || 'You'}</span>
                  {caption && <span className="font-normal ml-2">{caption}</span>}
                  {!caption && <span className="font-normal ml-2 text-gray-500">Generated with AI • {style} style</span>}
                </p>
              </div>
            </div>
          </div>
        )

      case 'facebook':
        return (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden border">
            {/* Header */}
            <div className="flex items-center space-x-3 p-4 border-b">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {session?.user?.name?.charAt(0) || 'Y'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="font-semibold text-sm">{session?.user?.name || 'Your Name'}</p>
                  <span className="text-xs text-gray-500">•</span>
                  <p className="text-xs text-gray-500">Just now</p>
                  <span className="text-xs text-gray-500">•</span>
                  <div className="w-3 h-3 rounded bg-gray-300"></div>
                </div>
              </div>
              <MoreHorizontal className="h-5 w-5 text-gray-600" />
            </div>

            {/* Content */}
            <div className="p-4">
              {caption && (
                <p className="text-gray-900 mb-3">{caption}</p>
              )}
              
              {/* Image */}
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt={prompt}
                  className="w-full h-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/api/placeholder-image'
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="border-t px-4 py-2">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setLiked(!liked)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 ${liked ? 'text-blue-600' : 'text-gray-600'}`}
                >
                  <ThumbsUp className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">Like</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600">
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Comment</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600">
                  <Share className="h-5 w-5" />
                  <span className="text-sm font-medium">Share</span>
                </button>
              </div>
            </div>
          </div>
        )

      case 'twitter':
        return (
          <div className="max-w-xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden border">
            <div className="flex items-start space-x-3 p-4">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {session?.user?.name?.charAt(0) || 'Y'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="font-bold text-sm text-gray-900">{session?.user?.name || 'Your Name'}</p>
                  <p className="text-sm text-gray-500">@{session?.user?.name?.toLowerCase().replace(' ', '') || 'yourhandle'} · now</p>
                </div>
                
                <div className="mt-2">
                  <p className="text-gray-900">{caption || `Just created this amazing ${style} artwork with AI! 🎨✨`}</p>
                </div>

                <div className="mt-3 rounded-lg overflow-hidden border">
                  <img 
                    src={imageUrl} 
                    alt={prompt}
                    className="w-full h-auto"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/api/placeholder-image'
                    }}
                  />
                </div>

                <div className="flex items-center justify-between mt-3 max-w-md">
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-sm">24</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500">
                    <Share className="h-5 w-5" />
                    <span className="text-sm">12</span>
                  </button>
                  <button 
                    onClick={() => setLiked(!liked)}
                    className={`flex items-center space-x-2 ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                  >
                    <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{liked ? '87' : '86'}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                    <Bookmark className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'linkedin':
        return (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden border">
            {/* Header */}
            <div className="flex items-center space-x-3 p-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">
                  {session?.user?.name?.charAt(0) || 'Y'}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{session?.user?.name || 'Your Name'}</p>
                <p className="text-xs text-gray-500">AI Content Creator • Just now</p>
              </div>
              <MoreHorizontal className="h-5 w-5 text-gray-600" />
            </div>

            {/* Content */}
            <div className="px-4 pb-4">
              {caption && (
                <p className="text-gray-900 mb-3 leading-relaxed">{caption}</p>
              )}
              
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt={prompt}
                  className="w-full h-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/api/placeholder-image'
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="border-t">
              <div className="flex items-center justify-around py-2">
                <button 
                  onClick={() => setLiked(!liked)}
                  className={`flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 ${liked ? 'text-blue-600' : 'text-gray-600'}`}
                >
                  <ThumbsUp className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                  <span className="text-sm">Like</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-gray-600">
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm">Comment</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-gray-600">
                  <Share className="h-5 w-5" />
                  <span className="text-sm">Share</span>
                </button>
              </div>
            </div>
          </div>
        )

      case 'tiktok':
        return (
          <div className="max-w-sm mx-auto bg-black rounded-2xl shadow-xl overflow-hidden text-white">
            {/* Video Container */}
            <div className="relative aspect-[9/16] bg-gray-900">
              <img 
                src={imageUrl} 
                alt={prompt}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/api/placeholder-image'
                }}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Side Actions */}
              <div className="absolute right-3 bottom-20 flex flex-col space-y-4">
                <button 
                  onClick={() => setLiked(!liked)}
                  className="flex flex-col items-center space-y-1"
                >
                  <div className="w-12 h-12 bg-gray-800/50 rounded-full flex items-center justify-center">
                    <Heart className={`h-6 w-6 ${liked ? 'text-red-500 fill-current' : 'text-white'}`} />
                  </div>
                  <span className="text-xs">{liked ? '8.9K' : '8.8K'}</span>
                </button>
                
                <button className="flex flex-col items-center space-y-1">
                  <div className="w-12 h-12 bg-gray-800/50 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs">432</span>
                </button>
                
                <button className="flex flex-col items-center space-y-1">
                  <div className="w-12 h-12 bg-gray-800/50 rounded-full flex items-center justify-center">
                    <Share className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs">Share</span>
                </button>
              </div>
              
              {/* Bottom Info */}
              <div className="absolute bottom-4 left-4 right-16">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  <span className="font-semibold text-sm">@{session?.user?.name?.toLowerCase().replace(' ', '') || 'yourhandle'}</span>
                </div>
                
                <p className="text-sm mb-2">
                  {caption || `AI generated art! 🎨✨ #AIart #${style} #CreativeProcess`}
                </p>
                
                <div className="flex items-center space-x-2 text-xs text-gray-300">
                  <span>🎵 Original Sound</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'youtube':
        return (
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Video Thumbnail */}
            <div className="relative aspect-video bg-gray-900">
              <img 
                src={imageUrl} 
                alt={prompt}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/api/placeholder-image'
                }}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-t-transparent border-b-transparent border-l-white ml-1"></div>
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                2:34
              </div>
            </div>

            {/* Video Info */}
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">
                {caption || `How I Created This ${style.charAt(0).toUpperCase() + style.slice(1)} AI Art`}
              </h3>
              
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {session?.user?.name?.charAt(0) || 'Y'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{session?.user?.name || 'Your Channel'}</p>
                  <p className="text-xs text-gray-500">1.2K subscribers</p>
                </div>
                <button className="ml-auto bg-red-600 text-white px-4 py-2 rounded text-sm font-medium">
                  Subscribe
                </button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <button 
                  onClick={() => setLiked(!liked)}
                  className={`flex items-center space-x-2 ${liked ? 'text-blue-600' : 'hover:text-gray-800'}`}
                >
                  <ThumbsUp className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                  <span>{liked ? '243' : '242'}</span>
                </button>
                <button className="flex items-center space-x-2 hover:text-gray-800">
                  <Share className="h-5 w-5" />
                  <span>Share</span>
                </button>
                <button className="flex items-center space-x-2 hover:text-gray-800">
                  <Download className="h-5 w-5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        )

      case 'ai-review':
        return (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Review & Recommendations</h3>
                <p className="text-gray-600">Get AI-powered insights and optimization suggestions for your content</p>
              </div>

              {!aiReview ? (
                <div className="text-center">
                  <div className="mb-6">
                    <img 
                      src={imageUrl} 
                      alt={prompt}
                      className="w-64 h-64 object-cover rounded-lg mx-auto mb-4"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/api/placeholder-image'
                      }}
                    />
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Prompt:</strong> {prompt}</p>
                      {caption && <p><strong>Caption:</strong> {caption}</p>}
                      <p><strong>Style:</strong> {style}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={generateAIReview}
                    disabled={isGeneratingReview || tokens < 5}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-lg hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isGeneratingReview ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Analyzing...
                      </>
                    ) : tokens < 5 ? (
                      <>
                        <Zap className="h-5 w-5 mr-2" />
                        Need 5 tokens
                      </>
                    ) : (
                      <>
                        <Star className="h-5 w-5 mr-2" />
                        Generate AI Review (5 tokens)
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">{aiReview.overallScore}/10</div>
                    <p className="text-lg font-semibold text-gray-900">{aiReview.overallRating}</p>
                    <p className="text-gray-600">{aiReview.summary}</p>
                  </div>

                  {/* Detailed Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Visual Quality */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Eye className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold">Visual Quality</h4>
                        <span className="ml-auto text-sm font-bold text-blue-600">{aiReview.visualQuality}/10</span>
                      </div>
                      <p className="text-sm text-gray-600">{aiReview.visualQualityFeedback}</p>
                    </div>

                    {/* Engagement Potential */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold">Engagement Potential</h4>
                        <span className="ml-auto text-sm font-bold text-green-600">{aiReview.engagementPotential}/10</span>
                      </div>
                      <p className="text-sm text-gray-600">{aiReview.engagementFeedback}</p>
                    </div>

                    {/* Platform Optimization */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Target className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold">Platform Fit</h4>
                        <span className="ml-auto text-sm font-bold text-purple-600">{aiReview.platformFit}/10</span>
                      </div>
                      <p className="text-sm text-gray-600">{aiReview.platformFeedback}</p>
                    </div>

                    {/* Content Quality */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-indigo-600" />
                        <h4 className="font-semibold">Content Quality</h4>
                        <span className="ml-auto text-sm font-bold text-indigo-600">{aiReview.contentQuality}/10</span>
                      </div>
                      <p className="text-sm text-gray-600">{aiReview.contentFeedback}</p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Star className="h-5 w-5 text-blue-600" />
                      <h4 className="text-lg font-semibold">AI Recommendations</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiReview.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="bg-white rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                            </div>
                            <h5 className="font-medium">{rec.title}</h5>
                          </div>
                          <p className="text-sm text-gray-600">{rec.description}</p>
                          {rec.impact && (
                            <div className="mt-2 text-xs text-green-600 font-medium">
                              Expected impact: {rec.impact}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Best Times to Post */}
                  {aiReview.bestTimes && (
                    <div className="bg-yellow-50 rounded-lg p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <h4 className="text-lg font-semibold">Optimal Posting Times</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {aiReview.bestTimes.map((time: any, index: number) => (
                          <div key={index} className="text-center">
                            <div className="bg-white rounded-lg p-3 mb-2">
                              <div className="font-bold text-yellow-600">{time.day}</div>
                              <div className="text-sm text-gray-600">{time.time}</div>
                            </div>
                            <div className="text-xs text-gray-500">{time.engagement} engagement</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      default:
        return <div className="text-center text-gray-500">Platform preview not available</div>
    }
  }

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
                href={`/generate?id=${getImageIdFromUrl(imageUrl)}&image=${encodeURIComponent(imageUrl)}`}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Edit"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Social Media Preview</h1>
                <p className="text-gray-600">Preview your content across different platforms</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">{tokens} tokens</span>
              </div>
              
              {/* Post Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowPostDropdown(!showPostDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={isPosting || isScheduling}
                >
                  {isPosting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Posting...</span>
                    </>
                  ) : isScheduling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <span>Post</span>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Dropdown Menu */}
                {showPostDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={handlePostNow}
                        disabled={isPosting || isScheduling}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="font-medium">Post Now</div>
                            <div className="text-xs text-gray-500">Share immediately</div>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={handleSchedulePost}
                        disabled={isPosting || isScheduling}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="font-medium">Schedule Post</div>
                            <div className="text-xs text-gray-500">Choose date & time</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Platform Tabs */}
        <div className="flex space-x-2 mb-8 overflow-x-auto">
          {platforms.map((platformOption) => (
            <button
              key={platformOption.id}
              onClick={() => setActiveTab(platformOption.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeTab === platformOption.id
                  ? `bg-gradient-to-r ${platformOption.color} text-white shadow-lg`
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="text-lg">{platformOption.icon}</span>
              <span className="font-medium">{platformOption.name}</span>
              {platformOption.id === 'ai-review' && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">5 tokens</span>
              )}
            </button>
          ))}
        </div>

        {/* Platform Preview */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          {getPlatformTemplate()}
        </motion.div>
      </div>

      {/* Schedule Post Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Schedule Post</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Schedule your post for {activeTab === 'ai-review' ? 'Instagram' : platforms.find(p => p.id === activeTab)?.name || activeTab}
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Time Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Optimal Times Suggestion */}
              {aiReview?.bestTimes && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-900 mb-2">
                    💡 AI Suggested Times:
                  </div>
                  <div className="space-y-1">
                    {aiReview.bestTimes.slice(0, 2).map((time: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => {
                          // Calculate the next occurrence of this day
                          const today = new Date()
                          const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(time.day)
                          const daysUntil = (dayIndex - today.getDay() + 7) % 7 || 7
                          const targetDate = new Date(today.getTime() + daysUntil * 24 * 60 * 60 * 1000)
                          
                          setScheduleDate(targetDate.toISOString().split('T')[0])
                          setScheduleTime(time.time.replace(' ', '').toLowerCase().includes('pm') ? 
                            String(parseInt(time.time.split(':')[0]) + 12).padStart(2, '0') + ':' + time.time.split(':')[1].replace(/[^0-9]/g, '').padEnd(2, '0') :
                            time.time.replace(/[^0-9:]/g, ''))
                        }}
                        className="block w-full text-left text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-2 py-1 rounded"
                      >
                        {time.day} at {time.time} ({time.engagement} engagement)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              {scheduleDate && scheduleTime && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">
                    <strong>Scheduled for:</strong><br />
                    {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isScheduling}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSchedule}
                disabled={!scheduleDate || !scheduleTime || isScheduling}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isScheduling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                    Scheduling...
                  </>
                ) : (
                  'Schedule Post'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export wrapped in Suspense
export default function PreviewPage() {
  return (
    <Suspense fallback={<PreviewLoading />}>
      <PreviewPageContent />
    </Suspense>
  )
} 