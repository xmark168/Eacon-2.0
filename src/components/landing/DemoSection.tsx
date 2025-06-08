'use client'

import { motion } from 'framer-motion'
import { Play, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function DemoSection() {
  return (
    <section id="demo" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-surface-900 mb-6">
            See Eacon in{' '}
            <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Action
            </span>
          </h2>
          <p className="text-xl text-surface-600 max-w-3xl mx-auto">
            Watch how easy it is to create stunning AI-generated images and transform your social media content in just minutes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-material-lg bg-surface-900">
            {/* YouTube Embed */}
            <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/SVcsDDABEkM"
                title="Eacon AI Image Generator Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>

            {/* Overlay for loading state or custom thumbnail */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/90 to-secondary-500/90 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="text-center text-white">
                <Play className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Watch Demo</h3>
                <p className="text-sm opacity-90">Learn how to create amazing content</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-lg text-surface-600 mb-6">
              Ready to create your own AI masterpieces?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-primary text-lg px-8 py-3">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/templates" className="btn-secondary text-lg px-8 py-3">
                Browse Templates
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Features highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold text-surface-900 mb-2">Choose Template</h3>
              <p className="text-surface-600">Select from our library of professional templates or start from scratch</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold text-surface-900 mb-2">Describe Your Vision</h3>
              <p className="text-surface-600">Use simple words to describe what you want to create</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold text-surface-900 mb-2">Generate & Share</h3>
              <p className="text-surface-600">Get your AI-generated image and share it directly to social media</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 