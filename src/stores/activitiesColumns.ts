import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api, errorMessage } from '@/api'
import { defaultColumns, mergeColumns, sameColumns } from '@/utils/activityColumns'

// the columns of the activities table the user chose, in their order, saved on the server: the same on all
// their devices
export const useActivitiesColumnsStore = defineStore('activitiesColumns', () => {
  const columns: Ref<string[]> = ref(defaultColumns())
  // the user whose columns they are: another one logging in on this page gets theirs
  const owner: Ref<string | null> = ref(null)

  // at each visit of the table (changed on another device meanwhile); the default columns when they can't
  // be loaded
  const load = async (user: string): Promise<void> => {
    if (owner.value !== user) {
      owner.value = user
      columns.value = defaultColumns()
    }
    try {
      const response = await api.get('/api/v1/user/activities/columns')
      columns.value = mergeColumns(response.data.columns ?? null)
    } catch (error) {
      console.error('Get activities columns error:', error)
    }
  }

  // shown at once, then saved; the default columns are saved as null, the user then gets the defaults of the
  // later versions. Saved one after the other: the last change is the one kept.
  let saving: Promise<void> = Promise.resolve()
  const save = (next: string[]): Promise<void> => {
    columns.value = [...next]
    const body = { columns: sameColumns(next, defaultColumns()) ? null : next }
    saving = saving.catch(() => {}).then(async () => {
      try {
        await api.put('/api/v1/user/activities/columns', body)
      } catch (error) {
        console.error('Save activities columns error:', error)
        throw new Error(errorMessage(error, 'The columns could not be saved'))
      }
    })
    return saving
  }

  return { columns, load, save }
})
