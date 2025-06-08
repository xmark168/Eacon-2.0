import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Create a simple SVG placeholder
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#f3f4f6"/>
      <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af">
        Image Expired
      </text>
      <text x="200" y="210" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af">
        Regenerate to get new image
      </text>
      <circle cx="200" cy="120" r="30" fill="none" stroke="#d1d5db" stroke-width="2"/>
      <path d="M185 120 L200 105 L215 120 M200 105 L200 135" fill="none" stroke="#d1d5db" stroke-width="2"/>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    }
  })
} 