'use client'

import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Palette, 
  Calendar, 
  Zap, 
  Share2, 
  Edit3,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'AI Image Generation',
    description: 'Create stunning visuals from simple text prompts using advanced AI models',
    color: 'text-primary-600'
  },
  {
    icon: Palette,
    title: 'Smart Templates',
    description: 'Choose from hundreds of professionally designed templates for every platform',
    color: 'text-secondary-600'
  },
  {
    icon: Edit3,
    title: 'Built-in Editor',
    description: 'Fine-tune your images with text overlays, cropping, and logo placement',
    color: 'text-green-600'
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Schedule posts across all social platforms at optimal times for engagement',
    color: 'text-blue-600'
  },
  {
    icon: Share2,
    title: 'Multi-Platform',
    description: 'Optimize content for Instagram, Twitter, Facebook, LinkedIn, and TikTok',
    color: 'text-purple-600'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Generate professional content in seconds, not hours',
    color: 'text-yellow-600'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together with your team to create and approve content',
    color: 'text-pink-600'
  },
  {
    icon: TrendingUp,
    title: 'Analytics & Insights',
    description: 'Track performance and optimize your content strategy with detailed analytics',
    color: 'text-indigo-600'
  },
  {
    icon: Clock,
    title: 'Content History',
    description: 'Access all your generated content and reuse successful posts',
    color: 'text-teal-600'
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-surface-900 mb-6">
            Everything you need to create
            <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              {' '}viral content
            </span>
          </h2>
          <p className="text-xl text-surface-600 max-w-3xl mx-auto">
            Our comprehensive platform combines AI-powered image generation with professional 
            editing tools and smart scheduling features.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="card p-6 h-full hover:shadow-material-lg transition-all duration-300 group-hover:-translate-y-1">
                  <div className={`inline-flex p-3 rounded-lg bg-surface-50 ${feature.color} mb-4`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-surface-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-surface-600">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-surface-900 mb-4">
              Ready to transform your content strategy?
            </h3>
            <p className="text-surface-600 mb-6">
              Join thousands of creators who are already using Eacon to generate viral content.
            </p>
            <button className="btn-primary">
              Start Your Free Trial
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 