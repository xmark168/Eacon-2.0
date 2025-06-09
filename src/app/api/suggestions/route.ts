import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllTemplates } from '@/lib/database'

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'

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

// Enhanced trending topics based on current AI and social media trends
const trendingTopics: TrendingTopic[] = [
  {
    id: '1',
    topic: 'AI Avatar Transformation',
    category: 'Technology',
    growth: '+300%',
    volume: '5.2M',
    platforms: ['Instagram', 'TikTok', 'Twitter'],
    description: 'Transform photos into AI-generated avatars and artistic styles'
  },
  {
    id: '2',
    topic: 'Aesthetic Workspace Setup',
    category: 'Lifestyle',
    growth: '+150%',
    volume: '3.8M',
    platforms: ['Instagram', 'Pinterest', 'YouTube'],
    description: 'Cozy and productive workspace designs for remote workers'
  },
  {
    id: '3',
    topic: 'Minimalist Product Photography',
    category: 'Business',
    growth: '+120%',
    volume: '2.9M',
    platforms: ['Instagram', 'LinkedIn', 'Pinterest'],
    description: 'Clean, professional product shots for e-commerce and branding'
  },
  {
    id: '4',
    topic: 'Fantasy Character Art',
    category: 'Entertainment',
    growth: '+250%',
    volume: '4.1M',
    platforms: ['Instagram', 'TikTok', 'Twitter'],
    description: 'Magical creatures and fantasy character designs'
  },
  {
    id: '5',
    topic: 'Food Styling & Photography',
    category: 'Food',
    growth: '+90%',
    volume: '2.1M',
    platforms: ['Instagram', 'TikTok', 'Pinterest'],
    description: 'Mouth-watering food presentation and styling'
  },
  {
    id: '6',
    topic: 'Sustainable Living',
    category: 'Environment',
    growth: '+85%',
    volume: '1.8M',
    platforms: ['Instagram', 'LinkedIn', 'YouTube'],
    description: 'Eco-friendly lifestyle and green technology content'
  },
  {
    id: '7',
    topic: 'Digital Art & NFTs',
    category: 'Art',
    growth: '+180%',
    volume: '3.5M',
    platforms: ['Twitter', 'Instagram', 'Discord'],
    description: 'Digital artwork and collectible art pieces'
  },
  {
    id: '8',
    topic: 'Fitness Transformation',
    category: 'Health',
    growth: '+110%',
    volume: '2.7M',
    platforms: ['Instagram', 'TikTok', 'YouTube'],
    description: 'Fitness journey documentation and workout inspiration'
  }
]

function getEngagementLevel(tags: string[]): string {
  if (tags.some(tag => ['viral', 'trending'].includes(tag.toLowerCase()))) {
    return 'Very High'
  }
  if (tags.some(tag => ['popular', 'aesthetic', 'beauty'].includes(tag.toLowerCase()))) {
    return 'High'
  }
  return 'Medium'
}

function getDifficulty(cost: number): 'Easy' | 'Medium' | 'Hard' {
  if (cost <= 25) return 'Easy'
  if (cost <= 50) return 'Medium'
  return 'Hard'
}

function getEstimatedTime(cost: number): string {
  if (cost <= 25) return '2 min'
  if (cost <= 50) return '3 min'
  return '5 min'
}

function isTrending(tags: string[]): boolean {
  return tags.some(tag => ['trending', 'viral', 'popular'].includes(tag.toLowerCase()))
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all templates from database
    const templates = await getAllTemplates()
    
    // Convert templates to content suggestions
    const suggestions: ContentSuggestion[] = templates
      .filter(template => template.isActive)
      .map(template => ({
        id: template.id,
        title: template.title,
        description: template.description,
        prompt: template.prompt.length > 150 
          ? template.prompt.substring(0, 150) + '...' 
          : template.prompt,
        category: template.category,
        platform: template.platform,
        engagement: getEngagementLevel(template.tags),
        difficulty: getDifficulty(template.cost),
        estimatedTime: getEstimatedTime(template.cost),
        trending: isTrending(template.tags),
        templateId: template.id,
        cost: template.cost
      }))
      .sort((a, b) => {
        // Sort by trending first, then by engagement
        if (a.trending !== b.trending) {
          return a.trending ? -1 : 1
        }
        if (a.engagement !== b.engagement) {
          const engagementOrder = { 'Very High': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
          return (engagementOrder[b.engagement as keyof typeof engagementOrder] || 0) - 
                 (engagementOrder[a.engagement as keyof typeof engagementOrder] || 0)
        }
        return 0
      })

    return NextResponse.json({
      success: true,
      suggestions,
      trendingTopics,
      stats: {
        totalSuggestions: suggestions.length,
        trendingSuggestions: suggestions.filter(s => s.trending).length,
        categories: [...new Set(suggestions.map(s => s.category))].length,
        platforms: [...new Set(suggestions.map(s => s.platform))].length
      }
    })

  } catch (error) {
    console.error('Suggestions API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch suggestions',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 