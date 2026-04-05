export type TaskStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'in_review' 
  | 'completed' 
  | 'flagged' 
  | 'reassigned'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface UserSummary {
  id: string
  name: string
  avatar_url?: string
}

export interface TaskAssignee extends UserSummary {
  role: string
  contribution_pct?: number
}

export interface HubDocument {
  id: string
  auto_name: string
  original_filename: string
  category: 'product' | 'process' | 'meetings' | 'finance' | 'research' | 'legal_hr' | 'task_uploads'
  tags: string[]
  upload_origin: 'direct_upload' | 'task_brief' | 'progress_file' | 'chat_attachment'
  uploaded_by: UserSummary
  mime_type: string
  file_size_bytes: number
  version_number: number
  is_current_version: boolean
  s3_presigned_url?: string
  created_at: string
}

export interface DocumentSummary {
  id: string
  auto_name: string
  s3_presigned_url?: string
  mime_type: string
  link_type?: string
}

export interface ProgressEntry {
  id: string
  entry_type: 'screenshot' | 'document' | 'link' | 'text_note' | 'code_snippet' | 'doc_hub_link'
  content?: string
  document?: DocumentSummary | null
  note?: string
  uploaded_by: UserSummary
  created_at: string
}

export interface CarryForwardLog {
  id: string
  carry_number: number
  from_deadline: string
  to_deadline: string
  reason: string
  created_at: string
}

export interface Task {
  id: string
  name: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  tags: string[]
  created_by: UserSummary | string // Supports both simple and complex objects
  original_deadline: string
  current_deadline: string
  carry_forward_count: number
  flag_count: number
  is_frozen: boolean
  completed_at?: string
  created_at: string
  updated_at: string
  assignees: TaskAssignee[]
  task_brief?: DocumentSummary | null
  progress_entries?: ProgressEntry[]
  carry_forward_logs?: CarryForwardLog[]
  linked_documents?: DocumentSummary[]
}

export interface TaskSummary {
  activeCount: number
  inReviewCount: number
  overdueCount: number
  totalCount: number
}

// --- NEW FLAG TYPES ---
export type FlagReasonCategory = 'academic' | 'personal' | 'workload' | 'technical' | 'other';
export type FlagProgressStatus = 'not_started' | 'pct_25' | 'pct_50' | 'pct_75';
export type FlagStatus = 'pending_review' | 'resolved' | 'expired';

export interface TaskFlag {
  id: string;
  task: {
    id: string;
    name: string;
    current_deadline: string;
  };
  flagged_by: UserSummary;
  reason_category: FlagReasonCategory;
  reason_text: string;
  progress_status: FlagProgressStatus;
  handoff_notes?: string;
  is_late_flag: boolean;
  flag_number: number;
  status: FlagStatus;
  created_at: string;
  estimated_hours_remaining?: number;
  task_assignees?: UserSummary[];
}

export type TeamBand = 'HIGH' | 'MEDIUM' | 'LOW' | 'BLOCKED';

export interface TeamMemberAvailability {
  user: UserSummary;
  band: TeamBand;
  updated_at: string;
}

// --- NEW AVAILABILITY TYPES ---
export interface BlockedSlot {
  id?: string;
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  reason_category: 'college' | 'exam' | 'personal' | 'work' | 'other';
  reason_text: string;
}

export interface DaySlot {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  blocked_slots: BlockedSlot[];
  available_hours: number;
  band: TeamBand;
}

export interface UserAvailability {
  user_id: string;
  base_unavailable_hours: number;
  weekly_slots: DaySlot[];
  updated_at: string;
}

