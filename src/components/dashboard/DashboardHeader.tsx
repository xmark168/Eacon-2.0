'use client'

import { motion } from 'framer-motion'
import { User } from 'next-auth'
import { Coins } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface DashboardHeaderProps {
  user: User & { tokens?: number; accountType?: string }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { data: session } = useSession()
  const accountType = session?.user?.accountType || 'FREE'
  
  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getAccountBadge = () => {
    switch (accountType) {
      case 'FREE':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">Free</span>
      case 'CREATOR':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">Creator</span>
      case 'PRO':
        return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">Pro</span>
      case 'PREMIUM':
        return <span className="px-2 py-1 text-xs bg-gold-100 text-gold-700 rounded-full font-medium">Premium</span>
      default:
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">Free</span>
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900">
            {greeting()}, {user.name?.split(' ')[0] || 'Creator'}!
          </h1>
          <p className="text-surface-600 mt-1">
            Ready to create some amazing content today?
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <div className="card p-4 flex items-center space-x-3">
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-2 rounded-lg">
              <Coins className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-surface-900">
                  {(user.tokens || 0).toLocaleString()} tokens
                </p>
                {getAccountBadge()}
              </div>
              <p className="text-xs text-surface-600">Available</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 