import type { Metadata } from 'next';

const titleMap: Record<string, string> = {
  '401': 'Authentication Required',
  '403': 'Access Denied',
  '408': 'Request Timeout',
  '423': 'Account Locked',
  '429': 'Too Many Requests',
  '500': 'Server Error',
  '502': 'Bad Gateway',
  '503': 'Service Unavailable',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const title = titleMap[code] || `Error ${code}`;
  return {
    title: `${title} | Mumtaz AI`,
    description: `Error ${code} - ${title}`,
    robots: { index: false, follow: false },
  };
}

export default function ErrorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
