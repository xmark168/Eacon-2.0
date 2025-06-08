'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Coins, Plus, Minus, Star } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { calculateDiscount, getDiscountPercent, type AccountType } from '@/lib/discounts';

interface BuyTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTokens: number;
}

const PRESET_PACKAGES = [
  {
    id: 'creator',
    name: 'Creator',
    tokens: 2000,
    price: 9,
    priceVND: 234450, // 9 USD * 26,050 VND
    popular: false,
    description: 'Perfect for content creators',
  },
  {
    id: 'pro',
    name: 'Pro',
    tokens: 8000,
    price: 24,
    priceVND: 625200, // 24 USD * 26,050 VND
    popular: true,
    description: 'Best value for businesses',
  },
];

export function BuyTokensModal({ isOpen, onClose, currentTokens }: BuyTokensModalProps) {
  const { data: session } = useSession();
  const [selectedOption, setSelectedOption] = useState<'preset' | 'custom'>('preset');
  const [selectedPackage, setSelectedPackage] = useState('pro');
  const [customAmount, setCustomAmount] = useState(1); // Minimum $1
  const [isLoading, setIsLoading] = useState(false);

  const accountType = (session?.user?.accountType || 'FREE') as AccountType;
  const discountPercent = getDiscountPercent(accountType);

  // Calculate tokens for custom amount (200 tokens = $1)
  const getTokensForAmount = (amount: number) => Math.floor(amount * 200);
  const customTokens = getTokensForAmount(customAmount);
  const customPriceVND = customAmount * 26050; // Convert USD to VND (current rate: 1 USD = 26,050 VND)

  const handleCustomAmountChange = (value: number) => {
    const newAmount = Math.max(1, value); // Minimum $1
    setCustomAmount(newAmount);
  };

  const handlePurchase = async (packageData: any) => {
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
        window.open(result.data.checkoutUrl, '_blank');
        onClose();
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Buy Tokens</h2>
                <p className="text-gray-600">Current balance: {currentTokens.toLocaleString()} tokens</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Option Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setSelectedOption('preset')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  selectedOption === 'preset'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Popular Packages
              </button>
              <button
                onClick={() => setSelectedOption('custom')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  selectedOption === 'custom'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Custom Amount
              </button>
            </div>

            {selectedOption === 'preset' ? (
              /* Preset Packages */
              <div className="grid md:grid-cols-2 gap-4">
                {PRESET_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                      selectedPackage === pkg.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${pkg.popular ? 'ring-2 ring-purple-500 ring-opacity-20' : ''}`}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Most Popular
                        </div>
                      </div>
                    )}

                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                      <p className="text-gray-600 mb-4">{pkg.description}</p>
                      
                      <div className="mb-4">
                        <div className="text-3xl font-bold text-purple-600 mb-1">
                          {pkg.priceVND.toLocaleString('vi-VN')} VNĐ
                        </div>
                        <div className="text-sm text-gray-500">≈ ${pkg.price} USD</div>
                      </div>

                      <div className="bg-gray-100 rounded-lg p-3 mb-4">
                        <div className="text-2xl font-bold text-gray-900">
                          {pkg.tokens.toLocaleString()} tokens
                        </div>
                        <div className="text-sm text-gray-600">
                          ~{Math.floor(pkg.tokens / 30)} images
                        </div>
                      </div>

                      <button
                        onClick={() => handlePurchase(pkg)}
                        disabled={isLoading}
                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                          pkg.popular
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isLoading ? 'Processing...' : 'Purchase Now'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Custom Amount */
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Custom Amount</h3>
                  <p className="text-gray-600">Choose your own amount (minimum $1)</p>
                </div>

                {/* Amount Input */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Amount (USD)
                  </label>
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={() => handleCustomAmountChange(customAmount - 1)}
                      disabled={customAmount <= 1}
                      className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-xl font-bold"
                      />
                    </div>
                    
                    <button
                      onClick={() => handleCustomAmountChange(customAmount + 1)}
                      className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[5, 10, 20, 50].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setCustomAmount(amount)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          customAmount === amount
                            ? 'bg-purple-500 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>

                  {/* Conversion Display */}
                  <div className="text-center space-y-2">
                    <div className="text-lg font-semibold text-gray-900">
                      = {customTokens.toLocaleString()} tokens
                    </div>
                    <div className="text-sm text-gray-600">
                      ≈ {customPriceVND.toLocaleString('vi-VN')} VNĐ
                    </div>
                    <div className="text-xs text-gray-500">
                      ~{Math.floor(customTokens / 30)} images
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase({
                    name: `Custom ${customAmount} USD`,
                    tokens: customTokens,
                    priceVND: customPriceVND,
                  })}
                  disabled={isLoading || customAmount < 1}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    'Processing...'
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Purchase {customTokens.toLocaleString()} Tokens
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Payment Info */}
            <div className="mt-8 bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Payment Information</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Secure payment powered by PayOS</p>
                <p>• Supports Vietnamese bank cards, international cards, QR codes, e-wallets</p>
                <p>• Tokens are added instantly after successful payment</p>
                <p>• Rate: 200 tokens = $1.00 USD</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 