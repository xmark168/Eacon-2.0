import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.STABILITY_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'STABILITY_API_KEY is not configured',
        instructions: [
          '1. Get your API key from https://platform.stability.ai/account/keys',
          '2. Add STABILITY_API_KEY="your-key-here" to your .env file',
          '3. Restart your development server'
        ]
      }, { status: 400 })
    }

    // Test API key validity
    const response = await fetch('https://api.stability.ai/v1/user/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: `Invalid Stability API key: ${response.status}`,
        details: errorText
      }, { status: 400 })
    }

    const accountData = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Stability AI API key is valid!',
      account: {
        id: accountData.id,
        profile: accountData.profile,
        organizations: accountData.organizations?.length || 0
      }
    })

  } catch (error) {
    console.error('Stability API test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test Stability API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 