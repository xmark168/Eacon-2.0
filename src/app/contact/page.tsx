'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MapPin, Phone, Clock, Send, MessageSquare, HelpCircle, Users } from 'lucide-react'

// Metadata would be added in a separate file or through app directory structure
// For client components, we handle SEO differently

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', subject: '', category: 'general', message: '' })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help with your account or technical issues',
      contact: 'support@eacon.ai',
      action: 'mailto:support@eacon.ai'
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      contact: 'Available 24/7',
      action: '#'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Speak directly with our support team',
      contact: '+1 (555) 123-4567',
      action: 'tel:+15551234567'
    }
  ]

  const supportCategories = [
    {
      icon: HelpCircle,
      title: 'General Support',
      description: 'Questions about features, billing, or account issues'
    },
    {
      icon: Users,
      title: 'Enterprise Sales',
      description: 'Custom solutions for teams and large organizations'
    },
    {
      icon: Mail,
      title: 'Partnerships',
      description: 'Collaboration opportunities and business partnerships'
    }
  ]

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-surface-900 mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-surface-600 max-w-3xl mx-auto">
            We're here to help! Whether you have questions, need support, or want to explore partnerships, 
            our team is ready to assist you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-surface-900 mb-6">Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-surface-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-surface-700 mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="general">General Support</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing Question</option>
                    <option value="enterprise">Enterprise Sales</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-surface-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="How can we help you?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-surface-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Please describe your question or request in detail..."
                  />
                </div>

                {submitStatus === 'success' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800">
                      ✅ Thank you! Your message has been sent successfully. We'll get back to you within 24 hours.
                    </p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">
                      ❌ Sorry, there was an error sending your message. Please try again or contact us directly.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            {/* Contact Methods */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-surface-900 mb-6">Contact Methods</h2>
              <div className="space-y-6">
                {contactMethods.map((method, index) => {
                  const IconComponent = method.icon
                  return (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="bg-primary-100 rounded-lg p-3">
                        <IconComponent className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-surface-900 mb-1">{method.title}</h3>
                        <p className="text-surface-600 text-sm mb-2">{method.description}</p>
                        <a
                          href={method.action}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {method.contact}
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Office Information */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-surface-900 mb-6">Office Information</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary-600 mt-1" />
                  <div>
                    <p className="font-medium text-surface-900">Address</p>
                    <p className="text-surface-600">123 AI Innovation Drive<br />Tech City, TC 12345<br />United States</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-primary-600 mt-1" />
                  <div>
                    <p className="font-medium text-surface-900">Business Hours</p>
                    <p className="text-surface-600">Monday - Friday: 9:00 AM - 6:00 PM EST<br />Saturday - Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Categories */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-surface-900 mb-6">What can we help with?</h2>
              <div className="space-y-4">
                {supportCategories.map((category, index) => {
                  const IconComponent = category.icon
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <IconComponent className="h-5 w-5 text-primary-600 mt-1" />
                      <div>
                        <h3 className="font-medium text-surface-900">{category.title}</h3>
                        <p className="text-surface-600 text-sm">{category.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* FAQ Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <div className="bg-surface-100 rounded-xl p-8">
            <h3 className="text-xl font-bold text-surface-900 mb-4">
              Looking for quick answers?
            </h3>
            <p className="text-surface-600 mb-6">
              Check out our comprehensive FAQ section for immediate answers to common questions.
            </p>
            <a
              href="#"
              className="btn-secondary inline-flex items-center"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Visit FAQ
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 