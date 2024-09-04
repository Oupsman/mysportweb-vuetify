<script setup lang="ts">
  import axios from 'axios'
  import { ref } from 'vue'
  import { useAppStore } from '@/stores/app'
  const file: Ref<File | any | undefined> = ref(undefined)
  const appStore = useAppStore()
  const uploadActivity = () => {
    console.log(file.value)
    const request = axios.create({
      baseURL: import.meta.env.VITE_BACKEND_URL,
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('msw-token')}`,
      },
    })
    request.post(import.meta.env.VITE_BACKEND_URL + '/api/v1/activity', {
      file: file.value,
    }).then(response => {
      const uuid = response.data.id
      appStore.navigateToPage(`/activity/${uuid}`)
    }).catch(error => {
      console.error(error)
    })
  }
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-file-input
          v-model="file"
          label="Select an FIT file"
          prepend-icon="mdi-upload"
          @change="uploadActivity"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="sass">

</style>
