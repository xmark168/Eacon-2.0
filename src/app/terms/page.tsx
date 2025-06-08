export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <p className="text-gray-600 mb-6">
            Welcome to Eacon AI Platform. These terms govern your use of our AI-powered image generation service.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Usage Guidelines</h2>
          <ul className="list-disc list-inside text-gray-600 mb-6">
            <li>Use the service responsibly and in accordance with applicable laws</li>
            <li>Do not generate content that violates our content policy</li>
            <li>Respect intellectual property rights</li>
            <li>Maintain account security</li>
          </ul>
          
          <h2 className="text-xl font-semibold mb-4">Content Policy</h2>
          <p className="text-gray-600 mb-6">
            Generated content must not include harmful, illegal, or inappropriate material. 
            We reserve the right to monitor and remove content that violates our policies.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Service Availability</h2>
          <p className="text-gray-600 mb-6">
            We strive to maintain service availability but cannot guarantee uninterrupted access. 
            Service may be temporarily unavailable for maintenance or updates.
          </p>
          
          <p className="text-sm text-gray-500 mt-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
} 