import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api, errorMessage } from '@/api'
import type { WidgetLayout } from '@/types/dashboard'
import { defaultLayout, mergeLayout, sameLayout } from '@/utils/dashboardWidgets'

// how the user arranged their dashboard, saved on the server: the same on all their devices
export const useDashboardLayoutStore = defineStore('dashboardLayout', () => {
  const layout: Ref<WidgetLayout[]> = ref(defaultLayout())
  // the user whose layout it is: another one logging in on this page gets theirs
  const owner: Ref<string | null> = ref(null)
  const loaded = ref(false)

  // at each visit of the dashboard (changed on another device meanwhile); the default layout when it can't
  // be loaded
  const load = async (user: string): Promise<void> => {
    if (owner.value !== user) {
      owner.value = user
      layout.value = defaultLayout()
      loaded.value = false
    }
    try {
      const response = await api.get('/api/v1/user/dashboard/layout')
      layout.value = mergeLayout(response.data.widgets ?? null)
    } catch (error) {
      console.error('Get dashboard layout error:', error)
    } finally {
      loaded.value = true
    }
  }

  // the default layout is saved as null: the user gets the widgets added later at their default place.
  // isDefault: the layout shows as the default one (its places may differ, gone up into the room of a widget
  // with nothing to show).
  const save = async (widgets: WidgetLayout[], isDefault = sameLayout(widgets, defaultLayout())): Promise<void> => {
    try {
      await api.put('/api/v1/user/dashboard/layout', { widgets: isDefault ? null : widgets })
    } catch (error) {
      console.error('Save dashboard layout error:', error)
      throw new Error(errorMessage(error, 'The layout could not be saved'))
    }
    layout.value = widgets.map(w => ({ ...w }))
  }

  return { layout, loaded, load, save }
})
