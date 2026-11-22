import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api, errorMessage } from '@/api'
import { useUserStore } from '@/stores/user'
import type {
  Equipment,
  EquipmentFields,
  EquipmentService,
  EquipmentServiceFields,
  Reminder,
  ReminderDone,
  ReminderFields,
  Sports,
} from '@/types/equipments'

export const useEquipmentsStore = defineStore('equipments', () => {
  // with their totals, the default ones first
  const equipments: Ref<Equipment[]> = ref([])

  // loads the equipments, always: after a change, the list must come after it
  const loadEquipments = async (): Promise<void> => {
    try {
      const response = await api.get('/api/v1/equipment/all')
      equipments.value = response.data ?? []
    } catch (error) {
      console.error('Get all equipments error:', error)
      throw new Error(errorMessage(error, 'The equipments could not be loaded'))
    }
  }

  // the load running, shared: a page creating the store (which loads them) and loading them at its mount
  // makes one request
  let loading: Promise<void> | null = null
  const getAllEquipments = (): Promise<void> => {
    loading ??= loadEquipments().finally(() => {
      loading = null
    })
    return loading
  }

  const getEquipment = async (id: string): Promise<Equipment> => {
    try {
      const response = await api.get(`/api/v1/equipment/${id}`)
      return response.data
    } catch (error) {
      console.error('Get equipment error:', error)
      throw new Error(errorMessage(error, 'The equipment could not be loaded'))
    }
  }

  // the list is reloaded after each change: taking the default of a sport changes another equipment
  // returns the id of the new equipment
  const insertEquipment = async (equipment: EquipmentFields): Promise<string> => {
    let id: string
    try {
      id = (await api.post('/api/v1/equipment', equipment)).data.id
    } catch (error) {
      console.error('Create equipment error:', error)
      throw new Error(errorMessage(error, 'The equipment could not be created'))
    }
    await loadEquipments()
    return id
  }

  const updateEquipment = async (id: string, equipment: EquipmentFields): Promise<void> => {
    try {
      await api.post(`/api/v1/equipment/${id}`, equipment)
    } catch (error) {
      console.error('Update equipment error:', error)
      throw new Error(errorMessage(error, 'The equipment could not be saved'))
    }
    await loadEquipments()
  }

  const getSports = async (): Promise<Sports> => {
    try {
      return (await api.get('/api/v1/user/sports')).data
    } catch (error) {
      console.error('Get sports error:', error)
      throw new Error(errorMessage(error, 'The sports could not be loaded'))
    }
  }

  // gives the commute equipment to the commute rides recorded before, returns how many changed
  const assignToCommutes = async (id: string): Promise<number> => {
    let updated: number
    try {
      updated = (await api.post(`/api/v1/equipment/${id}/commutes`)).data.updated
    } catch (error) {
      console.error('Assign commute equipment error:', error)
      throw new Error(errorMessage(error, 'The commute rides could not be updated'))
    }
    await loadEquipments()
    return updated
  }

  // the backend turns the picture upright, scales it down and drops its metadata (where the photo was taken)
  const uploadPicture = async (id: string, file: File): Promise<void> => {
    const form = new FormData()
    form.append('file', file)
    try {
      await api.post(`/api/v1/equipment/${id}/picture`, form)
    } catch (error) {
      console.error('Upload equipment picture error:', error)
      throw new Error(errorMessage(error, 'The picture could not be uploaded'))
    }
    await loadEquipments()
  }

  const deletePicture = async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/v1/equipment/${id}/picture`)
    } catch (error) {
      console.error('Delete equipment picture error:', error)
      throw new Error(errorMessage(error, 'The picture could not be removed'))
    }
    await loadEquipments()
  }

  // its activities are kept, without equipment
  const deleteEquipment = async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/v1/equipment/${id}`)
    } catch (error) {
      console.error('Delete equipment error:', error)
      throw new Error(errorMessage(error, 'The equipment could not be deleted'))
    }
    equipments.value = equipments.value.filter(e => e.id !== id)
  }

  // the services of an equipment, the latest first
  const getServices = async (equipmentId: string): Promise<EquipmentService[]> => {
    try {
      return (await api.get(`/api/v1/equipment/${equipmentId}/services`)).data ?? []
    } catch (error) {
      console.error('Get services error:', error)
      throw new Error(errorMessage(error, 'The services could not be loaded'))
    }
  }

  // the equipments are reloaded after each change: their distance since the latest service changes
  const insertService = async (equipmentId: string, service: EquipmentServiceFields): Promise<void> => {
    try {
      await api.post(`/api/v1/equipment/${equipmentId}/services`, service)
    } catch (error) {
      console.error('Create service error:', error)
      throw new Error(errorMessage(error, 'The service could not be saved'))
    }
    await loadEquipments()
  }

  const updateService = async (equipmentId: string, id: string, service: EquipmentServiceFields): Promise<void> => {
    try {
      await api.post(`/api/v1/equipment/${equipmentId}/services/${id}`, service)
    } catch (error) {
      console.error('Update service error:', error)
      throw new Error(errorMessage(error, 'The service could not be saved'))
    }
    await loadEquipments()
  }

  const deleteService = async (equipmentId: string, id: string): Promise<void> => {
    try {
      await api.delete(`/api/v1/equipment/${equipmentId}/services/${id}`)
    } catch (error) {
      console.error('Delete service error:', error)
      throw new Error(errorMessage(error, 'The service could not be deleted'))
    }
    await loadEquipments()
  }

  // the reminders are in the equipments: they are reloaded after each change
  const insertReminder = async (equipmentId: string, reminder: ReminderFields): Promise<void> => {
    try {
      await api.post(`/api/v1/equipment/${equipmentId}/reminders`, reminder)
    } catch (error) {
      console.error('Create reminder error:', error)
      throw new Error(errorMessage(error, 'The reminder could not be saved'))
    }
    await loadEquipments()
  }

  const updateReminder = async (equipmentId: string, id: string, reminder: ReminderFields): Promise<void> => {
    try {
      await api.post(`/api/v1/equipment/${equipmentId}/reminders/${id}`, reminder)
    } catch (error) {
      console.error('Update reminder error:', error)
      throw new Error(errorMessage(error, 'The reminder could not be saved'))
    }
    await loadEquipments()
  }

  // its services are kept
  const deleteReminder = async (equipmentId: string, id: string): Promise<void> => {
    try {
      await api.delete(`/api/v1/equipment/${equipmentId}/reminders/${id}`)
    } catch (error) {
      console.error('Delete reminder error:', error)
      throw new Error(errorMessage(error, 'The reminder could not be deleted'))
    }
    await loadEquipments()
  }

  // logs a service done for a reminder: now, at the mileage of the equipment, named after the reminder,
  // unless told otherwise
  const reminderDone = async (
    equipmentId: string,
    id: string,
    service: { date?: string, mileage?: number, description?: string } = {},
  ): Promise<ReminderDone> => {
    let done: ReminderDone
    try {
      done = (await api.post(`/api/v1/equipment/${equipmentId}/reminders/${id}/done`, service)).data
    } catch (error) {
      console.error('Reminder done error:', error)
      throw new Error(errorMessage(error, 'The reminder could not be marked done'))
    }
    await loadEquipments()
    return done
  }

  // the reminders due or soon of all the equipments, the most urgent first
  const getMaintenance = async (): Promise<Reminder[]> => {
    try {
      return (await api.get('/api/v1/user/maintenance')).data.reminders ?? []
    } catch (error) {
      console.error('Get maintenance error:', error)
      throw new Error(errorMessage(error, 'The maintenance reminders could not be loaded'))
    }
  }

  // the store is created by a page, once the router knows the session
  if (useUserStore().session) {
    getAllEquipments().catch(() => {})
  }

  return {
    equipments,
    getAllEquipments,
    getEquipment,
    insertEquipment,
    updateEquipment,
    getSports,
    assignToCommutes,
    uploadPicture,
    deletePicture,
    deleteEquipment,
    getServices,
    insertService,
    updateService,
    deleteService,
    insertReminder,
    updateReminder,
    deleteReminder,
    reminderDone,
    getMaintenance,
  }
})
