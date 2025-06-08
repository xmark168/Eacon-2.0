'use client'

import { useState, useEffect } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handleToast = (event: CustomEvent) => {
      const { message, type = 'info' } = event.detail
      const id = Math.random().toString(36).substr(2, 9)
      
      setToasts(prev => [...prev, { id, message, type }])
      
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
      }, 4000)
    }

    window.addEventListener('show-toast', handleToast as EventListener)
    
    return () => {
      window.removeEventListener('show-toast', handleToast as EventListener)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            px-4 py-3 rounded-lg shadow-material animate-slide-down
            ${toast.type === 'success' ? 'bg-green-500 text-white' : ''}
            ${toast.type === 'error' ? 'bg-red-500 text-white' : ''}
            ${toast.type === 'info' ? 'bg-blue-500 text-white' : ''}
          `}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}

// Helper function to show toasts
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  window.dispatchEvent(new CustomEvent('show-toast', {
    detail: { message, type }
  }))
} 