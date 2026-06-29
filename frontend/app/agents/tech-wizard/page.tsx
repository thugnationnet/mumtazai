'use client';

import UniversalAgentChat from '../../../components/UniversalAgentChat';
import { AgentSubscriptionGuard } from '../../../components/AgentSubscriptionGuard';
import { getAgentConfig } from '../agent-registry';

const agentConfig = getAgentConfig('tech-wizard')!;

export default function AgentPage() {
  return (
    <AgentSubscriptionGuard agentId="tech-wizard" agentName={agentConfig.name}>
      <UniversalAgentChat agent={agentConfig} />
    </AgentSubscriptionGuard>
  );
}
