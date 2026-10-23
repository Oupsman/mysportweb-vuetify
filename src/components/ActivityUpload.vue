<script setup lang="ts">
  import { mdiUpload } from '@mdi/js'
  import { ref } from 'vue'
  import type { Ref } from 'vue'
  import axios from 'axios'
  import { api } from '@/api'
  import { useAppStore } from '@/stores/app'
  import { useUserStore } from '@/stores/user'

  const importResults: Ref<{ filename: string, status: string, color: string }[]> = ref([])
  const files: Ref<File[] | undefined> = ref(undefined)
  const uploadedFiles = ref({ completed: 0, count: 0, total: 0 })
  const appStore = useAppStore()
  const userStore = useUserStore()

  const uploadFile = async (file: File, index: number, count: number): Promise<string | undefined> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('item', index.toString())
    formData.append('count', count.toString())
    try {
      // not /api/v1/activity: the ad blockers refuse it (EasyPrivacy)
      const response = await api.post('/api/v1/activities/upload', formData, { timeout: 120000 })
      importResults.value.push({ filename: file.name, status: 'Success', color: 'green' })
      return response.data.id
    } catch (error) {
      // already imported: not an error, the upload leads to the existing activity
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        importResults.value.push({ filename: file.name, status: 'Already imported', color: 'orange' })
        return error.response.data?.id
      }
      const reason = axios.isAxiosError(error) ? error.response?.data?.error ?? error.message : String(error)
      importResults.value.push({ filename: file.name, status: 'Error: ' + reason, color: 'red' })
      return undefined
    } finally {
      uploadedFiles.value.completed++
    }
  }

  const uploadActivity = async () => {
    const selected = files.value
    if (!selected || selected.length === 0) return
    uploadedFiles.value = { completed: 0, total: selected.length, count: 0 }
    importResults.value = []

    // the first file resets the "last import" flags on the backend: it must be processed before the others
    const firstID = await uploadFile(selected[0], 0, selected.length)
    await Promise.all(selected.slice(1).map((file, index) => uploadFile(file, index + 1, selected.length)))

    userStore.refreshDashboard().catch(() => {})
    if (selected.length === 1 && firstID) {
      appStore.navigateToPage(`/activity/${firstID}`)
    }
  }
</script>

<template>
  <v-container>
    <v-row class="h-25">
      <v-progress-linear
        v-if="files && uploadedFiles.total > 0"
        color="green"
        height="25"
        :model-value="(uploadedFiles.completed / uploadedFiles.total) * 100"
      >
        <strong>{{ Math.round((uploadedFiles.completed / uploadedFiles.total) * 100) }}%</strong>
      </v-progress-linear>
    </v-row>
    <v-row class="h-25">
      <v-col cols="12">
        <v-file-input
          v-model="files"
          chips
          label="Select FIT files"
          multiple
          :prepend-icon="mdiUpload"
          @change="uploadActivity"
        />
      </v-col>
    </v-row>
    <v-row class="h-50">
      <v-table>
        <tbody>
          <tr
            v-for="importResult in importResults"
            :key="importResult.filename"
          >
            <td>{{ importResult.filename }}</td>
            <td :class="`text-${importResult.color}`">{{ importResult.status }}</td>
          </tr>
        </tbody>

      </v-table>
    </v-row>
  </v-container>
</template>

<style scoped lang="sass">

</style>
