/**
 * Canvas Studio Plan Status Bar
 * Shows current plan status: active plan type, time remaining, etc.
 */

import React from 'react';
import { Crown, Clock, Infinity, AlertTriangle } from 'lucide-react';

export interface PlanInfo {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime';
  price: number;
  startDate: string;
  expiryDate: string | null;
  isLifetime: boolean;
  daysRemaining: number | null;
  hoursRemaining: number | null;
}

interface PlanStatusBarProps {
  plan: PlanInfo;
}

const PlanStatusBar: React.FC<PlanStatusBarProps> = ({ plan }) => {
  const isExpiringSoon = plan.daysRemaining !== null && plan.daysRemaining <= 1;

  if (plan.isLifetime) {
    return (
      <div className="flex items-center gap-1.5">
        <Crown className="w-3 h-3 text-amber-400" />
        <span className="text-amber-300 text-[10px] font-medium">Yearly Plan</span>
        <span className="text-slate-900 dark:text-white/20 text-[10px]">•</span>
        <Clock className="w-2.5 h-2.5 text-slate-900 dark:text-white/40" />
        <span className="text-slate-900 dark:text-white/40 text-[10px]">{plan.daysRemaining}d left</span>
      </div>
    );
  }

  if (isExpiringSoon) {
    const hrs = plan.hoursRemaining || 0;
    return (
      <div className="flex items-center gap-1.5">
        <AlertTriangle className="w-3 h-3 text-red-400" />
        <span className="text-red-300 text-[10px] font-medium">
          {hrs > 0 ? `${hrs}h remaining` : 'Expiring soon'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Crown className="w-3 h-3 text-violet-400" />
      <span className="text-violet-300 text-[10px] font-medium">
        {plan.type.charAt(0).toUpperCase() + plan.type.slice(1)} Plan
      </span>
      <span className="text-slate-900 dark:text-white/20 text-[10px]">•</span>
      <Clock className="w-2.5 h-2.5 text-slate-900 dark:text-white/40" />
      <span className="text-slate-900 dark:text-white/40 text-[10px]">
        {plan.daysRemaining}d left
      </span>
    </div>
  );
};

export default PlanStatusBar;
