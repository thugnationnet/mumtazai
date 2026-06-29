'use client';

import UniversalAgentChat from '../../../components/UniversalAgentChat';
import { AgentSubscriptionGuard } from '../../../components/AgentSubscriptionGuard';
import { getAgentConfig } from '../agent-registry';

const agentConfig = getAgentConfig('travel-buddy')!;

export default function AgentPage() {
  return (
    <AgentSubscriptionGuard agentId="travel-buddy" agentName={agentConfig.name}>
      <UniversalAgentChat agent={agentConfig} />
    </AgentSubscriptionGuard>
  );
}
