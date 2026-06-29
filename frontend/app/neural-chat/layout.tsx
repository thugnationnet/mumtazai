import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Neural Chat | Mumtaz AI',
  description: 'Neural Link Interface — Multi-provider AI chat with Canvas workspace',
};

export default function NeuralChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden">
      {children}
    </div>
  );
}
