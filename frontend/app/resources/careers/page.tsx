'use client'

import Link from 'next/link'
import { Briefcase, Users, Code, TrendingUp, MapPin, Clock } from 'lucide-react'

interface JobListing {
  id: string
  title: string
  department: string
  location: string
  type: 'Full-time' | 'Part-time' | 'Contract'
  experience: string
  salary: string
  description: string
  requirements: string[]
  benefits: string[]
  icon: React.ReactNode
}

export default function CareersPage() {
  const jobListings: JobListing[] = [
    {
      id: 'sales-executive',
      title: 'Sales Executive',
      department: 'Business Development',
      location: 'Remote / Hybrid',
      type: 'Full-time',
      experience: '3+ years',
      salary: '$60,000 - $90,000',
      description: 'Join our growing sales team and help drive Mumtaz AI adoption across enterprises. You\'ll manage client relationships, identify opportunities, and close deals with mid-market and enterprise clients.',
      requirements: [
        'Proven sales track record in B2B SaaS',
        'Strong communication and negotiation skills',
        'Experience with CRM systems (Salesforce preferred)',
        'Ability to understand technical concepts',
        'Self-motivated and goal-oriented',
        'Bachelor\'s degree in Business or related field'
      ],
      benefits: [
        'Competitive base salary + commission',
        'Health, dental, and vision insurance',
        'Professional development budget',
        '401(k) matching',
        'Flexible work arrangements',
        'Annual performance bonus'
      ],
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      id: 'sales-manager',
      title: 'Sales Manager',
      department: 'Business Development',
      location: 'Remote / Hybrid',
      type: 'Full-time',
      experience: '5+ years',
      salary: '$90,000 - $130,000',
      description: 'Lead and mentor our sales team to achieve aggressive growth targets. You\'ll develop sales strategies, manage team performance, and build relationships with key accounts.',
      requirements: [
        'Proven sales leadership experience',
        'Track record of building and scaling high-performing teams',
        'Experience in SaaS or technology sales',
        'Strategic planning and forecasting skills',
        'Strong analytical and reporting capabilities',
        'MBA or equivalent experience preferred'
      ],
      benefits: [
        'Competitive base salary + performance bonus',
        'Comprehensive health benefits',
        'Stock options for senior roles',
        '401(k) matching',
        'Executive coaching and development',
        'Generous time-off policy'
      ],
      icon: <Briefcase className="w-6 h-6" />
    },
    {
      id: 'fullstack-developer',
      title: 'Full Stack Developer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      experience: '2+ years',
      salary: '$70,000 - $110,000',
      description: 'Build and scale Mumtaz AI with modern technologies. You\'ll work on both frontend and backend, contributing to our Next.js and Node.js stack while collaborating with a talented engineering team.',
      requirements: [
        'Strong JavaScript/TypeScript skills',
        'Experience with React and Next.js',
        'Node.js and backend development experience',
        'Proficiency with PostgreSQL and Prisma ORM',
        'Git and version control',
        'Understanding of REST APIs and GraphQL'
      ],
      benefits: [
        'Competitive salary',
        'Comprehensive health coverage',
        'Professional development budget',
        '401(k) matching',
        'Work from anywhere',
        'Collaborative and innovative team environment'
      ],
      icon: <Code className="w-6 h-6" />
    },
    {
      id: 'senior-developer',
      title: 'Senior Full Stack Developer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      experience: '5+ years',
      salary: '$110,000 - $160,000',
      description: 'Lead technical initiatives and mentor junior developers. You\'ll architect scalable solutions, review code, and drive best practices across our engineering team.',
      requirements: [
        'Expert-level JavaScript/TypeScript proficiency',
        'Deep experience with React, Next.js, and modern web technologies',
        'Strong backend architecture skills',
        'Experience with microservices and cloud platforms',
        'Leadership and mentoring experience',
        'System design and scalability expertise'
      ],
      benefits: [
        'Competitive salary with performance bonus',
        'Stock options',
        'Comprehensive health benefits',
        'Unlimited professional development',
        '401(k) matching',
        'Leadership opportunities'
      ],
      icon: <Code className="w-6 h-6" />
    },
    {
      id: 'ai-ml-engineer',
      title: 'AI/ML Engineer',
      department: 'AI Research & Development',
      location: 'Remote / Hybrid',
      type: 'Full-time',
      experience: '3+ years',
      salary: '$80,000 - $130,000',
      description: 'Develop and optimize AI models for Mumtaz AI. You\'ll work on LLM integration, model fine-tuning, and building intelligent features that power our agents.',
      requirements: [
        'Strong Python programming skills',
        'Experience with machine learning frameworks (PyTorch, TensorFlow)',
        'LLM and transformer architecture knowledge',
        'Data preprocessing and feature engineering expertise',
        'Familiarity with cloud ML platforms',
        'Published papers or portfolio projects preferred'
      ],
      benefits: [
        'Competitive salary',
        'GPU compute resources for research',
        'Conference attendance budget',
        'Publication support',
        'Collaborative research environment',
        'Flexible work arrangements'
      ],
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      id: 'product-manager',
      title: 'Product Manager',
      department: 'Product',
      location: 'Remote / Hybrid',
      type: 'Full-time',
      experience: '4+ years',
      salary: '$85,000 - $125,000',
      description: 'Shape the future of Mumtaz AI by defining product strategy and roadmap. You\'ll work with engineering, design, and stakeholders to build features users love.',
      requirements: [
        'Proven product management experience in SaaS',
        'Strong data analysis and metrics literacy',
        'Experience with agile development practices',
        'User research and user interview skills',
        'Strategic thinking and roadmap planning',
        'Technical literacy (no coding required)'
      ],
      benefits: [
        'Competitive salary',
        'Performance-based bonus',
        'Professional development budget',
        '401(k) matching',
        'Flexible work environment',
        'Opportunity to shape product strategy'
      ],
      icon: <Briefcase className="w-6 h-6" />
    },
    {
      id: 'marketing-specialist',
      title: 'Marketing Specialist',
      department: 'Marketing',
      location: 'Remote',
      type: 'Full-time',
      experience: '2+ years',
      salary: '$55,000 - $85,000',
      description: 'Drive awareness and engagement for Mumtaz AI. You\'ll create compelling content, manage campaigns, and help build our brand in the AI ecosystem.',
      requirements: [
        'Experience with digital marketing',
        'Strong writing and content creation skills',
        'Social media management experience',
        'Basic knowledge of marketing analytics',
        'Experience with marketing automation tools',
        'Creative and strategic thinking'
      ],
      benefits: [
        'Competitive salary',
        'Marketing budget for experiments',
        'Professional development',
        'Flexible hours',
        'Collaborative marketing team',
        'Growth opportunities'
      ],
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      id: 'customer-success',
      title: 'Customer Success Manager',
      department: 'Support & Success',
      location: 'Remote / Hybrid',
      type: 'Full-time',
      experience: '2+ years',
      salary: '$50,000 - $80,000',
      description: 'Be the trusted advisor for our customers. You\'ll help ensure they achieve their goals with Mumtaz AI and identify upsell opportunities.',
      requirements: [
        'Customer success or account management experience',
        'Strong communication and interpersonal skills',
        'Problem-solving mindset',
        'CRM platform experience (Salesforce, HubSpot)',
        'Ability to work with technical stakeholders',
        'Proactive and customer-focused'
      ],
      benefits: [
        'Competitive base salary + bonus',
        'Health, dental, and vision coverage',
        'Professional development',
        '401(k) matching',
        'Remote work flexibility',
        'Team building events'
      ],
      icon: <Users className="w-6 h-6" />
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-white/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-purple-100/20 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" style={{ transform: 'skewY(-2deg)' }} />
        <div className="container-custom text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Join Our Team</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            We're building the future of AI agents. Come help us create technology that changes the world.
          </p>
        </div>
      </section>

      {/* Culture Section */}
      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-center mb-8 text-slate-700">Why Work With Us?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-white/60 shadow-lg hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700">Collaborative Culture</h3>
                </div>
                <p className="text-slate-500">
                  Work with a talented team that values innovation, transparency, and mutual support.
                </p>
              </div>

              <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-white/60 shadow-lg hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700">Growth Opportunities</h3>
                </div>
                <p className="text-slate-500">
                  Fast-growing company with clear career paths and continuous learning opportunities.
                </p>
              </div>

              <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-white/60 shadow-lg hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700">Flexible Work</h3>
                </div>
                <p className="text-slate-500">
                  Remote and hybrid options with flexible schedules to support work-life balance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="section-padding">
        <div className="container-custom max-w-5xl">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-700">Open Positions</h2>
          <div className="space-y-6">
            {jobListings.map((job) => (
              <div
                key={job.id}
                className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-white/60 shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className="flex items-start justify-between gap-6 mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-purple-700">
                        {job.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-slate-700">{job.title}</h3>
                    </div>
                    <p className="text-slate-500 font-semibold mb-3">{job.department}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-purple-700" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-purple-700" />
                        {job.type}
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4 text-purple-700" />
                        {job.experience}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/resources/apply-job?position=${encodeURIComponent(job.title)}&id=${job.id}`}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all transform hover:scale-105 whitespace-nowrap shadow-lg shadow-purple-500/25"
                  >
                    Apply Now
                  </Link>
                </div>

                <p className="text-slate-600 mb-6 leading-relaxed">{job.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 pb-6 border-b border-white/80">
                  <div>
                    <h4 className="font-bold text-slate-700 mb-3">Requirements</h4>
                    <ul className="space-y-2">
                      {job.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-600">
                          <span className="text-purple-700 font-bold mt-0.5">▸</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 mb-3">Benefits</h4>
                    <ul className="space-y-2">
                      {job.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-600">
                          <span className="text-green-600 font-bold mt-0.5">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/resources/apply-job?position=${encodeURIComponent(job.title)}&id=${job.id}`}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all text-center shadow-lg shadow-purple-500/25"
                  >
                    Apply Now
                  </Link>
                  <button className="px-6 py-3 border-2 border-white/60 text-slate-700 font-bold rounded-xl hover:border-purple-600 hover:text-purple-700 transition-all">
                    Save Job
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-14 md:py-20 overflow-hidden themed-section-bg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-200/20 rounded-full blur-2xl" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
        <div className="container-custom max-w-2xl text-center relative z-10">
          <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Don't see your role?</h2>
          <p className="text-lg text-slate-600 mb-8">
            We're always looking for talented people. Send us your resume and let's talk!
          </p>
          <Link
            href="/support/contact-us"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25"
          >
            Get In Touch
          </Link>
        </div>
      </section>
    </div>
  )
}
