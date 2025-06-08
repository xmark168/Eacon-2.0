'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Calendar, 
  Filter, 
  Download, 
  Search,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Gift,
  Zap,
  Clock
} from 'lucide-react'
import Link from 'next/link'

interface TokenTransaction {
  id: string
  amount: number
  type: 'EARNED' | 'PURCHASED' | 'USED' | 'ADJUSTMENT'
  description: string
  createdAt: string
}

interface TokenHistory {
  totalEarned: number
  totalUsed: number
  transactions: TokenTransaction[]
}

export default function TokenHistoryPage() {
  const { data: session, status } = useSession()
  const [tokenHistory, setTokenHistory] = useState<TokenHistory>({ totalEarned: 0, totalUsed: 0, transactions: [] })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState<string>('all')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/login')
    }

    fetchTokenHistory()
  }, [session, status])

  const fetchTokenHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/tokens/history-all')
      const data = await response.json()
      
      if (data.success) {
        setTokenHistory(data)
      }
    } catch (error) {
      console.error('Error fetching token history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'EARNED':
        return <Gift className="h-5 w-5 text-green-600" />
      case 'PURCHASED':
        return <CreditCard className="h-5 w-5 text-blue-600" />
      case 'USED':
        return <Zap className="h-5 w-5 text-orange-600" />
      case 'ADJUSTMENT':
        return <TrendingUp className="h-5 w-5 text-purple-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'EARNED':
      case 'PURCHASED':
      case 'ADJUSTMENT':
        return 'text-green-600'
      case 'USED':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const filteredTransactions = tokenHistory.transactions.filter(transaction => {
    const matchesFilter = filter === 'all' || transaction.type === filter
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Date filter logic
    let matchesDate = true
    if (dateRange !== 'all') {
      const transactionDate = new Date(transaction.createdAt)
      const now = new Date()
      
      switch (dateRange) {
        case '7d':
          matchesDate = transactionDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          matchesDate = transactionDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          matchesDate = transactionDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
      }
    }
    
    return matchesFilter && matchesSearch && matchesDate
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transaction history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link 
                href="/dashboard"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Token Transaction History</h1>
                <p className="text-gray-600">Track all your token activities and transactions</p>
              </div>
            </div>
            <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earned</p>
                <p className="text-2xl font-bold text-green-600">+{tokenHistory.totalEarned.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Used</p>
                <p className="text-2xl font-bold text-red-600">-{tokenHistory.totalUsed.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Net Balance</p>
                <p className={`text-2xl font-bold ${tokenHistory.totalEarned - tokenHistory.totalUsed >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tokenHistory.totalEarned - tokenHistory.totalUsed >= 0 ? '+' : ''}{(tokenHistory.totalEarned - tokenHistory.totalUsed).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="EARNED">Earned</option>
              <option value="PURCHASED">Purchased</option>
              <option value="USED">Used</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>

            {/* Date Range */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </motion.div>

        {/* Transactions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Transactions ({filteredTransactions.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.type)}
                        <span className="text-sm font-medium text-gray-900">
                          {transaction.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{transaction.description}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'USED' ? '-' : '+'}
                        {Math.abs(transaction.amount).toLocaleString()} tokens
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-600">Try adjusting your filters to see more results.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
} 