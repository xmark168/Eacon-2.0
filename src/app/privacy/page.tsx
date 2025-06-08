import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Eacon AI',
  description: 'Privacy Policy for Eacon AI - How we collect, use, and protect your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-white rounded-xl shadow-lg p-8 lg:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-surface-900 mb-4">Privacy Policy</h1>
            <p className="text-surface-600">
              Last updated: <span className="font-medium">January 15, 2025</span>
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-surface-900 mb-4">1. Introduction</h2>
              <p className="text-surface-700 mb-4">
                Welcome to Eacon AI ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, store, and protect your information when you use our AI-powered content creation platform.
              </p>
              <p className="text-surface-700">
                This policy applies to all users of Eacon AI, including visitors to our website and registered users of our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-surface-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-surface-900 mb-3">2.1 Personal Information</h3>
              <ul className="list-disc list-inside text-surface-700 mb-4 space-y-2">
                <li>Name and email address when you create an account</li>
                <li>Profile information you choose to provide</li>
                <li>Payment information (processed securely through third-party providers)</li>
                <li>Communication preferences and settings</li>
              </ul>

              <h3 className="text-xl font-semibold text-surface-900 mb-3">2.2 Usage Data</h3>
              <ul className="list-disc list-inside text-surface-700 mb-4 space-y-2">
                <li>AI-generated content and prompts you create</li>
                <li>Usage patterns and feature interactions</li>
                <li>Device information and technical data</li>
                <li>IP address and location data (if permitted)</li>
              </ul>

              <h3 className="text-xl font-semibold text-surface-900 mb-3">2.3 Cookies and Tracking</h3>
              <p className="text-surface-700">
                We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-surface-900 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-surface-700 space-y-2">
                <li>Provide and improve our AI content generation services</li>
                <li>Process payments and manage your account</li>
                <li>Send service updates and important notifications</li>
                <li>Analyze usage patterns to enhance our platform</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Comply with legal obligations and protect our rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-surface-900 mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-surface-700 mb-4">
                We do not sell your personal information. We may share your data in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-surface-700 space-y-2">
                <li><strong>Service Providers:</strong> Third-party vendors who help us operate our platform</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or asset sale</li>
                <li><strong>With Your Consent:</strong> When you explicitly agree to sharing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-surface-900 mb-4">5. Data Security</h2>
              <p className="text-surface-700 mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-surface-700 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and authentication measures</li>
                <li>Secure payment processing through certified providers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-surface-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-surface-700 mb-4">
                You have the following rights regarding your personal data:
              </p>
              <ul className="list-disc list-inside text-surface-700 space-y-2">
                <li><strong>Access:</strong> Request copies of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate or incomplete information</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong>Objection:</strong> Object to processing of your personal data</li>
                <li><strong>Restriction:</strong> Request limitation of processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-surface-900 mb-4">7. Data Retention</h2>
              <p className="text-surface-700">
                We retain your personal data only as long as necessary for the purposes outlined in this policy. Account data is typically retained for the duration of your account plus a reasonable period thereafter. Generated content may be retained for service improvement purposes unless you request deletion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-surface-900 mb-4">8. International Data Transfers</h2>
              <p className="text-surface-700">
                Your data may be processed in countries outside your residence. We ensure appropriate safeguards are in place to protect your data in accordance with applicable laws, including standard contractual clauses and adequacy decisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-surface-900 mb-4">9. Children's Privacy</h2>
              <p className="text-surface-700">
                Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we discover we have collected such information, we will delete it promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-surface-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-surface-700">
                We may update this privacy policy from time to time. We will notify you of any material changes via email or through our platform. Your continued use of our services after such notification constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-surface-900 mb-4">11. Contact Us</h2>
              <p className="text-surface-700 mb-4">
                If you have any questions about this privacy policy or our data practices, please contact us:
              </p>
              <div className="bg-surface-50 rounded-lg p-6">
                <p className="text-surface-700 mb-2">
                  <strong>Email:</strong> privacy@eacon.ai
                </p>
                <p className="text-surface-700 mb-2">
                  <strong>Address:</strong> 123 AI Innovation Drive, Tech City, TC 12345
                </p>
                <p className="text-surface-700">
                  <strong>Data Protection Officer:</strong> dpo@eacon.ai
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
} 