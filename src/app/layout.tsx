import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider'
import { Toaster } from '@/components/ui/Toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Eacon - AI-Powered Social Media Content Creator',
  description: 'Generate stunning AI images for your social media content with Eacon. Create, edit, and schedule posts across all platforms.',
  keywords: ['AI images', 'social media', 'content creation', 'image generation', 'social posts'],
  authors: [{ name: 'Eacon Team' }],
  openGraph: {
    title: 'Eacon - AI-Powered Social Media Content Creator',
    description: 'Generate stunning AI images for your social media content with Eacon.',
    url: 'https://eacon.app',
    siteName: 'Eacon',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Eacon - AI Image Generator',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eacon - AI-Powered Social Media Content Creator',
    description: 'Generate stunning AI images for your social media content with Eacon.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
          shortcut: '/favicon.svg',
      apple: '/apple-touch-icon.svg',
    other: [
      {
        rel: 'icon',
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3B82F6" />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <AuthProvider>
          <AnalyticsProvider>
            {children}
            <Toaster />
          </AnalyticsProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 