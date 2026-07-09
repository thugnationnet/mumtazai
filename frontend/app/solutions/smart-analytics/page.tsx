import Link from 'next/link'

export default function SmartAnalytics() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container-custom section-padding-lg">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-600 via-accent-500 to-brand-700 bg-clip-text text-transparent mb-6">
            Smart Analytics
          </h1>
          <p className="text-xl text-neural-600 leading-relaxed mb-8">
            Transform raw data into actionable insights with AI-powered analytics that predict trends, 
            identify opportunities, and provide real-time business intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/overview" className="btn-primary">
              View Analytics Dashboard
            </Link>
            <Link href="/resources/case-studies" className="btn-secondary">
              See Analytics Examples
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-neural-800 mb-3">Real-time Dashboards</h3>
            <p className="text-neural-600">Interactive dashboards with live data visualization</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100 text-center">
            <div className="text-4xl mb-4">🔮</div>
            <h3 className="text-xl font-bold text-neural-800 mb-3">Predictive Modeling</h3>
            <p className="text-neural-600">Advanced AI models that forecast future trends</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100 text-center">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-neural-800 mb-3">Data Visualization</h3>
            <p className="text-neural-600">Beautiful, interactive charts and reports</p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/solutions/overview" className="text-brand-600 hover:text-brand-700 font-medium">
            ← Back to All Solutions
          </Link>
        </div>
      </div>
    </div>
  )
}