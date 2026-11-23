import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api, errorMessage } from '@/api'
import type { Goal, GoalInput } from '@/types/goals'

// the training goals of the user, their progress computed by the backend
export const useGoalsStore = defineStore('goals', () => {
  const goals: Ref<Goal[]> = ref([])
  const loaded = ref(false)

  const load = async (): Promise<void> => {
    try {
      goals.value = (await api.get('/api/v1/user/goals')).data
      loaded.value = true
    } catch (error) {
      console.error('Get goals error:', error)
      throw new Error(errorMessage(error, 'The goals could not be loaded'))
    }
  }

  // creates the goal without id, else updates it
  const save = async (input: GoalInput, id?: string): Promise<Goal> => {
    let goal: Goal
    try {
      goal = (await api.post(id ? `/api/v1/user/goals/${id}` : '/api/v1/user/goals', input)).data
    } catch (error) {
      console.error('Save goal error:', error)
      throw new Error(errorMessage(error, 'The goal could not be saved'))
    }
    const index = goals.value.findIndex(g => g.id === goal.id)
    if (index >= 0) {
      goals.value[index] = goal
    } else {
      goals.value.push(goal)
    }
    return goal
  }

  const remove = async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/v1/user/goals/${id}`)
    } catch (error) {
      console.error('Delete goal error:', error)
      throw new Error(errorMessage(error, 'The goal could not be deleted'))
    }
    goals.value = goals.value.filter(g => g.id !== id)
  }

  return { goals, loaded, load, save, remove }
})
