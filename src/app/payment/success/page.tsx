'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const orderCode = searchParams.get('orderCode') || searchParams.get('id');
    
    if (orderCode) {
      verifyPayment(orderCode);
    } else {
      setIsVerifying(false);
      setVerificationStatus('failed');
    }
  }, [searchParams]);

  const verifyPayment = async (orderCode: string) => {
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderCode }),
      });

      const result = await response.json();

      if (result.success && result.status === 'PAID') {
        setVerificationStatus('success');
        setPaymentData(result.data);
      } else {
        setVerificationStatus('failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setVerificationStatus('failed');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Verifying Payment
          </h2>
          <p className="text-gray-600">
            Please wait while we confirm your payment...
          </p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Verification Failed
          </h2>
          <p className="text-gray-600 mb-8">
            We couldn't verify your payment. Please contact support if you believe this is an error.
          </p>
          <div className="space-y-4">
            <Link
              href="/payment"
              className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-colors inline-block"
            >
              Try Again
            </Link>
            <Link
              href="/contact"
              className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors inline-block"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Thank you for your purchase. Your tokens have been added to your account and are ready to use.
          </p>
        </motion.div>

        {paymentData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Payment Details
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Order Code</label>
                  <p className="text-lg font-semibold text-gray-900">{paymentData.orderCode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount Paid</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {paymentData.amount?.toLocaleString('vi-VN')} VNĐ
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Method</label>
                  <p className="text-lg font-semibold text-gray-900">PayOS</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-lg font-semibold text-green-600">Completed</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center space-y-6"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-8 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Start Creating
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="border border-gray-300 text-gray-700 py-3 px-8 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 max-w-2xl mx-auto">
            <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
            <p className="text-blue-800">
              Your tokens have been automatically added to your account. 
              You can now start creating amazing AI-generated content!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 