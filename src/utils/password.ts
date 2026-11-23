// the shortest new password, in characters (utils.MinPasswordLength of the backend). The backend also refuses
// the common ones, the username or the email address, a repeated character or a sequence, and tells why.
export const minPasswordLength = 10

export const passwordHint = `At least ${minPasswordLength} characters; a few words make a good one`

export const passwordLengthRule = (v: string): true | string =>
  v.length >= minPasswordLength || `At least ${minPasswordLength} characters`
