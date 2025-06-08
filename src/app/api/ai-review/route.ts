import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { imageUrl, prompt, caption, style, platform } = await request.json()

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'Image URL and prompt are required' },
        { status: 400 }
      )
    }

    console.log('Generating AI review for:', { imageUrl, prompt, caption, style, platform })

    // Create a comprehensive review prompt for AI
    const reviewPrompt = `
    As an expert social media marketing consultant and content strategist, please analyze this AI-generated image and provide a comprehensive review and recommendations.

    **Content Details:**
    - Prompt: "${prompt}"
    - Caption: "${caption || 'No caption provided'}"
    - Style: "${style}"
    - Target Platform: "${platform}"

    Please provide a detailed analysis in JSON format with the following structure:
    {
      "overallScore": 8,
      "overallRating": "Excellent",
      "summary": "Brief overall assessment",
      "visualQuality": 9,
      "visualQualityFeedback": "Detailed feedback on visual aspects",
      "engagementPotential": 7,
      "engagementFeedback": "Analysis of engagement potential",
      "platformFit": 8,
      "platformFeedback": "How well it fits the target platform",
      "contentQuality": 8,
      "contentFeedback": "Assessment of content quality and relevance",
      "recommendations": [
        {
          "title": "Recommendation title",
          "description": "Detailed recommendation",
          "impact": "High/Medium/Low"
        }
      ],
      "bestTimes": [
        {
          "day": "Monday",
          "time": "9:00 AM",
          "engagement": "High"
        }
      ]
    }

    Consider factors like:
    - Visual composition and aesthetics
    - Color scheme and contrast
    - Relevance to the prompt
    - Platform-specific best practices
    - Caption effectiveness
    - Hashtag opportunities
    - Optimal posting times for ${platform}
    - Engagement optimization strategies
    - Content accessibility
    - Brand consistency potential

    Provide actionable, specific recommendations that can improve performance on ${platform}.
    `

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert social media marketing consultant specializing in content optimization and engagement strategies. Provide detailed, actionable insights in valid JSON format only.'
        },
        {
          role: 'user',
          content: reviewPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    })

    const reviewText = response.choices[0]?.message?.content?.trim()
    
    if (!reviewText) {
      throw new Error('No review generated')
    }

    console.log('AI Review generated:', reviewText)

    // Parse the JSON response
    let review
    try {
      // Clean the response text to remove markdown code blocks
      let cleanText = reviewText
      
      // Remove markdown code blocks more aggressively
      if (cleanText.includes('```')) {
        // Extract content between first ``` and last ```
        const firstBacktick = cleanText.indexOf('```')
        const lastBacktick = cleanText.lastIndexOf('```')
        
        if (firstBacktick !== -1 && lastBacktick !== -1 && firstBacktick !== lastBacktick) {
          cleanText = cleanText.substring(firstBacktick + 3, lastBacktick)
          
          // Remove json language identifier if present
          if (cleanText.startsWith('json')) {
            cleanText = cleanText.substring(4)
          }
        }
      }
      
      // Remove any remaining backticks and trim
      cleanText = cleanText.replace(/`/g, '').trim()
      
      // Ensure it starts and ends with braces
      if (!cleanText.startsWith('{')) {
        const braceIndex = cleanText.indexOf('{')
        if (braceIndex !== -1) {
          cleanText = cleanText.substring(braceIndex)
        }
      }
      
      if (!cleanText.endsWith('}')) {
        const lastBraceIndex = cleanText.lastIndexOf('}')
        if (lastBraceIndex !== -1) {
          cleanText = cleanText.substring(0, lastBraceIndex + 1)
        }
      }
      
      review = JSON.parse(cleanText)
    } catch (parseError) {
      console.error('Failed to parse AI review JSON:', parseError)
      console.error('Original response:', reviewText)
      
      // Fallback review if JSON parsing fails
      review = {
        overallScore: 7,
        overallRating: "Good",
        summary: "Your content shows promise! The AI generated image aligns well with your prompt and has good visual appeal.",
        visualQuality: 8,
        visualQualityFeedback: "The image quality is excellent with good composition and color balance.",
        engagementPotential: 7,
        engagementFeedback: "This type of content typically performs well on social media with proper timing and hashtags.",
        platformFit: 8,
        platformFeedback: `The content is well-suited for ${platform} and follows platform best practices.`,
        contentQuality: 7,
        contentFeedback: "The content is relevant and engaging, with room for optimization in caption and hashtags.",
        recommendations: [
          {
            title: "Optimize Caption",
            description: "Add more engaging hooks and relevant hashtags to increase discoverability.",
            impact: "High"
          },
          {
            title: "Post Timing",
            description: "Consider posting during peak engagement hours for your audience.",
            impact: "Medium"
          },
          {
            title: "Add Call-to-Action",
            description: "Include a clear call-to-action to encourage user interaction.",
            impact: "High"
          }
        ],
        bestTimes: [
          { day: "Monday", time: "9:00 AM", engagement: "High" },
          { day: "Wednesday", time: "2:00 PM", engagement: "High" },
          { day: "Friday", time: "6:00 PM", engagement: "Medium" },
          { day: "Sunday", time: "11:00 AM", engagement: "High" }
        ]
      }
    }

    return NextResponse.json({
      success: true,
      review: review
    })

  } catch (error) {
    console.error('AI Review error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate AI review',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 