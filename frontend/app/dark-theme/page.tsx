import Link from 'next/link';
import { 
  SparklesIcon, 
  MoonIcon, 
  CpuChipIcon,
  BeakerIcon,
  LightBulbIcon,
  PaintBrushIcon,
  EyeIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function DarkThemeShowcase() {
  const features = [
    {
      icon: MoonIcon,
      title: "Rich Dark Gradients",
      description: "Deep charcoal base blending into slate gray and muted teal for luxurious backgrounds"
    },
    {
      icon: SparklesIcon,
      title: "Multi-Color Animations",
      description: "Buttons with dark blue, deep purple, and emerald accents that glow on hover"
    },
    {
      icon: PaintBrushIcon,
      title: "Luxurious Shadows",
      description: "Rich indigo and plum shadows that add depth and sophistication"
    },
    {
      icon: EyeIcon,
      title: "Perfect Contrast",
      description: "Carefully balanced text colors for optimal readability in dark mode"
    }
  ];

  const stats = [
    { label: "Color Variations", value: "12+", icon: PaintBrushIcon },
    { label: "Shadow Styles", value: "8", icon: SparklesIcon },
    { label: "Animation States", value: "6", icon: LightBulbIcon },
    { label: "Gradient Types", value: "4", icon: StarIcon }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Dark Gradient */}
      <section className="hero-container section-padding-lg themed-section-bg">
        <div className="container-custom text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="mb-6">
              Beautiful Dark Theme
            </h1>
            <p className="text-subtitle mb-8">
              Experience our rich, multi-tonal dark theme with luxurious gradients, 
              deep shadows, and smooth animations that create an immersive user experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary interactive-glow">
                Explore Dark Mode
              </button>
              <button className="btn-secondary">
                View Light Mode
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding neu-page-bg">
        <div className="container-custom">
          <div className="grid-4-col">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="stats-card text-center group hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-neutral-900 mb-2">{stat.value}</div>
                  <div className="text-sm font-medium text-neutral-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-padding feature-section">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="mb-4">Dark Theme Features</h2>
            <p className="text-subtitle">
              Every element is carefully crafted with rich colors and smooth transitions
            </p>
          </div>
          
          <div className="grid-2-col gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="card card-padding group interactive-glow">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-slate-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="section-padding neu-page-bg">
        <div className="container-custom">
          <div className="card card-padding text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <CpuChipIcon className="w-16 h-16 mx-auto mb-4 text-blue-600" />
              <h2 className="mb-4">Interactive Elements</h2>
              <p className="text-subtitle">
                Hover over these elements to see the dark theme animations in action
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <button className="btn-primary dark-pulse">
                Multi-Color Button
              </button>
              <button className="btn-secondary">
                Elegant Secondary
              </button>
              <button className="btn-ghost">
                Subtle Ghost
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="agent-card p-6 text-center">
                <BeakerIcon className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                <h4 className="font-semibold mb-2">Rich Shadows</h4>
                <p className="text-sm text-slate-500">Deep indigo and plum shadows</p>
              </div>
              <div className="agent-card p-6 text-center">
                <LightBulbIcon className="w-8 h-8 mx-auto mb-3 text-indigo-600" />
                <h4 className="font-semibold mb-2">Smooth Transitions</h4>
                <p className="text-sm text-slate-500">Fluid animations and effects</p>
              </div>
              <div className="agent-card p-6 text-center">
                <StarIcon className="w-8 h-8 mx-auto mb-3 text-blue-700" />
                <h4 className="font-semibold mb-2">Perfect Contrast</h4>
                <p className="text-sm text-slate-500">Optimized text readability</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding-lg neu-hero">
        <div className="container-custom text-center">
          <h2 className="text-white mb-4">Ready to Experience Dark Mode?</h2>
          <p className="text-xl mb-8 text-slate-500">
            Toggle the theme switch in the navigation to see the transformation
          </p>
          <Link href="https://mumtaz.ai/agents" className="btn-secondary !bg-white !text-blue-600 hover:!bg-blue-50">
            Explore AI Agents
          </Link>
        </div>
      </section>
    </div>
  );
}