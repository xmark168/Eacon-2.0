'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, CreditCard, Zap, Star, Crown, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { calculateDiscount, getDiscountPercent, type AccountType } from '@/lib/discounts';

// SECURITY: Only define USD amounts - server calculates tokens
const TOKEN_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    amountUSD: 5,
    popular: false,
    description: 'Perfect for trying out our AI features',
    features: ['1,000 tokens', '~33 images', 'Basic support']
  },
  {
    id: 'creator',
    name: 'Creator Pack',
    amountUSD: 12,
    popular: true,
    description: 'Great for content creators',
    features: ['2,400 tokens', '~80 images', 'Priority support']
  },
  {
    id: 'professional',
    name: 'Professional Pack',
    amountUSD: 25,
    popular: false,
    description: 'For professional use cases',
    features: ['5,000 tokens', '~167 images', 'VIP support']
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    amountUSD: 50,
    popular: false,
    description: 'Maximum value for heavy users',
    features: ['10,000 tokens', '~333 images', '24/7 support']
  }
];

interface BuyTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTokens: number;
}

export function BuyTokensModal({ isOpen, onClose, currentTokens }: BuyTokensModalProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState(5);
  const [showCustom, setShowCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Security: Clear states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccess(null);
      setSelectedPackage(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Security: Input validation for custom amounts
  const validateCustomAmount = (amount: number): boolean => {
    return amount >= 1 && amount <= 100 && Number.isInteger(amount);
  };

  // SECURITY: Only send USD amount - server calculates tokens
  const handlePurchase = async (amountUSD: number, packageName: string) => {
    if (isLoading) return; // Prevent double-clicks

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Client-side validation (server will validate again)
      if (!amountUSD || amountUSD < 1 || amountUSD > 100) {
        throw new Error('Amount must be between $1 and $100 USD');
      }

      if (!Number.isInteger(amountUSD)) {
        throw new Error('Amount must be a whole number');
      }

      // SECURITY: Only send amount - server calculates everything else
      const requestData = {
        packageType: packageName,
        amountUSD: amountUSD, // Only amount, no token manipulation possible
      };

      console.log(`🔒 Secure payment request: $${amountUSD} USD for ${packageName}`);

      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      if (!result.success || !result.data?.checkoutUrl) {
        throw new Error('Invalid payment response from server');
      }

      // Display server calculation to user
      if (result.calculation) {
        console.log(`�� Server calculated: $${result.calculation.amountUSD} = ${result.calculation.tokens} tokens`);
        setSuccess(`Payment created: ${result.calculation.tokens} tokens for $${result.calculation.amountUSD} USD`);
      }

      // Security: Open payment in new window
      const paymentWindow = window.open(
        result.data.checkoutUrl, 
        '_blank',
        'noopener,noreferrer,width=800,height=600'
      );

      if (!paymentWindow) {
        throw new Error('Payment window blocked. Please allow popups and try again.');
      }

      // Auto-close after showing calculation
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error: any) {
      console.error('🚨 Payment error:', error.message);
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate preview tokens (client-side display only)
  const getPreviewTokens = (amountUSD: number) => amountUSD * 200;
  const getPreviewVND = (amountUSD: number) => amountUSD * 26050;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Buy Tokens</h2>
                <p className="text-gray-600">Current balance: {currentTokens.toLocaleString()} tokens</p>
                <p className="text-sm text-purple-600">🔒 Secure server-side calculation: 200 tokens = $1 USD</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                disabled={isLoading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-green-700">{success}</p>
              </div>
            )}

            {/* Package Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {TOKEN_PACKAGES.map((pkg) => {
                const previewTokens = getPreviewTokens(pkg.amountUSD);
                const previewVND = getPreviewVND(pkg.amountUSD);
                
                return (
                  <motion.div
                    key={pkg.id}
                    className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedPackage === pkg.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    } ${pkg.popular ? 'ring-2 ring-purple-200' : ''}`}
                    onClick={() => setSelectedPackage(pkg.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        ${pkg.amountUSD} USD
                      </div>
                      <div className="text-lg text-gray-800 mb-2">
                        = {previewTokens.toLocaleString()} tokens
                        <span className="text-sm text-gray-500 block">
                          ≈ {previewVND.toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">{pkg.description}</p>
                      
                      <div className="space-y-2">
                        {pkg.features.map((feature, index) => (
                          <div key={index} className="flex items-center justify-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(pkg.amountUSD, pkg.name);
                      }}
                      disabled={isLoading}
                      className="w-full mt-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        'Processing...'
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          Buy ${pkg.amountUSD}
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Custom Amount Toggle */}
            <div className="text-center mb-6">
              <button
                onClick={() => setShowCustom(!showCustom)}
                className="text-purple-600 hover:text-purple-700 font-semibold"
                disabled={isLoading}
              >
                {showCustom ? 'Hide Custom Amount' : 'Need a custom amount?'}
              </button>
            </div>

            {/* Custom Amount Section */}
            {showCustom && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Custom Amount</h3>
                
                <div className="max-w-md mx-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (USD) - Min: $1, Max: $100
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={customAmount}
                    onChange={(e) => {
                      const value = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
                      setCustomAmount(value);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {[5, 10, 20, 50].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setCustomAmount(amount)}
                        disabled={isLoading}
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

                  <div className="bg-gray-50 rounded-lg p-4 text-center mt-4">
                    <div className="text-lg font-semibold text-gray-900">
                      = {getPreviewTokens(customAmount).toLocaleString()} tokens
                    </div>
                    <div className="text-sm text-gray-600">
                      ≈ {getPreviewVND(customAmount).toLocaleString('vi-VN')} VNĐ
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ~{Math.floor(getPreviewTokens(customAmount) / 30)} images
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      💡 Final amount calculated securely by server
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(customAmount, `Custom ${customAmount} USD`)}
                    disabled={isLoading || !validateCustomAmount(customAmount)}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                  >
                    {isLoading ? (
                      'Processing...'
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Buy ${customAmount} USD
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Security & Payment Info */}
            <div className="mt-8 bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security & Payment Information
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• 🔒 <strong>Secure server-side calculation:</strong> 200 tokens = $1 USD (fixed rate)</p>
                <p>• ✅ All payments securely processed by PayOS</p>
                <p>• 🏦 Supports Vietnamese bank cards, international cards, QR codes, e-wallets</p>
                <p>• ⚡ Tokens added instantly after payment verification</p>
                <p>• 🛡️ Amount validation prevents manipulation attacks</p>
                <p>• 📝 All transactions encrypted and audited for security</p>
                <p>• 🚫 No sensitive payment data stored on our servers</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 