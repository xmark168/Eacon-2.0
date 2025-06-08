'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-surface-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-2 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">Eacon</span>
          </div>
          
          <div className="flex space-x-6">
            <Link href="/privacy" className="text-surface-300 hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-surface-300 hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="text-surface-300 hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
        
        <div className="border-t border-surface-800 mt-8 pt-8 text-center">
          <p className="text-surface-400">
            © 2024 Eacon. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
} 