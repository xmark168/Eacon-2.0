'use client'

import { motion } from 'framer-motion'
import { Coins, Plus, TrendingUp, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BuyTokensModal } from '@/components/ui/BuyTokensModal'

interface TokenUsageProps {
  tokens?: number
}

interface TokenHistory {
  totalEarned: number
  totalUsed: number
  transactions: any[]
}

export function TokenUsage({ tokens }: TokenUsageProps) {
  const [tokenHistory, setTokenHistory] = useState<TokenHistory>({ totalEarned: 0, totalUsed: 0, transactions: [] })
  const [loading, setLoading] = useState(true)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [fixingDuplicates, setFixingDuplicates] = useState(false)
  const [fixMessage, setFixMessage] = useState('')
  
  // Calculate token tier for styling
  const tokenTiers = [
    { min: 0, max: 20, color: 'red', label: 'Low' },
    { min: 21, max: 50, color: 'yellow', label: 'Medium' },
    { min: 51, max: Infinity, color: 'green', label: 'Good' }
  ]
  
  const maxTokens = 100
  
  // Use 0 if tokens is undefined
  const safeTokens = tokens || 0
  
  // Tính % current balance dựa trên token hiện tại so với giới hạn tối đa
  const balancePercentage = Math.min((safeTokens / maxTokens) * 100, 100)
  
  useEffect(() => {
    const fetchTokenHistory = async () => {
      try {
        const response = await fetch('/api/users/tokens/history')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setTokenHistory(data)
          }
        }
      } catch (error) {
        console.error('Error fetching token history:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTokenHistory()
  }, [])

  const handleFixDuplicateTokens = async () => {
    setFixingDuplicates(true)
    setFixMessage('')
    
    try {
      const response = await fetch('/api/payment/fix-duplicate', {
        method: 'POST',
      })
      
      const result = await response.json()
      
      if (result.success) {
        setFixMessage(result.message)
        if (result.tokensRemoved > 0) {
          // Refresh page to show updated token balance
          window.location.reload()
        }
      } else {
        setFixMessage('Error: ' + result.error)
      }
    } catch (error) {
      setFixMessage('Failed to fix duplicate tokens')
    } finally {
      setFixingDuplicates(false)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-surface-900">Token Balance</h3>
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-2 rounded-lg">
          <Coins className="h-5 w-5 text-white" />
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-surface-900">
            {safeTokens.toLocaleString()}
          </span>
          <span className="text-sm text-surface-600">tokens</span>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-surface-600 mb-2">
          <span>Current Balance</span>
          <span>{balancePercentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-surface-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              balancePercentage > 80 
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : balancePercentage > 50
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                : 'bg-gradient-to-r from-red-500 to-red-600'
            }`}
            style={{ width: `${balancePercentage}%` }}
          />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-surface-600">This month</span>
          </div>
          <span className="font-medium text-surface-900">
            {loading 
              ? '--- ' 
              : `+${tokenHistory.totalEarned} earned`
            }
          </span>
        </div>
        
        <div className="space-y-2">
          <button 
            onClick={() => setShowBuyModal(true)}
            className="w-full btn-primary text-sm py-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Buy More Tokens
          </button>
          
          <Link
            href="/tokens/history"
            className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <TrendingUp className="h-4 w-4" />
            <span>View History</span>
          </Link>
        </div>
       
      
        
        {fixMessage && (
          <div className={`text-xs mt-2 p-2 rounded ${
            fixMessage.includes('Error') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {fixMessage}
          </div>
        )}
      </div>

      {/* Buy Tokens Modal */}
      <BuyTokensModal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        currentTokens={safeTokens}
      />
    </motion.div>
  )
} 