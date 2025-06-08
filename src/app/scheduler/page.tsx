'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Check,
  AlertCircle,
  Image as ImageIcon,
  X,
  Upload,
  Hash,
  ArrowLeft,
  Grid,
  Search,
  Loader,
  CheckCircle,
  ChevronDown,
  MoreVertical
} from 'lucide-react'
import Link from 'next/link'

interface ScheduledPost {
  id: string
  content?: string
  caption?: string
  imageUrl?: string
  platform: string
  scheduledAt: string
  status: 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED'
  hashtags?: string[]
  createdAt?: string
}

interface CreatePostForm {
  content: string
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok'
  scheduledDate: string
  scheduledTime: string
  imageUrl: string
  hashtags: string[]
}

interface UserImage {
  id: string
  url: string
  prompt: string
  caption?: string
  style: string
  size: string
  platform: string
  createdAt: string
}

export default function SchedulerPage() {
  const { data: session, status } = useSession()
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [newHashtag, setNewHashtag] = useState('')
  const [userImages, setUserImages] = useState<UserImage[]>([])
  const [loadingImages, setLoadingImages] = useState(false)
  const [imageSearchTerm, setImageSearchTerm] = useState('')
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set())

  const [createForm, setCreateForm] = useState<CreatePostForm>({
    content: '',
    platform: 'instagram',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '12:00',
    imageUrl: '',
    hashtags: []
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/login')
    }

    fetchScheduledPosts()
  }, [session, status])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdowns(new Set())
    }

    if (openDropdowns.size > 0) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdowns])

  const fetchScheduledPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/scheduled-posts')
      const data = await response.json()
      
      if (data.success) {
        setPosts(data.posts)
      } else {
        console.error('Failed to fetch scheduled posts:', data.error)
      }
    } catch (error) {
      console.error('Error fetching scheduled posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserImages = async () => {
    try {
      setLoadingImages(true)
      const response = await fetch('/api/images')
      const data = await response.json()
      
      console.log('Gallery API Response:', data)
      
      if (data.success) {
        console.log('Images loaded for gallery:', data.images.length)
        console.log('First image sample:', data.images[0])
        setUserImages(data.images)
      } else {
        console.error('Failed to fetch user images:', data.error)
      }
    } catch (error) {
      console.error('Error fetching user images:', error)
    } finally {
      setLoadingImages(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="h-4 w-4" />
      case 'facebook': return <Facebook className="h-4 w-4" />
      case 'twitter': return <Twitter className="h-4 w-4" />
      case 'linkedin': return <Linkedin className="h-4 w-4" />
      case 'youtube': return <Youtube className="h-4 w-4" />
      case 'tiktok': return <div className="h-4 w-4 bg-black rounded-sm flex items-center justify-center text-white text-xs font-bold">T</div>
      default: return <ImageIcon className="h-4 w-4" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'bg-pink-100 text-pink-600 border-pink-200'
      case 'facebook': return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'twitter': return 'bg-sky-100 text-sky-600 border-sky-200'
      case 'linkedin': return 'bg-indigo-100 text-indigo-600 border-indigo-200'
      case 'youtube': return 'bg-red-100 text-red-600 border-red-200'
      case 'tiktok': return 'bg-gray-900 text-white border-gray-700'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'PROCESSING': return <Loader className="h-4 w-4 text-blue-500 animate-spin" />
      case 'PUBLISHED': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'CANCELLED': return <X className="h-4 w-4 text-gray-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled post?')) return
    
    try {
      const response = await fetch(`/api/scheduled-posts?id=${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setPosts(posts.filter(post => post.id !== id))
      } else {
        console.error('Failed to delete post:', data.error)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const pausePost = async (id: string) => {
    try {
      const response = await fetch('/api/scheduled-posts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId: id,
          status: 'CANCELLED'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchScheduledPosts()
      } else {
        console.error('Failed to pause post:', data.error)
      }
    } catch (error) {
      console.error('Error pausing post:', error)
    }
  }

  const resumePost = async (id: string) => {
    try {
      const response = await fetch('/api/scheduled-posts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId: id,
          status: 'PENDING'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchScheduledPosts()
      } else {
        console.error('Failed to resume post:', data.error)
      }
    } catch (error) {
      console.error('Error resuming post:', error)
    }
  }

  const editPost = (post: ScheduledPost) => {
    setEditingPostId(post.id)
    setCreateForm({
      content: post.content || post.caption || '',
      platform: post.platform as any,
      scheduledDate: new Date(post.scheduledAt).toISOString().split('T')[0],
      scheduledTime: new Date(post.scheduledAt).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      imageUrl: post.imageUrl || '',
      hashtags: post.hashtags || []
    })
    setShowCreateModal(true)
  }

  const updatePostStatus = async (postId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/scheduled-posts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId,
          status: newStatus
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchScheduledPosts()
        // Close dropdown
        setOpenDropdowns(new Set())
      } else {
        console.error('Failed to update post status:', data.error)
        alert('Failed to update post status: ' + data.error)
      }
    } catch (error) {
      console.error('Error updating post status:', error)
      alert('Failed to update post status. Please try again.')
    }
  }

  const toggleDropdown = (postId: string) => {
    const newDropdowns = new Set(openDropdowns)
    if (newDropdowns.has(postId)) {
      newDropdowns.delete(postId)
    } else {
      newDropdowns.clear() // Close other dropdowns
      newDropdowns.add(postId)
    }
    setOpenDropdowns(newDropdowns)
  }

  const getStatusOptions = (currentStatus: string) => {
    const allOptions = [
      { value: 'PENDING', label: 'Pending', color: 'text-yellow-600' },
      { value: 'PROCESSING', label: 'Processing', color: 'text-blue-600' },
      { value: 'PUBLISHED', label: 'Published', color: 'text-green-600' },
      { value: 'FAILED', label: 'Failed', color: 'text-red-600' },
      { value: 'CANCELLED', label: 'Cancelled', color: 'text-gray-600' }
    ]
    
    return allOptions.filter(option => option.value !== currentStatus)
  }

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getPostsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return posts.filter(post => post.scheduledAt.startsWith(dateStr))
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square p-2 border border-gray-200"></div>
      )
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const postsForDay = getPostsForDate(date)
      const isToday = new Date().toDateString() === date.toDateString()

      days.push(
        <div 
          key={day} 
          className={`aspect-square p-2 border border-gray-200 ${
            isToday ? 'bg-blue-50 border-blue-300' : ''
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${
            isToday ? 'text-blue-700' : 'text-gray-700'
          }`}>
            {day}
          </div>
          <div className="space-y-1">
            {postsForDay.slice(0, 2).map((post) => (
              <div
                key={post.id}
                className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${getPlatformColor(post.platform)}`}
                onClick={() => editPost(post)}
                title={`Click to edit: ${post.content?.substring(0, 50) || post.caption?.substring(0, 50) || 'No content'}`}
              >
                <div className="flex items-center space-x-1">
                  {getPlatformIcon(post.platform)}
                  <span className="truncate flex-1">
                    {post.content?.substring(0, 15) || post.caption?.substring(0, 15) || 'No content'}...
                  </span>
                  {getStatusIcon(post.status)}
                </div>
              </div>
            ))}
            {postsForDay.length > 2 && (
              <div 
                className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => setViewMode('list')}
                title="Switch to list view to see all posts"
              >
                +{postsForDay.length - 2} more (click to view all)
              </div>
            )}
          </div>
        </div>
      )
    }

    return days
  }

  const addHashtag = () => {
    if (newHashtag.trim() && !createForm.hashtags.includes(newHashtag.trim())) {
      setCreateForm({
        ...createForm,
        hashtags: [...createForm.hashtags, newHashtag.trim()]
      })
      setNewHashtag('')
    }
  }

  const removeHashtag = (hashtag: string) => {
    setCreateForm({
      ...createForm,
      hashtags: createForm.hashtags.filter(tag => tag !== hashtag)
    })
  }

  const openImageSelector = () => {
    setShowImageSelector(true)
    fetchUserImages()
  }

  const selectImage = (image: UserImage) => {
    setCreateForm({
      ...createForm,
      imageUrl: image.url,
      content: createForm.content || image.caption || ''
    })
    setShowImageSelector(false)
  }

  const filteredImages = userImages.filter(image => 
    imageSearchTerm === '' ||
    image.prompt.toLowerCase().includes(imageSearchTerm.toLowerCase()) ||
    (image.caption && image.caption.toLowerCase().includes(imageSearchTerm.toLowerCase())) ||
    image.style.toLowerCase().includes(imageSearchTerm.toLowerCase())
  )

  const handleCreatePost = async () => {
    if (!createForm.content.trim()) return

    setIsCreating(true)

    try {
      const isEditing = editingPostId !== null
      const url = '/api/scheduled-posts'
      const method = isEditing ? 'PUT' : 'POST'
      
      const body = isEditing 
        ? {
            postId: editingPostId,
            caption: createForm.content,
            imageUrl: createForm.imageUrl || undefined,
            platform: createForm.platform,
            scheduledAt: `${createForm.scheduledDate}T${createForm.scheduledTime}:00.000Z`
          }
        : {
            content: createForm.content,
            imageUrl: createForm.imageUrl || undefined,
            platform: createForm.platform,
            scheduledAt: `${createForm.scheduledDate}T${createForm.scheduledTime}:00.000Z`,
            hashtags: createForm.hashtags
          }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        // Refresh posts list
        await fetchScheduledPosts()
        setShowCreateModal(false)
        setEditingPostId(null)
        
        // Reset form
        setCreateForm({
          content: '',
          platform: 'instagram',
          scheduledDate: new Date().toISOString().split('T')[0],
          scheduledTime: '12:00',
          imageUrl: '',
          hashtags: []
        })
      } else {
        console.error(`Failed to ${isEditing ? 'update' : 'create'} post:`, data.error)
        alert(`Failed to ${isEditing ? 'update' : 'schedule'} post: ` + data.error)
      }
    } catch (error) {
      console.error(`Error ${editingPostId ? 'updating' : 'creating'} post:`, error)
      alert(`Failed to ${editingPostId ? 'update' : 'schedule'} post. Please try again.`)
    } finally {
      setIsCreating(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scheduler...</p>
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
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Content Scheduler</h1>
                <p className="text-gray-600">Plan and schedule your social media posts</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'calendar' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Calendar
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  List
                </button>
              </div>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Post
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'calendar' ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-3 bg-gray-50 border-b border-gray-200 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {renderCalendar()}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg shadow-lg">
                <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No scheduled posts</h3>
                <p className="text-gray-600 mb-6">Create your first scheduled post to get started!</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Your First Post
                </button>
              </div>
            ) : (
              posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 border rounded-lg ${getPlatformColor(post.platform)}`}>
                          {getPlatformIcon(post.platform)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 capitalize">{post.platform}</h3>
                          <p className="text-sm text-gray-600">{formatDate(post.scheduledAt)}</p>
                        </div>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleDropdown(post.id)
                            }}
                            className="flex items-center space-x-1 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                          >
                            {getStatusIcon(post.status)}
                            <span className="text-sm text-gray-600 capitalize">{post.status.toLowerCase()}</span>
                            <ChevronDown className="h-3 w-3 text-gray-400" />
                          </button>
                          
                          {/* Status Dropdown */}
                          {openDropdowns.has(post.id) && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-32"
                            >
                              {getStatusOptions(post.status).map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => updatePostStatus(post.id, option.value)}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${option.color}`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        {post.imageUrl && (
                          <div className="flex-shrink-0 w-20 h-20">
                            <img
                              src={post.imageUrl}
                              alt="Post"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <p className="text-gray-800 mb-2">{post.content || post.caption}</p>
                          
                          {post.hashtags && post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {post.hashtags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {post.status === 'PENDING' && (
                        <button
                          onClick={() => pausePost(post.id)}
                          className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                          title="Pause"
                        >
                          <Pause className="h-4 w-4" />
                        </button>
                      )}
                      {(post.status === 'CANCELLED' || post.status === 'FAILED') && (
                        <button
                          onClick={() => resumePost(post.id)}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Resume"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {post.status !== 'PUBLISHED' && (
                        <button
                          onClick={() => editPost(post)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deletePost(post.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingPostId ? 'Edit Scheduled Post' : 'Schedule New Post'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingPostId(null)
                    setCreateForm({
                      content: '',
                      platform: 'instagram',
                      scheduledDate: new Date().toISOString().split('T')[0],
                      scheduledTime: '12:00',
                      imageUrl: '',
                      hashtags: []
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Platform Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Platform</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok'].map((platform) => (
                      <button
                        key={platform}
                        onClick={() => setCreateForm({...createForm, platform: platform as any})}
                        className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all ${
                          createForm.platform === platform
                            ? `${getPlatformColor(platform)} border-current`
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {getPlatformIcon(platform)}
                        <span className="text-xs font-medium capitalize">{platform}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={createForm.imageUrl}
                      onChange={(e) => setCreateForm({...createForm, imageUrl: e.target.value})}
                      placeholder="https://example.com/image.jpg or select from gallery"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button 
                      onClick={openImageSelector}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Grid className="h-4 w-4 mr-2" />
                      Gallery
                    </button>
                  </div>
                  {createForm.imageUrl && (
                    <div className="mt-3">
                      <div className="relative w-48 h-48 mx-auto">
                        <img 
                          src={createForm.imageUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover rounded-lg shadow-md border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <button
                          onClick={() => setCreateForm({...createForm, imageUrl: ''})}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-center text-sm text-gray-500 mt-2">Selected image preview</p>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={createForm.content}
                    onChange={(e) => setCreateForm({...createForm, content: e.target.value})}
                    placeholder="Write your post content..."
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{createForm.content.length}/280 characters</p>
                </div>

                {/* Hashtags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
                  <div className="flex space-x-2 mb-3">
                    <div className="relative flex-1">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={newHashtag}
                        onChange={(e) => setNewHashtag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                        placeholder="Add hashtag"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={addHashtag}
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Add
                    </button>
                  </div>
                  {createForm.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {createForm.hashtags.map((hashtag) => (
                        <span
                          key={hashtag}
                          className="inline-flex items-center space-x-1 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full"
                        >
                          <span>#{hashtag}</span>
                          <button
                            onClick={() => removeHashtag(hashtag)}
                            type="button"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Schedule Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={createForm.scheduledDate}
                      onChange={(e) => setCreateForm({...createForm, scheduledDate: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      value={createForm.scheduledTime}
                      onChange={(e) => setCreateForm({...createForm, scheduledTime: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingPostId(null)
                    setCreateForm({
                      content: '',
                      platform: 'instagram',
                      scheduledDate: new Date().toISOString().split('T')[0],
                      scheduledTime: '12:00',
                      imageUrl: '',
                      hashtags: []
                    })
                  }}
                  type="button"
                  disabled={isCreating}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  type="button"
                  disabled={!createForm.content.trim() || isCreating}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingPostId ? 'Updating...' : 'Scheduling...'}
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {editingPostId ? 'Update Post' : 'Schedule Post'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Image Selector Modal */}
      {showImageSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Select Image from Gallery</h3>
                <button
                  onClick={() => setShowImageSelector(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search images by prompt, caption, or style..."
                    value={imageSearchTerm}
                    onChange={(e) => setImageSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Images Grid */}
              <div className="max-h-96 overflow-y-auto">
                {loadingImages ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading images...</span>
                  </div>
                ) : filteredImages.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No images found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                         {filteredImages.map((image) => (
                       <button
                         key={image.id}
                         onClick={() => selectImage(image)}
                         className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all bg-gray-100"
                       >
                         <img
                           src={image.url}
                           alt={image.caption || `${image.style} image`}
                           className="w-full h-full object-cover"
                           onError={(e) => {
                             console.error('Image failed to load:', image.url)
                             const target = e.target as HTMLImageElement
                             target.style.display = 'none'
                             // Show a fallback div
                             const fallback = target.nextElementSibling as HTMLElement
                             if (fallback) fallback.style.display = 'flex'
                           }}
                           onLoad={() => {
                             
                           }}
                         />
                         <div 
                           className="absolute inset-0 bg-gray-200 hidden items-center justify-center flex-col text-gray-500"
                           style={{ display: 'none' }}
                         >
                           <ImageIcon className="h-8 w-8 mb-2" />
                           <span className="text-xs text-center px-2">Image not available</span>
                         </div>
                         <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                           <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                             <CheckCircle className="h-8 w-8 text-white" />
                           </div>
                         </div>
                         <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                           <p className="text-white text-xs truncate">
                             {image.caption || `${image.style} • ${image.size}`}
                           </p>
                         </div>
                       </button>
                     ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
} 