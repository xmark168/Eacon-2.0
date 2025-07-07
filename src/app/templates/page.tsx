'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Filter, Search, Star, Lock, Zap, ArrowLeft, AlertCircle, X, Upload } from 'lucide-react'
import Link from 'next/link'
import { Template, Category } from '@/lib/database'

export default function TemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [tokens, setTokens] = useState(90)
  const [isUsingTemplate, setIsUsingTemplate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/login')
    }

    fetchTokens()
    fetchTemplates()
    fetchCategories()
  }, [session, status])

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

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/templates')
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.templates)
        console.log('📚 Templates loaded from database:', data.templates.length)
        console.log('🖼️ First template preview image:', data.templates[0]?.previewImage)
        console.log('🔍 Sample template data:', data.templates[0])
      } else {
        throw new Error(data.error || 'Failed to fetch templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      setError('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.categories)
        console.log('📂 Categories loaded from database:', data.categories.length)
      } else {
        throw new Error(data.error || 'Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback to default categories if API fails
      setCategories([
        { id: '1', name: 'all', displayName: 'All', description: '', icon: '🌟', color: '#3B82F6', isActive: true, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() }
      ])
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleUseTemplate = async (template: Template) => {
    // Check if user has enough tokens (but don't deduct yet - only on actual generation)
    if (tokens < template.cost) {
      setError(`Not enough tokens. You need ${template.cost} tokens to generate with this template.`)
      return
    }

    setIsUsingTemplate(true)
    setError(null)

    try {
      // Check if this is a transform template
      const isTransformTemplate = template.type === 'TRANSFORM' || template.requiresUpload === true
      
      // Create clean URL without sensitive data - template data will be loaded from database
      // No token deduction here - tokens will be deducted during actual generation
      const queryParams = new URLSearchParams({
        template: template.id,
        mode: isTransformTemplate ? 'transform' : 'generate'
      })
      
      console.log('🎯 Template selected, redirecting to generate page...')
      console.log('📋 Template details will be loaded from database')
      console.log('💰 Tokens will be deducted during actual generation, not selection')
      router.push(`/generate?${queryParams.toString()}`)
      
    } catch (error) {
      console.error('Template selection error:', error)
      setError(error instanceof Error ? error.message : 'Failed to select template')
    } finally {
      setIsUsingTemplate(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
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
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Premium Template Gallery</h1>
                <p className="text-gray-600">Professional templates with AI-optimized prompts</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">{tokens} tokens</span>
              </div>
              <span className="text-sm text-gray-600">{filteredTemplates.length} templates</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3"
          >
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Template Usage Error</p>
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

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.name
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-300'
                }`}
              >
                {category.displayName}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-xl"
                onClick={() => handleUseTemplate(template)}
              >
                {/* Template Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {(template as any).previewImage ? (
                    <img 
                      src={(template as any).previewImage}
                      alt={template.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback to gradient background if image fails
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.fallback-bg') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className={`fallback-bg absolute inset-0 w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 items-center justify-center group-hover:from-blue-200 group-hover:to-purple-200 transition-colors duration-300 ${(template as any).previewImage ? 'hidden' : 'flex'}`}
                  >
                    <div className="text-center">
                      <Sparkles className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm text-blue-600 font-medium">{template.category}</p>
                    </div>
                  </div>
                  
                  {/* Premium Badge */}
                  <div className="absolute top-3 right-3 flex items-center space-x-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full">
                    <Star className="h-3 w-3" />
                    <span>Premium</span>
                  </div>

                  {/* Cost Badge */}
                  <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {template.cost} tokens
                  </div>
                  
                  {/* Transform Badge - for templates that require upload */}
                  {(template.type === 'TRANSFORM' || template.requiresUpload === true) && (
                    <div className="absolute bottom-3 left-3 flex items-center space-x-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                      <span>Upload Required</span>
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
                      disabled={isUsingTemplate}
                    >
                      {isUsingTemplate ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                          Using...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2 inline-block" />
                          Use Template
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {template.title}
                    </h3>
                    <span className="text-blue-600 font-bold text-sm">
                      {template.cost} tokens
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        +{template.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Style indicator */}
                  <div className="mt-2 text-xs text-gray-500">
                    Style: <span className="font-medium capitalize">{template.style}</span>
                    {(template.type === 'TRANSFORM' || template.requiresUpload === true) && (
                      <span className="ml-2 text-green-600 font-medium">• Transform</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-16">
            <Filter className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filter criteria to find more templates.
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Premium AI-Optimized Templates</h3>
            <p className="text-blue-700 mb-4">
              Each template includes carefully crafted prompts designed by professionals to generate stunning results.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-600">
              <div className="flex items-center justify-center space-x-2">
                <Star className="h-4 w-4" />
                <span>Professional Quality</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>AI-Optimized Prompts</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Transform Templates Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 