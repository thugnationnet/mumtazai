'use client';

import { notFound } from 'next/navigation';
import UniversalAgentChat from '../../../components/UniversalAgentChat';
import { AgentSubscriptionGuard } from '../../../components/AgentSubscriptionGuard';
import { getAgentConfig } from '../agent-registry';

export default function AgentPage({ params }: { params: { slug: string } }) {
  const agentConfig = getAgentConfig(params.slug);
  if (!agentConfig) notFound();

  return (
    <AgentSubscriptionGuard agentId={params.slug} agentName={agentConfig.name}>
      <UniversalAgentChat agent={agentConfig} />
    </AgentSubscriptionGuard>
  );
}
