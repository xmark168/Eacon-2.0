import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { HeroSection } from '@/components/landing/HeroSection'
import { DemoSection } from '@/components/landing/DemoSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { AboutSection } from '@/components/landing/AboutSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { CTASection } from '@/components/landing/CTASection'
import { Header } from '@/components/landing/Header'
import { Footer } from '@/components/landing/Footer'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  // Redirect to dashboard if user is already logged in
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      <main>
        <HeroSection />
        <DemoSection />
        <FeaturesSection />
        <AboutSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
} 