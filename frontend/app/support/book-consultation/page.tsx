import Link from 'next/link'

export default function BookConsultation() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Book a Consultation
          </h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Schedule a personalized consultation with our AI experts to discuss your specific needs and goals.
          </p>
        </div>
      </section>

      <div className="container-custom section-padding">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="font-bold text-neural-800 mb-2">Schedule</h3>
              <p className="text-sm text-neural-600">Choose a time that works for you</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="font-bold text-neural-800 mb-2">Discuss</h3>
              <p className="text-sm text-neural-600">Talk about your AI agent needs</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="font-bold text-neural-800 mb-2">Launch</h3>
              <p className="text-sm text-neural-600">Get started with your solution</p>
            </div>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neural-700 mb-2">First Name</label>
                <input type="text" className="w-full px-4 py-3 border border-neural-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neural-700 mb-2">Last Name</label>
                <input type="text" className="w-full px-4 py-3 border border-neural-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neural-700 mb-2">Email</label>
              <input type="email" className="w-full px-4 py-3 border border-neural-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neural-700 mb-2">Company</label>
              <input type="text" className="w-full px-4 py-3 border border-neural-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neural-700 mb-2">What are you interested in?</label>
              <select className="w-full px-4 py-3 border border-neural-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Select an option</option>
                <option value="enterprise">Enterprise Solutions</option>
                <option value="agents">AI Agent Implementation</option>
                <option value="custom">Custom Development</option>
                <option value="consulting">Strategy Consulting</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neural-700 mb-2">Tell us about your project</label>
              <textarea rows={4} className="w-full px-4 py-3 border border-neural-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Describe your needs, goals, and timeline..."></textarea>
            </div>
            
            <button type="submit" className="w-full btn-primary">
              Schedule Consultation
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}