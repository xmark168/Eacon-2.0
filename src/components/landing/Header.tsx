'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export function Header() {
  return (
    <header className="relative z-50 bg-white/80 backdrop-blur-md border-b border-surface-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-2 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Eacon
            </span>
          </motion.div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#demo" className="text-surface-600 hover:text-surface-900 transition-colors">
              Demo
            </Link>
            <Link href="#features" className="text-surface-600 hover:text-surface-900 transition-colors">
              Features
            </Link>
            <Link href="#about" className="text-surface-600 hover:text-surface-900 transition-colors">
              About
            </Link>
            <Link href="#pricing" className="text-surface-600 hover:text-surface-900 transition-colors">
              Pricing
            </Link>
            <Link href="/payment" className="text-surface-600 hover:text-surface-900 transition-colors">
              Buy Tokens
            </Link>
          </nav>

          {/* Auth Buttons */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <Link href="/login" className="btn-ghost">
              Login
            </Link>
            <Link href="/signup" className="btn-primary">
              Get Started
            </Link>
          </motion.div>
        </div>
      </div>
    </header>
  )
} 