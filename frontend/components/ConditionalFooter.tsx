'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on specific pages
  const isAgentPage = pathname?.startsWith('/agents/');
  const isStudioPage = pathname === '/ai-studio-demo';
  const isAuthPage = pathname?.startsWith('/auth/');
  const isDashboardPage = pathname?.startsWith('/dashboard');
  const isLiveSupportPage = pathname === '/support/live-support';
  const isLabPage = pathname?.startsWith('/lab');
  const isToolsPage = pathname?.startsWith('/tools');
  const isCanvasAppPage = pathname === '/canvas-studio';
  const isBlogPage = pathname === '/resources/blog';
  const isRootChatPage = pathname === '/';

  // Don't render footer on these pages
  if (
    isRootChatPage ||
    isAgentPage ||
    isStudioPage ||
    isAuthPage ||
    isDashboardPage ||
    isLiveSupportPage ||
    isLabPage ||
    isToolsPage ||
    isCanvasAppPage ||
    isBlogPage
  ) {
    return null;
  }

  return <Footer />;
}
