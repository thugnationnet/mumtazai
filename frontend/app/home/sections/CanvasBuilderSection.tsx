import Link from 'next/link';
import SectionShell from './SectionShell';

export default function CanvasBuilderSection() {
  return (
    <SectionShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-600 text-sm font-medium mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            NEW: Canvas Builder
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-slate-800">
            Build Apps with
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
              {' '}
              AI-Powered{' '}
            </span>
            Canvas
          </h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Transform your ideas into fully functional web applications in
            seconds. Our Canvas Builder uses advanced AI to generate
            beautiful, responsive HTML applications from simple text
            descriptions.
          </p>
          <ul className="space-y-4 mb-8">
            {[
              'Generate complete web apps from text prompts',
              'Advanced AI-powered code generation',
              'Live preview with code export',
              'Iterative refinement with AI assistant',
              'Pre-built templates for quick starts',
            ].map((feature, idx) => (
              <li
                key={idx}
                className="flex items-center gap-3 text-slate-700"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                {feature}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-4">
            <Link
              href="https://studio.mumtaz.ai"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 group"
            >
              Launch Canvas Builder
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/60 bg-white/50 hover:bg-white/70 text-slate-700 font-semibold rounded-xl transition-all"
            >
              View Documentation
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="bg-white/30 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/50">
            <div className="flex items-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm border-b border-white/40">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <span className="text-xs text-slate-500 ml-2">
                Canvas Builder
              </span>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-purple-500 text-sm font-mono">
                    Prompt:
                  </span>
                  <span className="text-slate-600 text-sm">
                    &quot;Create a modern SaaS landing page...&quot;
                  </span>
                </div>
                <div className="h-px bg-purple-200/50 my-4"></div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/40">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-500">
                      Generated Preview
                    </span>
                    <span className="text-xs text-green-600">
                      ✓ Complete
                    </span>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-lg h-32 flex items-center justify-center">
                    <span className="text-slate-500 text-sm">
                      Live Preview Area
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
