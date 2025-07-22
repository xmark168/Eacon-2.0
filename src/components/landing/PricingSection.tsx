'use client'

import { motion } from 'framer-motion'
import { Check, Sparkles, Crown, Zap, Plus } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    tokens: '100',
    images: '3-4',
    description: 'Phù hợp cho người mới bắt đầu',
    features: [
      '100 tokens miễn phí',
      'Mẫu cơ bản',
      'Chất lượng tiêu chuẩn',
      'Công cụ chỉnh sửa cơ bản',
      'Hỗ trợ cộng đồng'
    ],
    cta: 'Bắt đầu',
    popular: false,
    icon: Sparkles
  },
  {
    name: 'Creator',
    price: '$9',
    tokens: '3,600',
    images: '~120',
    description: 'Dành cho nhà sáng tạo nội dung',
    features: [
      '3,600 tokens/tháng',
      'Tất cả mẫu cao cấp',
      'Chất lượng cao',
      'Bộ công cụ chỉnh sửa nâng cao',
      'Lên lịch đăng bài',
      'Hỗ trợ ưu tiên'
    ],
    cta: 'Nâng cấp',
    popular: true,
    icon: Crown
  },
  {
    name: 'Pro',
    price: '$24',
    tokens: '9,600',
    images: '~320',
    description: 'Cho doanh nghiệp và agency',
    features: [
      '9,600 tokens/tháng',
      'Tất cả mẫu cao cấp',
      'Chất lượng siêu cao',
      'Làm việc nhóm',
      'Xử lý ưu tiên',
      'Báo cáo phân tích',
      'API riêng',
      'Hỗ trợ riêng'
    ],
    cta: 'Go Pro',
    popular: false,
    icon: Zap
  }
]

export function PricingSection() {
  return (
    <section className="py-24 bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-surface-900 mb-4">
            Choose Your Perfect Plan
          </h2>
          <p className="text-xl text-surface-600 max-w-3xl mx-auto">
            From creative individuals to businesses, we have pricing plans that scale with your needs.
            Generate stunning AI content with transparent, token-based pricing.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${plan.popular ? 'scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className={`h-full bg-white rounded-2xl shadow-lg border-2 p-8 ${
                  plan.popular 
                    ? 'border-primary-500 shadow-xl' 
                    : 'border-surface-200 hover:border-surface-300'
                } transition-all duration-200`}>
                  <div className="text-center mb-6">
                    <div className={`inline-flex p-3 rounded-lg mb-4 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white' 
                        : 'bg-surface-100 text-primary-600'
                    }`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-surface-900 mb-2">{plan.name}</h3>
                    <p className="text-surface-600 mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center mb-2">
                      <span className="text-4xl font-bold text-surface-900">{plan.price}</span>
                      {plan.price !== 'Free' && <span className="text-surface-600 ml-2">/month</span>}
                    </div>
                    <p className="text-primary-600 font-medium">{plan.tokens} tokens</p>
                    <p className="text-surface-500 text-sm">({plan.images} images)</p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-surface-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => {
                      if (plan.name === 'Starter') {
                        // Free plan - redirect to registration
                        window.location.href = '/auth/signin';
                      } else {
                        // Paid plans - redirect to payment page
                        window.location.href = '/payment';
                      }
                    }}
                    className={`w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Additional Token Purchase Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="bg-white rounded-xl p-6 shadow-lg border border-surface-200 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-surface-900 mb-3">💡 How Our Token System Works</h3>
                <div className="space-y-2 text-sm text-surface-600">
                  <div className="flex justify-between">
                    <span className="font-medium text-surface-900">Basic Generation</span>
                    <span>25-30 tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-surface-900">Premium Templates</span>
                    <span>+10-15 tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-surface-900">Image Variations</span>
                    <span>+5-10 tokens</span>
                  </div>
                </div>
              </div>
              
              <div className="border-l border-surface-200 pl-8">
                <h3 className="text-xl font-bold text-surface-900 mb-3">
                  <Plus className="inline-block h-5 w-5 mr-2" />
                  Need More Tokens?
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="bg-primary-50 rounded-lg p-4">
                    <div className="font-bold text-primary-900 text-lg">$2.5 cho 1,000 tokens</div>
                    <div className="text-primary-700">Purchase additional tokens anytime</div>
                    <div className="text-primary-600 text-xs mt-1">No expiration • Add to any plan</div>
                  </div>
                  <div className="text-surface-600">
                    • Tokens never expire<br/>
                    • Instant top-up available<br/>
                    • Volume discounts for 10,000+ tokens
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-surface-600">
            Need a custom enterprise solution? <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">Contact our sales team</a> for volume discounts and dedicated support.
          </p>
        </motion.div>
      </div>
    </section>
  )
} 