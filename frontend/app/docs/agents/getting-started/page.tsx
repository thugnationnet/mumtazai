import GettingStartedContent from './ClientContent'
import { headers as nextHeaders } from 'next/headers'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default function Page() {
  // Force dynamic rendering
  void nextHeaders()
  return <GettingStartedContent />
}
