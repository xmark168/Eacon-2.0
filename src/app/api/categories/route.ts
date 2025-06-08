import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllCategories, getCategoryById } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('id')

    if (categoryId) {
      // Get specific category
      const category = await getCategoryById(categoryId)
      
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        category: category
      })
    }

    // Get all categories
    const categories = await getAllCategories()

    return NextResponse.json({
      success: true,
      categories: categories,
      count: categories.length,
      message: 'Categories loaded from PostgreSQL database'
    })

  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 