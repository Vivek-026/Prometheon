import type { UserSummary } from './tasks';

export interface FrozenTask {
  id: string;
  name: string;
  assignees: UserSummary[];
  original_deadline: string;
  current_deadline: string;
  carry_forward_count: number;
  days_overdue: number;
  carry_forward_log: {
    date: string;
    reason: string;
    previous_deadline: string;
    new_deadline: string;
  }[];
}

export interface UnresolvedFlag {
  id: string;
  task_id: string;
  task_name: string;
  raised_by: UserSummary;
  raised_at: string;
  reason_category: string;
  reason_text: string;
  manager_responsible?: UserSummary;
  unmasked_duration_hours: number; // Duration without manager action
  status: 'pending' | 'expired' | 'resolved';
}

export interface FlagFrequencyPattern {
  user: UserSummary;
  flag_rate_30d: number;
  total_assigned_30d: number;
  total_flagged_30d: number;
}

export interface EscalationSummary {
  total_frozen: number;
  total_unresolved_flags: number;
  total_pattern_alerts: number;
}
