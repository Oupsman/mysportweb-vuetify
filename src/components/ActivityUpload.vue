<script setup lang="ts">
  import axios from 'axios'
  import { ref } from 'vue'
  import { useAppStore } from '@/stores/app'
  import { useUserStore } from '@/stores/user'

  const importResults = ref([])
  const files: Ref<File[]> = ref(undefined)
  const uploadedFiles = ref({ completed: 0, count: 0, total: 0 })
  const appStore = useAppStore()
  const userStore = useUserStore()
  const uploadActivity = () => {
    if (!files.value || files.value.length === 0) return

    uploadedFiles.value = { completed: 0, total: files.value.length, count: 0 }
    importResults.value = []

    const request = axios.create({
      baseURL: import.meta.env.VITE_BACKEND_URL,
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('msw-token')}`,
      },
    })

    const uploadPromises = files.value.map((file, index) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('item', index.toString())
      formData.append('count', files.value.length.toString())

      return request.post(import.meta.env.VITE_BACKEND_URL + '/api/v1/activity', formData)
        .then(response => {
          uploadedFiles.value.completed++
          if (files.value.length === 1) {
            const uuid = response.data.id
            appStore.navigateToPage(`/activity/${uuid}`)
          } else {
            importResults.value.push({ filename: file.name, status: 'Success', color: 'green' })
          }
        })
        .catch(error => {
          uploadedFiles.value.completed++
          importResults.value.push({ filename: file.name, status: 'Error: ' + error.toString(), color: 'red' })
        })
    })

    Promise.all(uploadPromises).then(() => {
      userStore.refreshDashboard()
    })
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
          prepend-icon="mdi-upload"
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
            <td color="{{ importResult.color }}">{{ importResult.status }}</td>
          </tr>
        </tbody>

      </v-table>
    </v-row>
  </v-container>
</template>

<style scoped lang="sass">

</style>
