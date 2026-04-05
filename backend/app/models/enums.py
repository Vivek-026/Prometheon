import enum


# ── User Enums ──

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TASK_MANAGER = "task_manager"
    CODER = "coder"


class UserStatus(str, enum.Enum):
    ONLINE = "online"
    IDLE = "idle"
    OFFLINE = "offline"
    DND = "dnd"


# ── Task Enums ──

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    COMPLETED = "completed"
    FLAGGED = "flagged"
    REASSIGNED = "reassigned"


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


# ── Document Enums ──

class DocumentCategory(str, enum.Enum):
    PRODUCT = "product"
    PROCESS = "process"
    MEETINGS = "meetings"
    FINANCE = "finance"
    RESEARCH = "research"
    LEGAL_HR = "legal_hr"
    TASK_UPLOADS = "task_uploads"


class TaskDocLinkType(str, enum.Enum):
    BRIEF = "brief"
    PROGRESS = "progress"
    REFERENCE = "reference"


# ── Flag Enums ──

class FlagReasonCategory(str, enum.Enum):
    ACADEMIC = "academic"
    PERSONAL = "personal"
    WORKLOAD = "workload"
    TECHNICAL = "technical"
    OTHER = "other"


class FlagProgressStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    PCT_25 = "pct_25"
    PCT_50 = "pct_50"
    PCT_75 = "pct_75"


class FlagStatus(str, enum.Enum):
    PENDING_REVIEW = "pending_review"
    RESOLVED_REASSIGNED = "resolved_reassigned"
    RESOLVED_EXTENDED = "resolved_extended"
    RESOLVED_RESCOPED = "resolved_rescoped"
    EXPIRED = "expired"


# ── Chat Enums ──

class MessageType(str, enum.Enum):
    TEXT = "text"
    FILE = "file"
    CODE = "code"
    IMAGE = "image"
    LINK = "link"


class NotificationPref(str, enum.Enum):
    ALL = "all"
    MENTIONS = "mentions"
    MUTE = "mute"


# ── Notification Enums ──

class NotificationType(str, enum.Enum):
    TASK_ASSIGNED = "task_assigned"
    STATUS_CHANGE = "status_change"
    CARRY_FORWARD = "carry_forward"
    FLAG_RAISED = "flag_raised"
    FLAG_RESOLVED = "flag_resolved"
    CHAT_MENTION = "chat_mention"
    CHAT_MESSAGE = "chat_message"
    DEADLINE_WARNING = "deadline_warning"


# ── Progress Entry Enums ──

class ProgressEntryType(str, enum.Enum):
    SCREENSHOT = "screenshot"
    DOCUMENT = "document"
    LINK = "link"
    TEXT_NOTE = "text_note"
    VOICE_NOTE = "voice_note"
    CODE_SNIPPET = "code_snippet"
    DOC_HUB_LINK = "doc_hub_link"
