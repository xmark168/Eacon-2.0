import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageUrl, style, platform } = await request.json()

    // Validate input
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    console.log('Generating caption for image:', imageUrl)
    console.log('Style:', style, 'Platform:', platform)

    // Create platform-specific caption prompt
    const platformContext = platform ? {
      'instagram': 'engaging Instagram post with relevant hashtags',
      'facebook': 'Facebook post that encourages engagement and sharing',
      'twitter': 'concise Twitter tweet with trending hashtags',
      'linkedin': 'professional LinkedIn post for business networking',
      'youtube': 'YouTube video description that attracts viewers',
      'tiktok': 'trendy TikTok caption with popular hashtags'
    }[platform.toLowerCase()] : 'social media post'

    const styleContext = style ? {
      'realistic': 'realistic and detailed description',
      'artistic': 'creative and artistic language',
      'anime': 'anime-style and vibrant description',
      'abstract': 'abstract and conceptual language',
      'minimalist': 'clean and minimal description',
      'vintage': 'retro and nostalgic tone'
    }[style.toLowerCase()] : 'engaging description'

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a social media caption expert. Create compelling captions for AI-generated images. 
          Focus on creating ${platformContext} with ${styleContext}.
          
          Guidelines:
          - Keep it engaging and relevant to the platform
          - Include 3-5 relevant hashtags
          - Match the tone to the image style
          - Make it shareable and engaging
          - Keep it concise but descriptive
          - Don't mention that it's AI-generated unless relevant`
        },
        {
          role: "user",
          content: `Create a caption for this image: ${imageUrl}
          Style: ${style || 'realistic'}
          Platform: ${platform || 'instagram'}
          
          Make it engaging and platform-appropriate.`
        }
      ],
      max_tokens: 200,
      temperature: 0.8
    })

    const generatedCaption = response.choices[0]?.message?.content?.trim()

    if (!generatedCaption) {
      throw new Error('Failed to generate caption')
    }

    console.log('Generated caption:', generatedCaption)

    return NextResponse.json({
      success: true,
      caption: generatedCaption
    })

  } catch (error) {
    console.error('Caption generation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate caption' 
      }, 
      { status: 500 }
    )
  }
} 