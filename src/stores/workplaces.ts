import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api, errorMessage } from '@/api'
import type { Workplace, WorkplaceInput } from '@/types/workplaces'

// the workplaces of the user: an activity imported starting or ending at one is a commute
export const useWorkplacesStore = defineStore('workplaces', () => {
  const workplaces: Ref<Workplace[]> = ref([])

  const load = async (): Promise<void> => {
    try {
      workplaces.value = (await api.get('/api/v1/user/workplaces')).data
    } catch (error) {
      console.error('Get workplaces error:', error)
      throw new Error(errorMessage(error, 'The workplaces could not be loaded'))
    }
  }

  // creates the workplace without id, else updates it
  const save = async (input: WorkplaceInput, id?: string): Promise<Workplace> => {
    let workplace: Workplace
    try {
      workplace = (await api.post(id ? `/api/v1/user/workplaces/${id}` : '/api/v1/user/workplaces', input)).data
    } catch (error) {
      console.error('Save workplace error:', error)
      throw new Error(errorMessage(error, 'The workplace could not be saved'))
    }
    const index = workplaces.value.findIndex(w => w.id === workplace.id)
    if (index >= 0) {
      workplaces.value[index] = workplace
    } else {
      workplaces.value.push(workplace)
    }
    return workplace
  }

  // the activities it made commutes stay commutes
  const remove = async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/v1/user/workplaces/${id}`)
    } catch (error) {
      console.error('Delete workplace error:', error)
      throw new Error(errorMessage(error, 'The workplace could not be deleted'))
    }
    workplaces.value = workplaces.value.filter(w => w.id !== id)
  }

  // makes the activities already recorded starting or ending at the workplace commutes, returns how many
  const applyToPast = async (id: string): Promise<number> => {
    try {
      return (await api.post(`/api/v1/user/workplaces/${id}/apply`)).data.updated
    } catch (error) {
      console.error('Apply workplace error:', error)
      throw new Error(errorMessage(error, 'The activities could not be updated'))
    }
  }

  return { workplaces, load, save, remove, applyToPast }
})
