'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Zap, Users } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                <Sparkles className="h-4 w-4 mr-2" />
                AI-Powered Content Creation
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-surface-900 mb-6 text-balance">
              Create Stunning{' '}
              <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                AI Images
              </span>{' '}
              for Social Media
            </h1>
            
            <p className="text-xl text-surface-600 mb-8 text-balance">
              Generate, edit, and schedule professional social media content with our 
              AI-powered platform. Transform your ideas into viral-ready visuals in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link href="/signup" className="btn-primary text-lg px-8 py-3">
                Start Creating Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="#demo" className="btn-secondary text-lg px-8 py-3">
                Watch Demo
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-2xl font-bold text-surface-900">100</span>
                </div>
                <p className="text-sm text-surface-600">Free Tokens</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-2xl font-bold text-surface-900">100+</span>
                </div>
                <p className="text-sm text-surface-600">Happy Users</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Sparkles className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-2xl font-bold text-surface-900">1K+</span>
                </div>
                <p className="text-sm text-surface-600">Images Created</p>
              </div>
            </div>
          </motion.div>
          
          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-material-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 opacity-90" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Sparkles className="h-24 w-24 mx-auto mb-4 animate-bounce-gentle" />
                  <h3 className="text-2xl font-bold mb-2">AI Magic</h3>
                  <p className="text-lg opacity-90">Your ideas, visualized instantly</p>
                </div>
              </div>
            </div>
            
            {/* Floating Cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -right-4 bg-white rounded-xl shadow-material p-4"
            >
              <div className="text-sm font-medium text-surface-900">✨ Just generated!</div>
              <div className="text-xs text-surface-600">Instagram Post Ready</div>
            </motion.div>
            
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-material p-4"
            >
              <div className="text-sm font-medium text-surface-900">🚀 Scheduled</div>
              <div className="text-xs text-surface-600">Posts for this week</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 