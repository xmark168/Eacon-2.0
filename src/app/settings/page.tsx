'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  User, 
  Link2, 
  Shield, 
  ArrowLeft,
  Camera,
  Mail,
  Phone,
  MapPin,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Check,
  X,
  Plus,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  Save,
  Trash2
} from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  id: string
  name: string
  email: string
  image?: string
  phone?: string
  location?: string
  website?: string
  bio?: string
}

interface SocialConnection {
  id: string
  platform: string
  platformId: string
  username?: string
  isActive: boolean
  connectedAt: string
}

type TabType = 'profile' | 'social' | 'account'

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    image: '',
    phone: '',
    location: '',
    website: '',
    bio: ''
  })
  
  // Social connections state
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([])
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/login')
    }
    
    fetchUserData()
    fetchSocialConnections()
  }, [session, status])

  // Check for Google connection success from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const connected = urlParams.get('connected')
    const tab = urlParams.get('tab')
    
    if (connected === 'google' && tab === 'account') {
      // Clear URL params
      window.history.replaceState({}, '', '/settings')
      
      // Set active tab to account (security)
      setActiveTab('account')
      
      // Refresh social connections to show the new Google connection
      setTimeout(() => {
        fetchSocialConnections()
      }, 1000)
      
      // Show success message
      showNotification('Google account connected successfully!')
    }
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      
      // Fetch profile
      const profileResponse = await fetch('/api/user/profile')
      const profileData = await profileResponse.json()
      
      if (profileData.success) {
        setProfile(profileData.profile)
      } else {
        // Fall back to session data
        if (session?.user) {
          setProfile({
            id: session.user.id || '',
            name: session.user.name || '',
            email: session.user.email || '',
            image: session.user.image || '',
            phone: '',
            location: '',
            website: '',
            bio: ''
          })
        }
      }

      // Fetch social connections
      const socialResponse = await fetch('/api/user/social-connections')
      const socialData = await socialResponse.json()
      
      if (socialData.success) {
        setSocialConnections(socialData.connections)
      }
      
    } catch (error) {
      console.error('Error fetching user data:', error)
      // Initialize with session data if API fails
      if (session?.user) {
        setProfile({
          id: session.user.id || '',
          name: session.user.name || '',
          email: session.user.email || '',
          image: session.user.image || '',
          phone: '',
          location: '',
          website: '',
          bio: ''
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchSocialConnections = async () => {
    try {
      const socialResponse = await fetch('/api/user/social-connections')
      const socialData = await socialResponse.json()
      
      if (socialData.success) {
        setSocialConnections(socialData.connections)
      }
    } catch (error) {
      console.error('Error fetching social connections:', error)
    }
  }

  const updateProfile = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update session data
        await update({ 
          name: profile.name,
          image: profile.image 
        })
        showNotification('Profile updated successfully!')
      } else {
        showNotification('Failed to update profile: ' + data.error, 'error')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      showNotification('Failed to update profile. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const connectSocialAccount = async (platform: string) => {
    try {
      setConnectingPlatform(platform)
      
      if (platform === 'google') {
        // Use NextAuth Google OAuth for Google connection
        await signIn('google', { 
          callbackUrl: '/settings?tab=account&connected=google'
        })
        return
      }
      
      // For other platforms, simulate connection with mock data
      // In a real app, this would redirect to OAuth flow
      const mockConnection = {
        platform: platform.toUpperCase(),
        platformId: `demo_${platform}_${Date.now()}`,
        accessToken: `mock_token_${Date.now()}`,
        refreshToken: `mock_refresh_${Date.now()}`
      }
      
      const response = await fetch('/api/user/social-connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockConnection)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSocialConnections(prev => [...prev, data.connection])
        showNotification(`${platform} account connected successfully!`)
      } else {
        showNotification('Failed to connect account: ' + data.error, 'error')
      }
      
    } catch (error) {
      console.error('Error connecting social account:', error)
      showNotification('Failed to connect account. Please try again.', 'error')
    } finally {
      setConnectingPlatform(null)
    }
  }

  const disconnectSocialAccount = async (connectionId: string, platform?: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return
    
    try {
      let response
      
      if (platform && platform.toLowerCase() === 'google') {
        // Use specific Google unlink API
        response = await fetch('/api/auth/google/link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'unlink' })
        })
      } else {
        // Use general social connection API
        response = await fetch(`/api/user/social-connections/${connectionId}`, {
          method: 'DELETE'
        })
      }
      
      const data = await response.json()
      
      if (data.success) {
        setSocialConnections(prev => prev.filter(conn => conn.id !== connectionId))
        showNotification(`${platform || 'Account'} disconnected successfully!`)
      } else {
        showNotification('Failed to disconnect account: ' + data.error, 'error')
      }
    } catch (error) {
      console.error('Error disconnecting account:', error)
      showNotification('Failed to disconnect account. Please try again.', 'error')
    }
  }

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification('New passwords do not match', 'error')
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      showNotification('Password must be at least 6 characters long', 'error')
      return
    }

    try {
      setSaving(true)
      
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordForm)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        showNotification('Password changed successfully!')
      } else {
        showNotification('Failed to change password: ' + data.error, 'error')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      showNotification('Failed to change password. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'google': return <div className="h-5 w-5 bg-blue-500 rounded-sm flex items-center justify-center text-white text-xs font-bold">G</div>
      case 'instagram': return <Instagram className="h-5 w-5" />
      case 'facebook': return <Facebook className="h-5 w-5" />
      case 'twitter': return <Twitter className="h-5 w-5" />
      case 'linkedin': return <Linkedin className="h-5 w-5" />
      case 'youtube': return <Youtube className="h-5 w-5" />
      case 'tiktok': return <div className="h-5 w-5 bg-black rounded-sm flex items-center justify-center text-white text-xs font-bold">T</div>
      default: return <Globe className="h-5 w-5" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'google': return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'instagram': return 'bg-pink-50 text-pink-600 border-pink-200'
      case 'facebook': return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'twitter': return 'bg-sky-50 text-sky-600 border-sky-200'
      case 'linkedin': return 'bg-indigo-50 text-indigo-600 border-indigo-200'
      case 'youtube': return 'bg-red-50 text-red-600 border-red-200'
      case 'tiktok': return 'bg-gray-50 text-gray-900 border-gray-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  const availablePlatforms = [
    { id: 'instagram', name: 'Instagram', description: 'Connect your Instagram account' },
    { id: 'facebook', name: 'Facebook', description: 'Connect your Facebook account' },
    { id: 'twitter', name: 'Twitter', description: 'Connect your Twitter account' },
    { id: 'linkedin', name: 'LinkedIn', description: 'Connect your LinkedIn account' },
    { id: 'youtube', name: 'YouTube', description: 'Connect your YouTube account' },
    { id: 'tiktok', name: 'TikTok', description: 'Connect your TikTok account' }
  ]

  const getConnectionForPlatform = (platform: string) => {
    return socialConnections.find(conn => conn.platform.toLowerCase() === platform.toLowerCase())
  }

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-200 text-green-800'
            : 'bg-red-100 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <X className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
                <SettingsIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage your account and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <nav className="space-y-1 bg-white rounded-lg shadow p-4">
              {[
                { id: 'profile' as TabType, name: 'Profile', icon: User },
                { id: 'social' as TabType, name: 'Social Accounts', icon: Link2 },
                { id: 'account' as TabType, name: 'Account Security', icon: Shield }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="mt-8 lg:mt-0 lg:col-span-9">
            <div className="bg-white shadow rounded-lg">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    <p className="text-gray-600">Update your personal information and profile picture.</p>
                  </div>

                  <div className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <img
                            src={profile.image || 'https://via.placeholder.com/80x80?text=Avatar'}
                            alt="Profile"
                            className="h-20 w-20 rounded-full object-cover"
                          />
                          <button className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 hover:bg-blue-700 transition-colors">
                            <Camera className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Profile photo</h3>
                        <p className="text-sm text-gray-500">This will be displayed on your profile.</p>
                        <div className="mt-2">
                          <button className="text-sm text-blue-600 hover:text-blue-500">
                            Update photo
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="tel"
                            value={profile.phone || ''}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Optional"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={profile.location || ''}
                            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="City, Country"
                          />
                        </div>
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Website
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="url"
                            value={profile.website || ''}
                            onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          value={profile.bio || ''}
                          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={updateProfile}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Accounts Tab */}
              {activeTab === 'social' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Social Media Accounts</h2>
                    <p className="text-gray-600">Connect your social media accounts to enable cross-platform posting.</p>
                  </div>

                  <div className="space-y-4">
                    {availablePlatforms.map((platform) => {
                      const connection = getConnectionForPlatform(platform.id)
                      const isConnected = !!connection
                      const isConnecting = connectingPlatform === platform.id

                      return (
                        <div
                          key={platform.id}
                          className={`border rounded-lg p-4 ${
                            isConnected ? 'border-green-200 bg-green-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`p-2 rounded-lg border ${getPlatformColor(platform.id)}`}>
                                {getPlatformIcon(platform.id)}
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">{platform.name}</h3>
                                <p className="text-sm text-gray-500">
                                  {isConnected 
                                    ? `Connected as @${connection.username || connection.platformId}`
                                    : platform.description
                                  }
                                </p>
                                {isConnected && (
                                  <p className="text-xs text-gray-400">
                                    Connected on {new Date(connection.connectedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {isConnected ? (
                                <>
                                  <div className="flex items-center text-green-600">
                                    <Check className="h-4 w-4 mr-1" />
                                    <span className="text-sm">Connected</span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      disconnectSocialAccount(connection.id, connection.platform)
                                    }}
                                    className="text-red-600 hover:text-red-700 p-1"
                                    title="Disconnect"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    connectSocialAccount(platform.id)
                                  }}
                                  disabled={isConnecting}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 disabled:opacity-50"
                                >
                                  {isConnecting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-1" />
                                      Connect
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Account Security Tab */}
              {activeTab === 'account' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Account Security</h2>
                    <p className="text-gray-600">Manage your password and account security settings.</p>
                  </div>

                  <div className="space-y-6">
                    {/* Google Account Security */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-blue-600" />
                        Google Account Security
                      </h3>
                      
                      {(() => {
                        const googleConnection = getConnectionForPlatform('google')
                        const isGoogleConnected = !!googleConnection
                        const isConnecting = connectingPlatform === 'google'
                        
                        return (
                          <div className={`border rounded-lg p-4 ${
                            isGoogleConnected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                  <div className="h-6 w-6 bg-blue-500 rounded-sm flex items-center justify-center text-white text-sm font-bold">G</div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">Google Authentication</h4>
                                  <p className="text-sm text-gray-500">
                                    {isGoogleConnected 
                                      ? `Connected to Google account: ${googleConnection.platformId}`
                                      : 'Connect your Google account for enhanced security and easy sign-in'
                                    }
                                  </p>
                                  {isGoogleConnected && (
                                    <p className="text-xs text-gray-400">
                                      Connected on {new Date(googleConnection.connectedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {isGoogleConnected ? (
                                  <>
                                    <div className="flex items-center text-green-600">
                                      <Check className="h-4 w-4 mr-1" />
                                      <span className="text-sm font-medium">Secured</span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        disconnectSocialAccount(googleConnection.id, 'google')
                                      }}
                                      className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-100"
                                      title="Disconnect Google Account"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      connectSocialAccount('google')
                                    }}
                                    disabled={isConnecting}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isConnecting ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                        Connecting...
                                      </>
                                    ) : (
                                      <>
                                        <Shield className="h-4 w-4 mr-2" />
                                        Connect Google
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Change Password */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                              className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <button
                          onClick={changePassword}
                          disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Changing...
                            </>
                          ) : (
                            'Change Password'
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-red-900 mb-2">Danger Zone</h3>
                      <p className="text-sm text-red-700 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 