'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Stat {
  number: string
  label: string
  icon: string
  color: string
}

interface CommunityStatsProps {
  stats?: Stat[]
}

const defaultStats: Stat[] = [
  { number: "10K+", label: "Active Members", icon: "👥", color: "from-blue-500 to-cyan-500" },
  { number: "5K+", label: "GitHub Stars", icon: "⭐", color: "from-purple-500 to-pink-500" },
  { number: "500+", label: "Contributions", icon: "🤝", color: "from-green-500 to-emerald-500" }
]

export default function CommunityStats({ stats = defaultStats }: CommunityStatsProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [counts, setCounts] = useState<Record<number, number>>({})

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Counter animation effect
  useEffect(() => {
    if (!isVisible) return

    stats.forEach((stat, index) => {
      const finalNumber = parseInt(stat.number.replace(/\D/g, ''))
      const duration = 2000
      const steps = 60
      const stepValue = finalNumber / steps

      let currentStep = 0
      const interval = setInterval(() => {
        if (currentStep <= steps) {
          setCounts(prev => ({
            ...prev,
            [index]: Math.floor(stepValue * currentStep)
          }))
          currentStep++
        } else {
          clearInterval(interval)
        }
      }, duration / steps)

      return () => clearInterval(interval)
    })
  }, [isVisible, stats])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    hover: {
      y: -12,
      scale: 1.05,
      transition: { duration: 0.3 }
    }
  }

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 neu-page-bg -z-10" />

      {/* Animated background elements */}
      <div className="absolute inset-0 -z-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
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
            Community Stats
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Join thousands of developers, researchers, and AI enthusiasts
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover="hover"
              className="group relative"
            >
              {/* Gradient background glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity duration-300 -z-1`} />

              {/* Main Card */}
              <div className={`glass-card rounded-2xl p-8 border border-slate-300 group-hover:border-blue-300 transition-all duration-300 h-full`}>
                
                {/* Icon */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  viewport={{ once: true }}
                  className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300"
                >
                  {stat.icon}
                </motion.div>

                {/* Number with counter animation */}
                <div className="mb-3">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    viewport={{ once: true }}
                    className={`text-5xl md:text-6xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                  >
                    {counts[index] || 0}
                    <span className="text-3xl">+</span>
                  </motion.div>
                </div>

                {/* Label */}
                <p className="text-slate-600 font-medium text-lg">
                  {stat.label}
                </p>

                {/* Decorative line */}
                <div className={`h-1 bg-gradient-to-r ${stat.color} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-6`} />

                {/* Corner accent */}
                <div className={`absolute top-4 right-4 w-2 h-2 rounded-full bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mt-16"
        />
      </div>
    </section>
  )
}
