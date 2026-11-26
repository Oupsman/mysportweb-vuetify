import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api, errorMessage } from '@/api'
import type { FeedCursor, FeedPage, Follows, FollowState, Profile, UserCard } from '@/types/follows'

// the users the user of the session follows and their followers, the profiles of the others and the feed
export const useFollowsStore = defineStore('follows', () => {
  const call = async <T>(request: () => Promise<{ data: T }>, failure: string): Promise<T> => {
    try {
      return (await request()).data
    } catch (error) {
      console.error(failure, error)
      throw new Error(errorMessage(error, failure))
    }
  }

  const follows: Ref<Follows | null> = ref(null)
  const loadFollows = async (): Promise<void> => {
    follows.value = await call(() => api.get('/api/v1/user/follows'), 'Your followers could not be loaded')
  }
  const setApproval = async (enabled: boolean): Promise<void> => {
    follows.value = await call(() => api.post('/api/v1/user/follows/approval', { enabled }),
      'The approval of the followers could not be changed')
  }
  const accept = async (uuid: string): Promise<void> => {
    follows.value = await call(() => api.post(`/api/v1/user/followers/${uuid}/accept`), 'The request could not be accepted')
  }
  // refuses a request, or stops a follower
  const removeFollower = async (uuid: string): Promise<void> => {
    follows.value = await call(() => api.delete(`/api/v1/user/followers/${uuid}`), 'The follower could not be removed')
  }

  const follow = async (uuid: string): Promise<FollowState> =>
    (await call<{ state: FollowState }>(() => api.post(`/api/v1/users/${uuid}/follow`), 'The user could not be followed')).state
  // stops following, or takes back the request
  const unfollow = async (uuid: string): Promise<FollowState> =>
    (await call<{ state: FollowState }>(() => api.delete(`/api/v1/users/${uuid}/follow`), 'The user could not be unfollowed')).state

  const search = async (q: string): Promise<UserCard[]> =>
    (await call<{ users: UserCard[] }>(() => api.get('/api/v1/users/search', { params: { q } }), 'The search failed')).users

  const profile = (uuid: string): Promise<Profile> =>
    call(() => api.get(`/api/v1/users/${uuid}`), 'The profile could not be loaded')

  const page = (path: string, cursor: FeedCursor | null): Promise<FeedPage> =>
    call(() => api.get(path, { params: cursor ?? {} }), 'The activities could not be loaded')
  const feed = (cursor: FeedCursor | null): Promise<FeedPage> => page('/api/v1/feed', cursor)
  const profileActivities = (uuid: string, cursor: FeedCursor | null): Promise<FeedPage> =>
    page(`/api/v1/users/${uuid}/activities`, cursor)

  return { follows, loadFollows, setApproval, accept, removeFollower, follow, unfollow, search, profile, feed, profileActivities }
})
