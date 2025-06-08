'use client'

import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Crown, Star, Zap, Calendar, ArrowUpRight } from 'lucide-react'
import { getAccountTypeLabel, getAccountTypeColor, type AccountType } from '@/lib/discounts'
import Link from 'next/link'

export function AccountStatus() {
  const { data: session } = useSession()

  if (!session?.user) return null

  const accountType = (session.user.accountType || 'FREE') as AccountType
  const planExpiresAt = session.user.planExpiresAt

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'FREE':
        return <Zap className="h-5 w-5" />
      case 'CREATOR':
        return <Star className="h-5 w-5" />
      case 'PRO':
        return <Crown className="h-5 w-5" />
      case 'PREMIUM':
        return <Crown className="h-5 w-5" />
      default:
        return <Zap className="h-5 w-5" />
    }
  }

  const formatExpiryDate = (date: Date | string | null) => {
    if (!date) return null
    const expiryDate = new Date(date)
    const now = new Date()
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft <= 0) return 'Expired'
    if (daysLeft === 1) return '1 day left'
    return `${daysLeft} days left`
  }

  const expiryInfo = formatExpiryDate(planExpiresAt)
  const isExpiringSoon = planExpiresAt && new Date(planExpiresAt).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-surface-900">Account Status</h3>
        {accountType !== 'FREE' && (
          <div className="flex items-center text-xs text-primary-600">
            <Calendar className="h-4 w-4 mr-1" />
            {expiryInfo}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Account Type Badge */}
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getAccountTypeColor(accountType)}`}>
            {getAccountIcon(accountType)}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-surface-900">
                {getAccountTypeLabel(accountType)}
              </span>
              {accountType !== 'FREE' && (
                <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full font-medium">
                  Active
                </span>
              )}
            </div>
            {accountType !== 'FREE' && expiryInfo && (
              <p className={`text-sm ${isExpiringSoon ? 'text-orange-600' : 'text-surface-600'}`}>
                {isExpiringSoon ? '⚠️ ' : ''}Plan expires in {expiryInfo.toLowerCase()}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
} 