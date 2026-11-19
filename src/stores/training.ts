import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api, errorMessage } from '@/api'
import type { HrZonesWeeks, Readiness } from '@/types/training'
import type { Records } from '@/types/records'

// what the backend computes from the heart rates and the training scores of the activities
export const useTrainingStore = defineStore('training', () => {
  const hrZones: Ref<HrZonesWeeks | null> = ref(null)
  const readiness: Ref<Readiness | null> = ref(null)
  const records: Ref<Records | null> = ref(null)

  // the weeks ending with the current one, starting on Monday in the user's timezone
  const getHrZones = async (weeks = 12): Promise<void> => {
    try {
      hrZones.value = (await api.get('/api/v1/user/hrzones', { params: { weeks } })).data
    } catch (error) {
      console.error('Get heart rate zones error:', error)
      throw new Error(errorMessage(error, 'The heart rate zones could not be loaded'))
    }
  }

  // the days ending with today, 7 to 365
  const getReadiness = async (days = 90): Promise<void> => {
    try {
      readiness.value = (await api.get('/api/v1/user/readiness', { params: { days } })).data
    } catch (error) {
      console.error('Get readiness error:', error)
      throw new Error(errorMessage(error, 'The readiness could not be loaded'))
    }
  }

  // the top efforts of each target: of one sport ('' for all), since a day (YYYY-MM-DD, '' for all time)
  const getRecords = async (sport = '', since = '', top = 3): Promise<Records> => {
    try {
      const params: Record<string, string | number> = { top }
      if (sport) {
        params.sport = sport
      }
      if (since) {
        params.since = since
      }
      records.value = (await api.get('/api/v1/user/records', { params })).data
      return records.value as Records
    } catch (error) {
      console.error('Get records error:', error)
      throw new Error(errorMessage(error, 'The records could not be loaded'))
    }
  }

  return { hrZones, readiness, records, getHrZones, getReadiness, getRecords }
})
