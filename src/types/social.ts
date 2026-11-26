// how a user shows to the others: never their id nor their email
export interface SocialUser {
  uuid: string
  username: string
}

export interface Cheer extends SocialUser {
  created_at: string
}

export interface Comment {
  id: string
  author: SocialUser
  body: string
  created_at: string
  updated_at: string // after created_at once changed
  mine: boolean
  can_delete: boolean // the author, the owner of the activity and the admins delete it
}

// the cheers and comments of an activity, as the user sees them
export interface ActivitySocial {
  cheers: Cheer[]
  cheered: boolean // the user cheered it
  can_cheer: boolean // not their own activity
  can_comment: boolean // its owner opened it to comments ("Comments allowed")
  comments: Comment[]
}

// the most characters of a comment, as the backend checks
export const MAX_COMMENT_LENGTH = 2000
