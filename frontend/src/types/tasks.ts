export type TaskStatus = 'pending' | 'in_progress' | 'in_review' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignee_id: string
  deadline: string
  carry_forward_count: number
  flagged?: boolean
  unresolved_flag_count?: number
}

export type FlagStatus = 'pending_review' | 'resolved'

export interface Flag {
  id: string
  task_id: string
  task_title: string
  reporter_id: string
  reporter_name: string
  status: FlagStatus
  message: string
  created_at: string
}

export interface TaskSummary {
  activeCount: number
  inReviewCount: number
  overdueCount: number
  totalCount: number
}
