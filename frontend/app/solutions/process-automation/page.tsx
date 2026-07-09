import Link from 'next/link'

export default function ProcessAutomation() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container-custom section-padding-lg">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-600 via-accent-500 to-brand-700 bg-clip-text text-transparent mb-6">
            Process Automation
          </h1>
          <p className="text-xl text-neural-600 leading-relaxed mb-8">
            Automate complex business processes with intelligent AI workflows that adapt, 
            learn, and optimize over time to maximize efficiency and reduce manual work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://mumtaz.ai/agents" className="btn-primary">
              Try Automation Agents
            </Link>
            <Link href="/resources/tutorials" className="btn-secondary">
              View Tutorials
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100 text-center">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-xl font-bold text-neural-800 mb-3">Workflow Designer</h3>
            <p className="text-neural-600">Visual drag-and-drop interface for creating complex automation workflows</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-neural-800 mb-3">Smart Triggers</h3>
            <p className="text-neural-600">AI-powered triggers that adapt to changing business conditions</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100 text-center">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-neural-800 mb-3">Process Analytics</h3>
            <p className="text-neural-600">Real-time insights into process performance and optimization opportunities</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/solutions/overview" className="text-brand-600 hover:text-brand-700 font-medium">
            ← Back to All Solutions
          </Link>
        </div>
      </div>
    </div>
  )
}