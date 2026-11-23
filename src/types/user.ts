// the session of the cookie, as the backend describes it
export interface UserSession {
  sub: number, // the id of the user
  uuid: string,
  role: string,
  exp: number, // the expiry, in seconds since the epoch
  mfa?: boolean, // the login went through the two-factor authentication: the admin pages need it
  two_factor?: boolean, // the user has the two-factor authentication on
}

// the two-factor authentication of the user
export interface TwoFactorStatus {
  enabled: boolean
  enabled_at: string | null
  recovery_codes_left: number
  required: boolean // an admin must have it
  session_verified: boolean // this session went through it
}

// a new secret to scan in the authenticator app
export interface TwoFactorSetup {
  secret: string
  url: string // otpauth://
  qr_code: string // data:image/png;base64
}

// a user as the admins see them
export interface AdminUser {
  id: number
  username: string
  email: string
  role: 'Admin' | 'User'
  created_at: string
  disabled_at: string | null
  two_factor: boolean
  activities: number
  last_activity: string | null
  last_device_use: string | null
  disk_bytes: number
  // the storage quota an admin gave them, null for the one of the instance; quota: the one that applies.
  // Bytes, 0 for none
  quota_bytes: number | null
  quota: number
}

// who may create an account (REGISTRATION of the backend)
export type RegistrationMode = 'closed' | 'invite' | 'open'

// how to register on this instance, before any login
export interface InstanceInfo {
  registration: RegistrationMode,
  // the instance waits for its admin: registered with the setup code of the backend logs
  setup_required: boolean,
  // the instance sends emails (SMTP configured): forgotten passwords, confirmations, invitations
  email?: boolean,
}

// the email address of the user
export interface EmailStatus {
  email: string
  verified_at: string | null
  pending: string // the address they change to, not confirmed yet; '' without
  enabled: boolean // the instance sends emails
}

// what allows a registration besides open registrations
export interface SignupGrant {
  invitation?: string,
  setup_code?: string,
}

// an invitation, as the admins see it: its code is only shown at its creation
export interface Invitation {
  id: string,
  created_at: string,
  hint: string, // the first characters of the code
  email: string, // the only email it registers, '' for any
  expires_at: string,
  used_at: string | null,
  created_by: string,
  used_by: string, // '' while unused
}

export interface NewInvitation {
  invitation: Invitation,
  code: string,
  link: string, // the sign up page with the code
  email_sent?: boolean, // sent by email when asked: false when the email failed
  email_error?: string,
}

// the space the files of the user take, and their quota: bytes, 0 for no quota
export interface Storage {
  used: number
  quota: number
}
