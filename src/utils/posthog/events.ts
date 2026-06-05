// Centralized event names for GoalSlot application
// Naming convention: <area>_<verb_past_tense>, snake_case
// No PII — no note bodies, goal titles, journal content, or userIds as properties
// PostHog already attaches distinct_id automatically

export const Events = {
  // auth
  AUTH_SIGNUP_STARTED: 'auth_signup_started',
  AUTH_SIGNUP_COMPLETED: 'auth_signup_completed',
  AUTH_LOGIN_SUCCEEDED: 'auth_login_succeeded',
  AUTH_LOGOUT: 'auth_logout',

  // goals
  GOAL_CREATED: 'goal_created',
  GOAL_COMPLETED: 'goal_completed',
  GOAL_ARCHIVED: 'goal_archived',

  // tasks
  TASK_CREATED: 'task_created',
  TASK_COMPLETED: 'task_completed',

  // schedule
  SCHEDULE_BLOCK_CREATED: 'schedule_block_created',

  // time tracking
  TRACK_STARTED: 'track_started',
  TRACK_STOPPED: 'track_stopped',

  // notes
  NOTE_CREATED: 'note_created',
  NOTE_EXPORTED_MARKDOWN: 'note_exported_markdown',

  // journal
  JOURNAL_ENTRY_SAVED: 'journal_entry_saved',

  // integrations
  INTEGRATION_CONNECTED: 'integration_connected',
  INTEGRATION_DISCONNECTED: 'integration_disconnected',

  // coach
  COACH_MESSAGE_SENT: 'coach_message_sent',
  COACH_INSIGHT_ACCEPTED: 'coach_insight_accepted',
} as const

export type EventName = (typeof Events)[keyof typeof Events]

// Per-event typed properties — TypeScript enforces correct props at call sites
export type EventProperties = {
  [Events.GOAL_CREATED]: { category?: string; hasDeadline: boolean }
  [Events.GOAL_COMPLETED]: { ageDays: number }
  [Events.TASK_COMPLETED]: { source: 'list' | 'schedule' | 'coach' }
  [Events.TRACK_STARTED]: { source: 'task' | 'goal' | 'adhoc' }
  [Events.TRACK_STOPPED]: { durationSeconds: number }
  [Events.NOTE_EXPORTED_MARKDOWN]: { sizeKb: number }
  [Events.INTEGRATION_CONNECTED]: { provider: 'google_calendar' | 'notion' | string }
  [Events.INTEGRATION_DISCONNECTED]: { provider: 'google_calendar' | 'notion' | string }
  [Events.SCHEDULE_BLOCK_CREATED]: { hasGoalLinked: boolean }
}
