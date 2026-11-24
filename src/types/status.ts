// the state of the instance, for the admins (the backend's status.Report)
export type CheckLevel = 'ok' | 'warning' | 'critical' | 'unknown'

export interface StatusCheck {
  name: string
  level: CheckLevel
  message: string
}

export interface StatusWindow {
  since: string
  requests: number
  errors: number
  reads_p95: number | null // seconds
  analyses: Record<string, number> // ok, error, busy
  logins: Record<string, number> // success, failure, locked
  emails_failed: number
  busy: number
  db_waits: number
}

export interface StatusPoint {
  time: string
  requests: number
  errors: number
  reads_p95: number | null
  memory: number
  cpu: number
  analyses: number
}

export interface StatusBackfill {
  step: string
  running: boolean
  remaining: number
  last_duration: number
  errors: number
}

export interface InstanceStatus {
  now: string
  version: string
  started_at: string
  schema: number
  users: number
  activities: number
  memory: { resident: number, limit: number }
  cpu: number
  goroutines: number
  database: { open: number, in_use: number, max: number }
  slots: Record<string, { in_use: number, capacity: number }>
  disk: { path: string, free: number, total: number } | null
  backups: { configured: boolean, readable: boolean, last_success: string | null, size: number }
  backfills: StatusBackfill[] | null
  weather: Record<string, number>
  last_hour: StatusWindow
  last_day: StatusWindow
  checks: StatusCheck[]
  history: StatusPoint[] | null
}
