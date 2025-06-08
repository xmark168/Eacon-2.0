'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  LayoutDashboard,
  Image,
  Palette,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Wand2,
  Lightbulb
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Templates', href: '/templates', icon: Palette },
  { name: 'Generate', href: '/generate', icon: Wand2 },
  { name: 'AI Suggestions', href: '/suggestions', icon: Lightbulb },
  { name: 'My Images', href: '/images', icon: Image },
  { name: 'Scheduler', href: '/scheduler', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-surface-900/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-material">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-2 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Eacon
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-surface-400 hover:text-surface-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="p-4">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
                      isActive
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors w-full mt-4"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign out</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="bg-white shadow-material border-r border-surface-200">
          <div className="flex items-center space-x-2 p-6 border-b">
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-2 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Eacon
            </span>
          </div>
          <nav className="p-6">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            <button
              onClick={() => signOut()}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors w-full mt-4"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign out</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-surface-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-2 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Eacon
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-surface-400 hover:text-surface-600"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 