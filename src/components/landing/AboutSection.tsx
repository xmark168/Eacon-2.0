'use client'

import { motion } from 'framer-motion'
import { Sparkles, Target, Heart, Zap, Users, Trophy } from 'lucide-react'
import Image from 'next/image'

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-gradient-to-br from-surface-50 to-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-surface-900 mb-6">
            About{' '}
            <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Eacon
            </span>
          </h2>
          <p className="text-xl text-surface-600 max-w-3xl mx-auto">
            We're on a mission to democratize content creation through AI, making professional-quality 
            social media content accessible to everyone.
          </p>
        </motion.div>

        {/* Story Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold text-surface-900 mb-6">Our Story</h3>
            <p className="text-lg text-surface-600 mb-6">
              Founded in 2024, Eacon was born from a simple idea: what if anyone could create 
              stunning visual content without needing years of design experience or expensive software?
            </p>
            <p className="text-lg text-surface-600 mb-6">
              Our team of AI researchers, designers, and developers came together to build a platform 
              that combines the latest advances in artificial intelligence with intuitive design 
              principles, making creativity accessible to all.
            </p>
            <p className="text-lg text-surface-600">
              Today, we're proud to serve creators, businesses, and individuals worldwide, 
              helping them tell their stories through beautiful, AI-generated visuals.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-primary-500 to-secondary-500 p-8">
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
              <div className="relative h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <Sparkles className="h-32 w-32 mx-auto mb-6 opacity-90" />
                  <h4 className="text-2xl font-bold mb-2">AI-Powered Creativity</h4>
                  <p className="text-lg opacity-90">Transforming ideas into reality</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h3 className="text-3xl font-bold text-surface-900 text-center mb-12">Our Values</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-2xl shadow-material">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-surface-900 mb-3">User-Centric</h4>
              <p className="text-surface-600">
                Every feature we build starts with understanding our users' needs and challenges.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-2xl shadow-material">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-surface-900 mb-3">Innovation</h4>
              <p className="text-surface-600">
                We constantly push the boundaries of what's possible with AI and design technology.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-2xl shadow-material">
              <div className="w-16 h-16 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-surface-900 mb-3">Accessibility</h4>
              <p className="text-surface-600">
                Professional-quality design tools should be available to everyone, everywhere.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Team Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl p-8 lg:p-12 shadow-material-lg"
        >
          <h3 className="text-3xl font-bold text-surface-900 text-center mb-12">By the Numbers</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-primary-600 mr-2" />
                <span className="text-3xl font-bold text-surface-900">100+</span>
              </div>
              <p className="text-surface-600 font-medium">Happy Users</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6 text-primary-600 mr-2" />
                <span className="text-3xl font-bold text-surface-900">1K+</span>
              </div>
              <p className="text-surface-600 font-medium">Images Generated</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Trophy className="h-6 w-6 text-primary-600 mr-2" />
                <span className="text-3xl font-bold text-surface-900">99%</span>
              </div>
              <p className="text-surface-600 font-medium">Satisfaction Rate</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Zap className="h-6 w-6 text-primary-600 mr-2" />
                <span className="text-3xl font-bold text-surface-900">24/7</span>
              </div>
              <p className="text-surface-600 font-medium">AI Availability</p>
            </div>
          </div>
        </motion.div>

        {/* Vision */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <h3 className="text-3xl font-bold text-surface-900 mb-6">Our Vision</h3>
          <p className="text-xl text-surface-600 max-w-4xl mx-auto mb-8">
            We envision a world where creativity knows no bounds, where anyone with an idea can 
            bring it to life through the power of AI. We're building the future of content creation, 
            one image at a time.
          </p>
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full text-white font-medium">
            <Sparkles className="h-5 w-5 mr-2" />
            Join us on this journey
          </div>
        </motion.div>
      </div>
    </section>
  )
} 