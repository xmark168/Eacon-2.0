'use client';

import { motion } from 'framer-motion';
import { XCircle, Home, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-orange-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your payment was cancelled. No charges have been made to your account.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What happened?
          </h3>
          <div className="text-center text-gray-600 space-y-4">
            <p>
              You chose to cancel your payment process. This could be due to:
            </p>
            <ul className="text-left max-w-md mx-auto space-y-2">
              <li>• You clicked the cancel button</li>
              <li>• You closed the payment window</li>
              <li>• You navigated away from the payment page</li>
              <li>• There was a technical issue</li>
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center space-y-6"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/payment"
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-8 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Try Payment Again
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
            <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
            <p className="text-blue-800">
              If you experienced any issues during the payment process, 
              please don't hesitate to contact our support team.
            </p>
            <Link
              href="/contact"
              className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-semibold"
            >
              Contact Support →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 