import { redirect } from 'next/navigation';

export const metadata = {
  title: 'AI Studio Demo — Mumtaz AI',
  description: 'Try the AI Studio demo — chat with multiple AI providers for free.',
};

export default function DemoStudioPage() {
  redirect('https://demo.mumtaz.ai');
}
