'use client';

import UniversalAgentChat from '../../../components/UniversalAgentChat';
import { AgentSubscriptionGuard } from '../../../components/AgentSubscriptionGuard';
import { getAgentConfig } from '../agent-registry';

const agentConfig = getAgentConfig('chef-biew')!;

export default function AgentPage() {
  return (
    <AgentSubscriptionGuard agentId="chef-biew" agentName={agentConfig.name}>
      <UniversalAgentChat agent={agentConfig} />
    </AgentSubscriptionGuard>
  );
}
