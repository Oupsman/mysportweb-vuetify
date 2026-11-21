import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'
import { api, errorMessage } from '@/api'
import type { Segment, SegmentEffort, SegmentSummary } from '@/types/segments'

export const useSegmentsStore = defineStore('segments', () => {
  const segments: Ref<SegmentSummary[]> = ref([])

  const getSegments = async (): Promise<void> => {
    try {
      segments.value = (await api.get('/api/v1/segments')).data.segments ?? []
    } catch (error) {
      throw new Error(errorMessage(error, 'The segments could not be loaded'))
    }
  }

  const getSegment = async (id: string): Promise<{ segment: Segment, efforts: SegmentEffort[] }> => {
    try {
      const data = (await api.get(`/api/v1/segments/${id}`)).data
      return { segment: data.segment, efforts: data.efforts ?? [] }
    } catch (error) {
      throw new Error(errorMessage(error, 'The segment could not be loaded'))
    }
  }

  // a segment from the GPS points start to end of an activity; its passes are found in all the activities
  const createSegment = async (activityId: string, start: number, end: number, name: string): Promise<Segment> => {
    try {
      // matching all the activities takes a few seconds with many of them
      const response = await api.post('/api/v1/segments', { activity_id: activityId, start, end, name }, { timeout: 120_000 })
      return response.data.segment
    } catch (error) {
      throw new Error(errorMessage(error, 'The segment could not be created'))
    }
  }

  const renameSegment = async (id: string, name: string): Promise<void> => {
    try {
      await api.post(`/api/v1/segments/${id}`, { name })
    } catch (error) {
      throw new Error(errorMessage(error, 'The segment could not be renamed'))
    }
  }

  const deleteSegment = async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/v1/segments/${id}`)
    } catch (error) {
      throw new Error(errorMessage(error, 'The segment could not be deleted'))
    }
  }

  // the passes of an activity on the segments, in their order
  const getActivityEfforts = async (activityId: string): Promise<SegmentEffort[]> => {
    try {
      return (await api.get(`/api/v1/activity/${activityId}/segments`)).data.efforts ?? []
    } catch (error) {
      throw new Error(errorMessage(error, 'The segments of the activity could not be loaded'))
    }
  }

  return { segments, getSegments, getSegment, createSegment, renameSegment, deleteSegment, getActivityEfforts }
})
