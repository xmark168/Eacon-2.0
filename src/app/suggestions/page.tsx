'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wand2, 
  TrendingUp, 
  Lightbulb, 
  Clock, 
  Copy, 
  RefreshCw,
  Sparkles,
  Calendar,
  Heart,
  MessageCircle,
  Share,
  Eye,
  Filter,
  Search,
  ArrowLeft,
  Star,
  Zap,
  Target,
  Users,
  BarChart3,
  Tag,
  Coins,
  ChevronRight,
  Play,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'

interface ContentSuggestion {
  id: string
  title: string
  description: string
  prompt: string
  category: string
  platform: string
  engagement: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  estimatedTime: string
  trending: boolean
  templateId?: string
  cost?: number
}

interface TrendingTopic {
  id: string
  topic: string
  category: string
  growth: string
  volume: string
  platforms: string[]
  description: string
}

interface SuggestionsData {
  suggestions: ContentSuggestion[]
  trendingTopics: TrendingTopic[]
  stats: {
    totalSuggestions: number
    trendingSuggestions: number
    categories: number
    platforms: number
  }
}

export default function SuggestionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<SuggestionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedPlatform, setSelectedPlatform] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [showTrending, setShowTrending] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/login')
    }

    fetchSuggestions()
  }, [session, status])

  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/suggestions')
      const result = await response.json()
      
      if (result.success) {
        setData(result)
      } else {
        console.error('Failed to fetch suggestions:', result.error)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['All', 'Technology', 'Lifestyle', 'Food', 'Business', 'Art', 'Health', 'Environment']
  const platforms = ['All', 'Instagram', 'LinkedIn', 'YouTube', 'Twitter', 'TikTok', 'Pinterest']
  const difficulties = ['All', 'Easy', 'Medium', 'Hard']

  // Filter suggestions
  const filteredSuggestions = data?.suggestions.filter(suggestion => {
    const matchesCategory = selectedCategory === 'All' || suggestion.category === selectedCategory
    const matchesPlatform = selectedPlatform === 'All' || suggestion.platform === selectedPlatform
    const matchesDifficulty = selectedDifficulty === 'All' || suggestion.difficulty === selectedDifficulty
    const matchesSearch = searchTerm === '' || 
      suggestion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suggestion.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suggestion.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCategory && matchesPlatform && matchesDifficulty && matchesSearch
  }) || []

  const copyPrompt = async (prompt: string, suggestionId: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedId(suggestionId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy prompt:', error)
    }
  }

  const generateFromSuggestion = async (suggestion: ContentSuggestion) => {
    setGeneratingId(suggestion.id)
    
    try {
      // Navigate to generate page with suggestion data
      const params = new URLSearchParams({
        prompt: suggestion.prompt,
        style: 'realistic',
        platform: suggestion.platform,
        suggestionId: suggestion.id,
        suggestionTitle: suggestion.title,
        from: 'suggestions'
      })
      
      if (suggestion.templateId) {
        params.append('template', suggestion.templateId)
      }
      
      router.push(`/generate?${params.toString()}`)
    } catch (error) {
      console.error('Error navigating to generate:', error)
      setGeneratingId(null)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'Very High': return 'bg-purple-100 text-purple-800'
      case 'High': return 'bg-blue-100 text-blue-800'
      case 'Medium': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return '📸'
      case 'youtube': return '📺'
      case 'linkedin': return '💼'
      case 'twitter': return '🐦'
      case 'tiktok': return '🎵'
      case 'pinterest': return '📌'
      default: return '🌐'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading AI suggestions...</p>
              <p className="text-gray-500 text-sm mt-2">Analyzing trending content and templates</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="p-2 hover:bg-white rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Lightbulb className="h-8 w-8 text-blue-600" />
                AI Content Suggestions
              </h1>
              <p className="text-gray-600 mt-1">Discover trending ideas and optimize your content strategy</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchSuggestions}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Suggestions</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.totalSuggestions}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Trending Now</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.trendingSuggestions}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.categories}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Tag className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Platforms</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.platforms}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toggle between Suggestions and Trending Topics */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setShowTrending(false)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                !showTrending 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Content Suggestions
            </button>
            <button
              onClick={() => setShowTrending(true)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                showTrending 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Trending Topics
            </button>
          </div>
        </div>

        {!showTrending ? (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex flex-wrap gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search suggestions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                
                {/* Platform Filter */}
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {platforms.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
                
                {/* Difficulty Filter */}
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Suggestions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredSuggestions.map((suggestion) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {suggestion.trending && (
                            <div className="flex items-center bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Trending
                            </div>
                          )}
                          <span className="text-2xl">{getPlatformIcon(suggestion.platform)}</span>
                        </div>
                        {suggestion.cost && (
                          <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            <Coins className="h-3 w-3 mr-1" />
                            {suggestion.cost}
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {suggestion.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {suggestion.description}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(suggestion.difficulty)}`}>
                          {suggestion.difficulty}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEngagementColor(suggestion.engagement)}`}>
                          {suggestion.engagement}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {suggestion.estimatedTime}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-4">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {suggestion.category}
                        </span>
                        <span className="ml-2">• {suggestion.platform}</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="px-6 pb-6 flex gap-2">
                      <button
                        onClick={() => generateFromSuggestion(suggestion)}
                        disabled={generatingId === suggestion.id}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        {generatingId === suggestion.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Generate
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => copyPrompt(suggestion.prompt, suggestion.id)}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                        title="Copy prompt"
                      >
                        {copiedId === suggestion.id ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Empty State */}
            {filteredSuggestions.length === 0 && data && (
              <div className="text-center py-12">
                <Lightbulb className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No suggestions found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters to see more content suggestions.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All')
                    setSelectedPlatform('All')
                    setSelectedDifficulty('All')
                    setSearchTerm('')
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        ) : (
          /* Trending Topics */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data?.trendingTopics.map((topic) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {topic.topic}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {topic.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 font-bold text-lg">
                        {topic.growth}
                      </div>
                      <div className="text-gray-500 text-sm">
                        {topic.volume} posts
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {topic.platforms.map((platform) => (
                        <span
                          key={platform}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                        >
                          {getPlatformIcon(platform)} {platform}
                        </span>
                      ))}
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                      {topic.category}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 