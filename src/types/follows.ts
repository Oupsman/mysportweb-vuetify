import type { SocialUser } from '@/types/social'

// the follow of a user by the user of the session
export type FollowState = 'none' | 'pending' | 'following'

// a user found by a search
export interface UserCard extends SocialUser {
  state: FollowState
}

// the profile of a user, as the user of the session sees it
export interface Profile {
  user: SocialUser
  me: boolean // their own profile
  state: FollowState
  follows_you: boolean
  counts: { followers: number, following: number }
}

// a follower or a followee: a request until accepted
export interface FollowView extends SocialUser {
  created_at: string
  accepted_at: string | null
}

export interface Follows {
  followers: FollowView[]
  following: FollowView[]
  approval: boolean // each follower is accepted, else anyone follows at once
}

// an activity of the feed or of a profile: what its card shows, never its trace
export interface FeedItem {
  id: string
  owner: SocialUser
  title: string
  date: string
  sport: string
  distance: number
  duration: number
  elevation: number
  avg_speed: number
  thumbnail: string // '' without map
  cheer_count: number
  comment_count: number
  cheered: boolean
}

// where the next page starts, null after the last one
export interface FeedCursor {
  before: string
  before_id: string
}

export interface FeedPage {
  activities: FeedItem[]
  next: FeedCursor | null
}

// gets a page of activities, the first one without cursor
export type FeedLoader = (cursor: FeedCursor | null) => Promise<FeedPage>
