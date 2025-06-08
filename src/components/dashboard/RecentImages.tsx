'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Image, Plus, Eye, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { cleanupLocalStorage } from '@/lib/cleanup'
import { migrateLocalStorageToDatabase } from '@/lib/migration'

interface RecentImagesProps {
  userId: string
}

interface SavedImage {
  id: string
  imageUrl: string
  prompt: string
  caption?: string
  createdAt: string
  settings?: {
    platform?: string
    style?: string
    size?: string
  }
}

export function RecentImages({ userId }: RecentImagesProps) {
  const [recentImages, setRecentImages] = useState<SavedImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeComponent = async () => {
      // First migrate any existing localStorage data to database
      try {
        await migrateLocalStorageToDatabase()
      } catch (error) {
        console.error('Migration failed:', error)
      }
      
      // Then clean up localStorage
      cleanupLocalStorage()
      
      // Finally fetch recent images
      await fetchRecentImages()
    }
    
    const fetchRecentImages = async () => {
      try {
        // Fetch from API only
        const response = await fetch('/api/images')
        const data = await response.json()
        
        let allImages: SavedImage[] = []
        
        // Use only API images
        if (data.success && data.images) {
          const apiImages = data.images.map((img: any) => ({
            id: img.id,
            imageUrl: img.imageUrl,
            prompt: img.prompt,
            caption: img.caption,
            createdAt: img.createdAt,
            settings: {
              platform: img.platform || 'instagram',
              style: img.style,
              size: img.size
            }
          }))
          allImages = apiImages
        }
        
        // Sort by creation date (newest first) and take last 3
        allImages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        
        setRecentImages(allImages.slice(0, 3))
      } catch (error) {
        console.error('Failed to fetch recent images:', error)
        setRecentImages([]) // Empty array if failed
      } finally {
        setLoading(false)
      }
    }

    initializeComponent()
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) {
      return 'Just now'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  const getPlatformDisplayName = (platform: string) => {
    const platformMap: { [key: string]: string } = {
      'instagram': 'Instagram',
      'facebook': 'Facebook', 
      'linkedin': 'LinkedIn',
      'twitter': 'Twitter',
      'youtube': 'YouTube',
      'tiktok': 'TikTok'
    }
    return platformMap[platform?.toLowerCase()] || 'Generated'
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Images</h2>
          <Link href="/images" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All
          </Link>
        </div>
        <div className="bg-white p-12 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recent images...</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Recent Images</h2>
        <Link href="/images" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All
        </Link>
      </div>

      {recentImages.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-lg text-center">
          <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <Image className="h-8 w-8 text-gray-400 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
          <p className="text-gray-600 mb-6">Start creating your first AI-generated image</p>
          <Link 
            href="/generate" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Image
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.7 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={image.imageUrl}
                  alt={image.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/20 transition-colors duration-300 flex items-center justify-center">
                  <Link 
                    href={`/generate?id=${image.id}&image=${encodeURIComponent(image.imageUrl)}`}
                    className="opacity-0 group-hover:opacity-100 bg-white/90 p-2 rounded-full transition-all duration-300 hover:bg-white"
                  >
                    <Eye className="h-5 w-5 text-gray-900" />
                  </Link>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="bg-gray-900/70 text-white text-xs px-2 py-1 rounded-full">
                    {getPlatformDisplayName(image.settings?.platform || '')}
                  </span>
                </div>
                {image.caption && (
                  <div className="absolute bottom-2 left-2">
                    <span className="bg-green-500/70 text-white text-xs p-1 rounded-full" title="Has caption">
                      <MessageSquare className="h-3 w-3" />
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-900 font-medium mb-2 line-clamp-2">
                  {image.caption || 'No caption'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{formatTimeAgo(image.createdAt)}</span>
                  {image.settings?.style && (
                    <span className="bg-gray-100 px-2 py-1 rounded-full">
                      {image.settings.style}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
} 