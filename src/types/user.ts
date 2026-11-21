// the session of the cookie, as the backend describes it
export interface UserSession {
  sub: number, // the id of the user
  uuid: string,
  role: string,
  exp: number, // the expiry, in seconds since the epoch
}

// who may create an account (REGISTRATION of the backend)
export type RegistrationMode = 'closed' | 'invite' | 'open'

// how to register on this instance, before any login
export interface InstanceInfo {
  registration: RegistrationMode,
  // the instance waits for its admin: registered with the setup code of the backend logs
  setup_required: boolean,
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
}
