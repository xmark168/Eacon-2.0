'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Check, CreditCard, Loader2, Star } from 'lucide-react';

const PACKAGES = [
  {
    id: 'creator',
    name: 'Creator',
    tokens: 2000,
    price: 9,
    priceVND: 234450, // 9 USD * 26050 VND
    popular: false,
    features: [
      '2,000 tokens monthly',
      '~67 images per month',
      'Basic templates',
      'Standard support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tokens: 8000,
    price: 24,
    priceVND: 625200, // 24 USD * 26050 VND
    popular: true,
    features: [
      '8,000 tokens monthly',
      '~280 images per month',
      'Premium templates',
      'Priority support',
      'Advanced editing tools',
    ],
  },
  {
    id: 'custom',
    name: 'Custom Amount',
    tokens: 0, // Will be calculated
    price: 1, // Minimum
    priceVND: 26050, // Minimum 1 USD * 26050 VND
    popular: false,
    features: [
      'Choose your own amount',
      'Minimum $1 USD',
      'Instant delivery',
      'No expiration',
    ],
  },
];

export default function PaymentPage() {
  const { data: session } = useSession();
  const [selectedPackage, setSelectedPackage] = useState<string>('pro');
  const [isLoading, setIsLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState(1); // Minimum $1
  const [showCustomModal, setShowCustomModal] = useState(false);

  const handlePayment = async (packageData: any) => {
    if (!session) {
      alert('Please sign in to continue');
      return;
    }

    // Handle custom amount
    if (packageData.id === 'custom') {
      setShowCustomModal(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageType: packageData.name,
          tokens: packageData.tokens,
          amount: packageData.priceVND,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to PayOS payment page
        window.location.href = result.data.checkoutUrl;
      } else {
        alert('Failed to create payment. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomPayment = async () => {
    if (!session) return;

    const customTokens = Math.floor(customAmount * 200);
    const customPriceVND = customAmount * 26050;

    setIsLoading(true);

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageType: `Custom ${customAmount} USD`,
          tokens: customTokens,
          amount: customPriceVND,
        }),
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = result.data.checkoutUrl;
        setShowCustomModal(false);
      } else {
        alert('Failed to create payment. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Choose Your Token Package
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Select the perfect package to power your AI content creation journey. 
            All payments are securely processed by PayOS.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {PACKAGES.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                pkg.popular
                  ? 'border-purple-500 scale-105'
                  : selectedPackage === pkg.id
                  ? 'border-purple-300'
                  : 'border-gray-200 hover:border-purple-200'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                                 {/* Package Header */}
                 <div className="text-center mb-6">
                   <h3 className="text-2xl font-bold text-gray-900 mb-2">
                     {pkg.name}
                   </h3>
                   {pkg.id === 'custom' ? (
                     <div>
                       <div className="text-3xl font-bold text-purple-600 mb-1">
                         From {pkg.priceVND.toLocaleString('vi-VN')} VNĐ
                       </div>
                       <div className="text-sm text-gray-500">
                         Minimum ${pkg.price} USD
                       </div>
                     </div>
                   ) : (
                     <div>
                       <div className="flex items-center justify-center gap-2">
                         <span className="text-4xl font-bold text-purple-600">
                           {pkg.priceVND.toLocaleString('vi-VN')}
                         </span>
                         <span className="text-gray-500">VNĐ</span>
                       </div>
                       <div className="text-sm text-gray-500 mt-1">
                         ≈ ${pkg.price} USD
                       </div>
                     </div>
                   )}
                 </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Payment Button */}
                <button
                  onClick={() => handlePayment(pkg)}
                  disabled={isLoading}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  {isLoading ? 'Processing...' : 'Purchase with PayOS'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Payment Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Payment Information
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">
                Supported Payment Methods
              </h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Vietnamese bank cards (ATM/Debit)</li>
                <li>• International credit cards (Visa, Mastercard)</li>
                <li>• Bank transfer (QR Code)</li>
                <li>• E-wallets (MoMo, ZaloPay, etc.)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">
                Security & Support
              </h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Secure encryption with PayOS</li>
                <li>• Instant token delivery</li>
                <li>• 24/7 customer support</li>
                <li>• Money-back guarantee</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Custom Amount Modal */}
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCustomModal(false)} />
            <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Custom Amount</h3>
                <p className="text-gray-600">Choose your preferred amount (minimum $1)</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Math.max(1, Number(e.target.value)))}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-xl font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 20, 50].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setCustomAmount(amount)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        customAmount === amount
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    = {Math.floor(customAmount * 200).toLocaleString()} tokens
                  </div>
                  <div className="text-sm text-gray-600">
                    ≈ {(customAmount * 26050).toLocaleString('vi-VN')} VNĐ
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ~{Math.floor(Math.floor(customAmount * 200) / 30)} images
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCustomModal(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCustomPayment}
                    disabled={isLoading || customAmount < 1}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Purchase'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 