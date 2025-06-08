'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Palette, Wand2, Calendar } from 'lucide-react'

const actions = [
  {
    title: 'Generate New Image',
    description: 'Create stunning AI images from your prompts',
    icon: Sparkles,
    href: '/generate',
    color: 'from-primary-500 to-primary-600'
  },
  {
    title: 'Browse Templates',
    description: 'Explore our collection of premium templates',
    icon: Palette,
    href: '/templates',
    color: 'from-secondary-500 to-secondary-600'
  },
  {
    title: 'AI Suggestions',
    description: 'Get AI-powered content suggestions',
    icon: Wand2,
    href: '/suggestions',
    color: 'from-green-500 to-green-600'
  },
  {
    title: 'Schedule Posts',
    description: 'Plan and schedule your social media posts',
    icon: Calendar,
    href: '/scheduler',
    color: 'from-blue-500 to-blue-600'
  }
]

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-xl font-semibold text-surface-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href={action.href} className="block">
                <div className="card p-6 hover:shadow-material-lg transition-all duration-300 group">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${action.color} mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-surface-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-surface-600">
                    {action.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
} 