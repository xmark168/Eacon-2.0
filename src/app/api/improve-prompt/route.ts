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
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { prompt, style } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    console.log('Improving prompt with OpenAI:', prompt)
    console.log('Style:', style)

    const styleInstructions = {
      realistic: 'photorealistic, professional photography, high quality, detailed',
      artistic: 'artistic style, creative, beautiful artwork, stylized',
      anime: 'anime style, manga art, Japanese animation, colorful',
      abstract: 'abstract art, modern design, creative interpretation',
      minimalist: 'minimalist design, clean, simple, elegant',
      vintage: 'vintage style, retro aesthetic, nostalgic, classic'
    }

    const styleInstruction = styleInstructions[style as keyof typeof styleInstructions] || styleInstructions.realistic

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI image generation prompt engineer. Your job is to improve and enhance image generation prompts to create better, more detailed, and more visually appealing results. 

Guidelines:
- Keep the core subject and intent of the original prompt
- Add specific details about lighting, composition, colors, texture, mood
- Include technical photography terms when appropriate for ${styleInstruction} style
- Make it more descriptive and vivid
- Keep it concise but detailed (under 100 words)
- Don't change the main subject completely
- Return ONLY the improved prompt, no explanations`
          },
          {
            role: 'user',
            content: `Improve this image generation prompt for ${style} style: "${prompt}"`
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      })

      const improvedPrompt = response.choices[0]?.message?.content?.trim()

      if (!improvedPrompt) {
        throw new Error('No improved prompt returned from OpenAI')
      }

      console.log('Original prompt:', prompt)
      console.log('Improved prompt:', improvedPrompt)

      return NextResponse.json({
        success: true,
        originalPrompt: prompt,
        improvedPrompt: improvedPrompt,
        tokensUsed: 2, // Approximate cost for improvement
        style: style
      })

    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError)
      
      if (openaiError.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      } else if (openaiError.status === 402) {
        return NextResponse.json(
          { error: 'Insufficient credits. Please check your OpenAI billing.' },
          { status: 402 }
        )
      }
      
      throw openaiError
    }

  } catch (error: any) {
    console.error('Improve prompt error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to improve prompt' },
      { status: 500 }
    )
  }
} 