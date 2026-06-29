'use client';

import UniversalAgentChat from '../../../components/UniversalAgentChat';
import { AgentSubscriptionGuard } from '../../../components/AgentSubscriptionGuard';
import { getAgentConfig } from '../agent-registry';

const agentConfig = getAgentConfig('ben-sega')!;

export default function AgentPage() {
  return (
    <AgentSubscriptionGuard agentId="ben-sega" agentName={agentConfig.name}>
      <UniversalAgentChat agent={agentConfig} />
    </AgentSubscriptionGuard>
  );
}
