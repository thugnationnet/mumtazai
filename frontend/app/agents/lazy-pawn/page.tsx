'use client';

import UniversalAgentChat from '../../../components/UniversalAgentChat';
import { AgentSubscriptionGuard } from '../../../components/AgentSubscriptionGuard';
import { getAgentConfig } from '../agent-registry';

const agentConfig = getAgentConfig('lazy-pawn')!;

export default function AgentPage() {
  return (
    <AgentSubscriptionGuard agentId="lazy-pawn" agentName={agentConfig.name}>
      <UniversalAgentChat agent={agentConfig} />
    </AgentSubscriptionGuard>
  );
}
