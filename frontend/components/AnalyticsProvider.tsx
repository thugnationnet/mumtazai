'use client'
import { createContext, useContext, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView } from '@/lib/analytics'

const AnalyticsContext = createContext({})

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname && typeof document !== 'undefined') {
      trackPageView(pathname, document.title)
    }
  }, [pathname])

  return (
    <AnalyticsContext.Provider value={{}}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export const useAnalytics = () => useContext(AnalyticsContext)
