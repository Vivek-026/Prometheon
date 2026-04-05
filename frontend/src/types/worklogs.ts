import type { Task } from './tasks';

export interface DailyWorklog {
  date: string;
  user: { name: string };
  sections: {
    overdue: Task[];
    due_today: Task[];
    in_progress: Task[];
    completed_today: Task[];
    carry_forwarded_today: Task[];
  };
}

export interface WeeklyWorklog {
  week_label: string;
  user: { name: string };
  summary: {
    tasks_assigned: number;
    completed_count: number;
    completed_pct: number;
    carry_forwarded_count: number;
    completed_early_count: number;
    avg_completion_hours: number;
  };
  days: {
    date: string;
    tasks: Task[];
  }[];
  carry_forward_tracker: {
    task_id: string;
    name: string;
    carry_count: number;
    current_status: string;
  }[];
}

export interface MonthlyWorklog {
  month_label: string;
  user: { name: string };
  stats: {
    total_tasks: number;
    completion_pct: number;
    carry_forward_count: number;
    on_time_rate: number;
    avg_days_to_complete: number;
    vs_previous_month: {
      completion_pct_delta: number;
      carry_forward_delta: number;
    };
  };
  by_tag: {
    tag: string;
    count: number;
    completed_count: number;
  }[];
  top_blockers: {
    reason: string;
    count: number;
  }[];
  per_person_summary?: {
    user: { id: string; name: string };
    total: number;
    completed: number;
    carry_forwards: number;
  }[];
}

export interface QuarterlyWorklog {
  quarter_label: string;
  completion_trend: {
    month: string;
    rate: number;
  }[];
  velocity_trend: {
    month: string;
    tasks_completed: number;
  }[];
  per_person: {
    user: { id: string; name: string };
    total: number;
    completed: number;
    carry_forwards: number;
  }[];
}

export interface EvidenceEvent {
  type: 'screenshot' | 'doc' | 'link' | 'text' | 'voice' | 'code';
  uploader: { name: string };
  timestamp: string;
  content_preview: string;
}
