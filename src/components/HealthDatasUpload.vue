<script setup lang="ts">
  import { mdiUpload } from '@mdi/js'
  import { ref } from 'vue'
  import type { Ref } from 'vue'
  import { api } from '@/api'
  import { useHealthStore } from '@/stores/health'

  const importResults: Ref<{ filename: string, status: string, color: string }[]> = ref([])
  const files: Ref<File[] | undefined> = ref(undefined)
  const uploadedFiles = ref({ completed: 0, count: 0, total: 0 })
  const healthStore = useHealthStore()

  const uploadHealthDatas = async () => {
    const selected = files.value
    if (!selected || selected.length === 0) return
    uploadedFiles.value = { completed: 0, total: selected.length, count: 0 }
    importResults.value = []

    await Promise.all(selected.map(async file => {
      const formData = new FormData()
      formData.append('file', file)
      try {
        await api.post('/api/v1/healthdatas/import', formData)
        importResults.value.push({ filename: file.name, status: 'Success', color: 'green' })
      } catch (error) {
        importResults.value.push({ filename: file.name, status: 'Error: ' + String(error), color: 'red' })
      } finally {
        uploadedFiles.value.completed++
      }
    }))
    healthStore.getAllHealthDatas().catch(() => {})
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
          label="Select CSV files"
          multiple
          :prepend-icon="mdiUpload"
          @change="uploadHealthDatas"
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
