'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ImageIcon, 
  Download, 
  Share, 
  Heart, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  Grid,
  List,
  MoreVertical,
  Edit,
  Eye,
  ArrowLeft,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  caption?: string
  style: string
  size: string
  platform: string
  createdAt: string
  isFavorite: boolean
  downloads: number
}

export default function ImagesPage() {
  const { data: session, status } = useSession()
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [generatingCaptions, setGeneratingCaptions] = useState<Set<string>>(new Set())
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/login')
    }

    const fetchImages = async () => {
      try {
        console.log('Fetching images for user:', session?.user?.id)
        // Fetch from API only
        const response = await fetch('/api/images')
        const data = await response.json()
        
        console.log('API Response:', data)
        
        let allImages: GeneratedImage[] = []
        
        // Use only API images
        if (data.success && data.images) {
          const apiImages = data.images.map((img: any) => ({
            id: img.id,
            url: img.imageUrl,
            prompt: img.prompt,
            caption: img.caption,
            style: img.style,
            size: img.size,
            platform: img.platform || 'instagram',
            createdAt: img.createdAt,
            isFavorite: img.isFavorite || false,
            downloads: img.downloads || 0
          }))
          allImages = apiImages
        }
        
        // Sort by creation date (newest first)
        allImages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        
        setImages(allImages)
      } catch (error) {
        console.error('Failed to fetch images:', error)
        setImages([]) // Empty array if failed
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [session, status, refreshKey])

  const filters = ['All', 'Favorites', 'Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'YouTube', 'TikTok']
  
  // Count favorites
  const favoritesCount = images.filter(img => img.isFavorite).length
  
  const filteredImages = images.filter(image => {
    const searchText = (image.caption || '').toLowerCase()
    const matchesSearch = searchText.includes(searchTerm.toLowerCase()) ||
                         image.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.size.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesFilter = true
    if (selectedFilter === 'Favorites') {
      matchesFilter = image.isFavorite
    } else if (selectedFilter !== 'All') {
      matchesFilter = image.platform.toLowerCase() === selectedFilter.toLowerCase()
    }
    
    return matchesSearch && matchesFilter
  })

  const generateCaption = async (imageId: string) => {
    const image = images.find(img => img.id === imageId)
    if (!image) return

    setGeneratingCaptions(prev => new Set(prev).add(imageId))

    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: image.url,
          style: image.style,
          platform: image.platform
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate caption')
      }

      if (data.success) {
        // Update the image with the new caption immediately in state
        setImages(prev => prev.map(img => 
          img.id === imageId ? { ...img, caption: data.caption } : img
        ))

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
            // You could update a token display here if needed
            console.log('Tokens deducted, new balance:', tokenData.newBalance)
          } else {
            console.error('Failed to deduct tokens for caption generation:', tokenData.error)
          }
        } catch (tokenError) {
          console.error('Token deduction error:', tokenError)
        }

        // Save caption to database
        try {
          await fetch(`/api/images/${image.id}/caption`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              caption: data.caption
            })
          })
        } catch (dbError) {
          console.error('Failed to save caption to database:', dbError)
        }
      }
    } catch (error) {
      console.error('Caption generation error:', error)
      // You could add a toast notification here
    } finally {
      setGeneratingCaptions(prev => {
        const newSet = new Set(prev)
        newSet.delete(imageId)
        return newSet
      })
    }
  }

  const toggleFavorite = async (id: string) => {
    try {
      // Optimistically update UI
      setImages(images.map(img => 
        img.id === id ? { ...img, isFavorite: !img.isFavorite } : img
      ))

      // Call API to persist to database
      const response = await fetch(`/api/images/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'toggle-favorite' })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle favorite')
      }

      const data = await response.json()
      
      if (data.success) {
        // Update with actual data from server
        setImages(prev => prev.map(img => 
          img.id === id ? { ...img, isFavorite: data.isFavorite } : img
        ))
      }
    } catch (error) {
      console.error('Toggle favorite error:', error)
      // Revert optimistic update on error
      setImages(images.map(img => 
        img.id === id ? { ...img, isFavorite: !img.isFavorite } : img
      ))
    }
  }

  const deleteImage = async (id: string) => {
    try {
      // Confirm deletion
      if (!confirm('Are you sure you want to delete this image?')) {
        return
      }

      // Remove from state immediately for better UX
      setImages(images.filter(img => img.id !== id))

      // Delete from database
      try {
        await fetch(`/api/images/${id}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Failed to delete from database:', error)
        // Restore the image if deletion failed
        setRefreshKey(prev => prev + 1)
      }

    } catch (error) {
      console.error('Delete error:', error)
      // Restore the image if deletion failed
      setRefreshKey(prev => prev + 1)
    }
  }

  const handleDownload = async (image: GeneratedImage) => {
    try {
      setImages(images.map(img => 
        img.id === image.id ? { ...img, downloads: img.downloads + 1 } : img
      ))

      // Fetch the image
      const response = await fetch(image.url, {
        mode: 'cors',
        referrerPolicy: 'no-referrer'
      })
      
      if (!response.ok) {
        // If direct fetch fails, try using a proxy or alternative method
        const proxyResponse = await fetch(`/api/proxy-image?url=${encodeURIComponent(image.url)}`)
        if (!proxyResponse.ok) {
          throw new Error('Failed to fetch image')
        }
        const blob = await proxyResponse.blob()
        const url = window.URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = url
        a.download = `eacon-${image.style}-${Date.now()}.jpg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = url
        a.download = `eacon-${image.style}-${Date.now()}.jpg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download error:', error)
      // Fallback: open image in new tab
      window.open(image.url, '_blank')
    }
  }

  const handleShare = async (image: GeneratedImage) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Eacon AI Generated Image',
          text: `Check out this AI-generated image: "${image.caption || 'AI Generated Image'}"`,
          url: image.url
        })
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(image.url)
        // You could show a toast notification here
        alert('Image URL copied to clipboard!')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled share dialog, don't show error
        return
      }
      console.error('Share error:', error)
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(image.url)
        alert('Image URL copied to clipboard!')
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
    return platformMap[platform.toLowerCase()] || platform
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading images...</p>
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
                <ImageIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Images</h1>
                <p className="text-gray-600">Manage your generated images and creations</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{filteredImages.length} images</span>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by prompt or style..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedFilter === filter
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-300'
                }`}
              >
                {filter}
                {filter === 'Favorites' && favoritesCount > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    selectedFilter === filter 
                      ? 'bg-white/20 text-white' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {favoritesCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Images Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredImages.map((image) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-lg shadow-lg overflow-hidden group"
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/api/placeholder-image'
                        target.style.filter = 'grayscale(100%)'
                        target.style.opacity = '0.5'
                      }}
                    />
                    
                    {/* Favorite Button - Top Right Corner */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(image.id)
                      }}
                      className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg hover:scale-110 transition-all duration-200 z-20"
                      title={image.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <Heart className={`h-4 w-4 ${image.isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
                    </button>

                    {/* Overlay Actions - Remove Favorite Button */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 pointer-events-none group-hover:pointer-events-auto">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleDownload(image)}
                          className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform pointer-events-auto"
                          title="Download Image"
                        >
                          <Download className="h-4 w-4 text-gray-600" />
                        </button>
                        <button 
                          onClick={() => handleShare(image)}
                          className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform pointer-events-auto"
                          title="Share Image"
                        >
                          <Share className="h-4 w-4 text-gray-600" />
                        </button>
                        <button 
                          onClick={() => generateCaption(image.id)}
                          disabled={generatingCaptions.has(image.id)}
                          className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50 pointer-events-auto"
                          title={image.caption ? "Regenerate Caption" : "Generate Caption"}
                        >
                          {generatingCaptions.has(image.id) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                          ) : (
                            <MessageSquare className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                        <Link 
                          href={`/generate?id=${image.id}&image=${encodeURIComponent(image.url)}`}
                          className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform pointer-events-auto"
                          title="Edit Image"
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </Link>
                        <Link 
                          href={`/preview?id=${image.id}&image=${encodeURIComponent(image.url)}`}
                          className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform pointer-events-auto"
                          title="Preview Post"
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Link>
                        <button 
                          onClick={() => deleteImage(image.id)}
                          className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform pointer-events-auto"
                          title="Delete Image"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="p-4">
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {image.caption || 'No caption'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                          {image.style}
                        </span>
                        <span className="text-xs text-gray-500">
                          {image.size}
                        </span>
                      </div>
                      <span>{formatDate(image.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredImages.map((image) => (
                <div key={image.id} className="flex items-center p-4 hover:bg-gray-50 transition-colors">
                  {/* Image Thumbnail */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 mr-4 relative">
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/api/placeholder-image'
                        target.style.filter = 'grayscale(100%)'
                        target.style.opacity = '0.5'
                      }}
                    />
                    
                    {/* Favorite Button - Top Right Corner */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(image.id)
                      }}
                      className="absolute top-1 right-1 p-1 bg-white/90 hover:bg-white rounded-full shadow-lg hover:scale-110 transition-all duration-200 z-20"
                      title={image.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <Heart className={`h-3 w-3 ${image.isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium line-clamp-1 mb-1">
                      {image.caption || 'No caption'}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{image.style}</span>
                      <span>{image.size}</span>
                      <span>{getPlatformDisplayName(image.platform)}</span>
                      <span>{formatDate(image.createdAt)}</span>
                      <span>{image.downloads} downloads</span>
                    </div>
                  </div>

                  {/* Actions - Remove Favorite Button */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button 
                      onClick={() => handleDownload(image)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Download Image"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleShare(image)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Share Image"
                    >
                      <Share className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => generateCaption(image.id)}
                      disabled={generatingCaptions.has(image.id)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
                      title={image.caption ? "Regenerate Caption" : "Generate Caption"}
                    >
                      {generatingCaptions.has(image.id) ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
                      ) : (
                        <MessageSquare className="h-5 w-5" />
                      )}
                    </button>
                    <Link 
                      href={`/generate?id=${image.id}&image=${encodeURIComponent(image.url)}`}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit Image"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                    <Link 
                      href={`/preview?id=${image.id}&image=${encodeURIComponent(image.url)}`}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Preview Post"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                    <button 
                      onClick={() => deleteImage(image.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete Image"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredImages.length === 0 && !loading && (
          <div className="text-center py-12">
            {selectedFilter === 'Favorites' ? (
              <>
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
                <p className="text-gray-600 mb-6">
                  Start adding images to your favorites by clicking the heart icon on any image.
                </p>
                <button
                  onClick={() => setSelectedFilter('All')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View All Images
                </button>
              </>
            ) : (
              <>
                <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No images found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || selectedFilter !== 'All' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Generate your first AI image to get started!'
                  }
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedFilter('All')
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {searchTerm || selectedFilter !== 'All' ? 'Clear Filters' : 'Generate Image'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 