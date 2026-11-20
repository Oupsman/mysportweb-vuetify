// the session of the cookie, as the backend describes it
export interface UserSession {
  sub: number, // the id of the user
  uuid: string,
  role: string,
  exp: number, // the expiry, in seconds since the epoch
}
