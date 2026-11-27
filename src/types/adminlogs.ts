// what a user did, or an admin did to their account, for the admins; user_id null once the user is deleted
export interface UserEvent {
  id: number
  created_at: string
  user_id: number | null
  username: string
  kind: string
  detail: string
  ip: string
}

export interface UserEventPage {
  events: UserEvent[]
  kinds: string[]
  retention_days: number
}

// a notification of a user, for the admins: never its message
export interface NotificationLog {
  id: number
  created_at: string // queued
  sent_at: string | null
  sent: boolean
  kind: string // '' for the ones queued before the kinds were recorded
  provider: string // browser (push) or email
  user_id: number
  username: string
}

export interface NotificationLogPage {
  notifications: NotificationLog[]
  kinds: string[]
}

// the filter of a log: of a user, of a kind, the page after an id
export interface LogQuery {
  user_id?: number
  kind?: string
  before?: number
  limit?: number
}
