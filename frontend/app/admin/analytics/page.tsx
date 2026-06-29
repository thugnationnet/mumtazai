'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * /admin/analytics → redirects to /admin/dashboard
 * This page previously had zero auth protection.
 * All analytics data is available in the dashboard pages.
 */
export default function AdminAnalyticsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center themed-section-bg">
      <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
