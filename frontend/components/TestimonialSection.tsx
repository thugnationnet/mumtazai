'use client'

import { motion } from 'framer-motion'

interface Testimonial {
  quote: string
  author: string
  role: string
  company: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    quote: "This platform completely transformed how we handle customer support. Our response times dropped by 70%.",
    author: "Sarah Johnson",
    role: "CEO",
    company: "Tech Innovations Inc",
    rating: 5
  },
  {
    quote: "The AI agents are incredibly smart and customizable. We integrated them in less than a day.",
    author: "Michael Chen",
    role: "CTO",
    company: "Digital Solutions Ltd",
    rating: 5
  },
  {
    quote: "Best investment we made this year. The ROI has been phenomenal and our team loves using it.",
    author: "Emily Rodriguez",
    role: "Director of Operations",
    company: "Growth Co",
    rating: 5
  }
]

export default function TestimonialSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    hover: {
      y: -8,
      transition: { duration: 0.3 }
    }
  }

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Enhanced Background with multiple layers */}
      <div className="absolute inset-0 neu-page-bg -z-10" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-100 via-blue-200 to-cyan-200 bg-clip-text text-transparent mb-4">
            Trusted by Industry Leaders
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            See what our users have to say about transforming their workflows
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover="hover"
              className="group relative"
            >
              {/* Card Background with gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-1" />
              
              {/* Main Card */}
              <div className="glass-card rounded-2xl p-8 border border-slate-300 hover:border-blue-300 transition-all duration-300 h-full">
                
                {/* Star Rating */}
                <div className="flex gap-2 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      viewport={{ once: true }}
                      className="text-xl"
                    >
                      ⭐
                    </motion.span>
                  ))}
                </div>

                {/* Quote Text */}
                <blockquote className="text-slate-700 mb-8 text-lg leading-relaxed italic">
                  <span className="text-blue-400 font-bold text-2xl mr-2">"</span>
                  {testimonial.quote}
                  <span className="text-blue-400 font-bold text-2xl ml-2">"</span>
                </blockquote>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-6" />

                {/* Author Info */}
                <div>
                  <p className="font-bold text-slate-100 text-lg">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-slate-600">
                    {testimonial.role}, <span className="text-blue-400">{testimonial.company}</span>
                  </p>
                </div>

                {/* Corner Accent */}
                <div className="absolute top-4 right-4 text-4xl opacity-10 group-hover:opacity-30 transition-opacity">
                  💭
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <p className="text-slate-600 mb-6">
            Join 10,000+ companies transforming their business with Mumtaz AI
          </p>
          <button className="relative inline-block group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
            <a
              href="/community"
              className="relative px-8 py-3 bg-slate-900 rounded-lg leading-none flex items-center divide-x divide-slate-600 hover:divide-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/30"
            >
              <span className="text-slate-700 group-hover:text-blue-600 pr-4">Join Community</span>
              <span className="pl-4 text-slate-500 group-hover:text-blue-600">→</span>
            </a>
          </button>
        </motion.div>
      </div>
    </section>
  )
}
