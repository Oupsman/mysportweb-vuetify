<script setup lang="ts">
  import { mdiUpload } from '@mdi/js'
  import { computed, onMounted, ref } from 'vue'
  import type { Ref } from 'vue'
  import axios from 'axios'
  import { api } from '@/api'
  import { useAppStore } from '@/stores/app'
  import { useEquipmentsStore } from '@/stores/equipments'
  import { useUserStore } from '@/stores/user'
  import { sportLabel } from '@/utils/format'

  const importResults: Ref<{ filename: string, status: string, color: string }[]> = ref([])
  const files: Ref<File[] | undefined> = ref(undefined)
  const uploadedFiles = ref({ completed: 0, count: 0, total: 0 })
  const appStore = useAppStore()
  const userStore = useUserStore()
  const equipmentsStore = useEquipmentsStore()

  // the server converts the GPX and TCX files to FIT files; a GPX file often doesn't name its sport
  const isTrack = (file: File) => /\.(gpx|tcx)(\.gz)?$/i.test(file.name)
  const hasTracks = computed(() => (files.value ?? []).some(isTrack))
  const sport = ref<string | null>(null)
  const sportItems = ref<{ title: string, value: string }[]>([])
  onMounted(async () => {
    try {
      const sports = await equipmentsStore.getSports()
      // the user's sports first, typing filters the others
      sportItems.value = [...sports.sports, ...sports.all.filter(s => !sports.sports.includes(s))]
        .map(s => ({ title: sportLabel(s), value: s }))
    } catch {
      // without the list, the files are uploaded with the sport they name, or generic
    }
  })

  const uploadFile = async (file: File, index: number, count: number): Promise<string | undefined> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('item', index.toString())
    formData.append('count', count.toString())
    if (sport.value && isTrack(file)) {
      formData.append('sport', sport.value)
    }
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

  // FIT files are uploaded once chosen; with GPX or TCX files, once their sport is chosen
  const filesChosen = () => {
    if (!hasTracks.value) {
      uploadActivity()
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
          accept=".fit,.gpx,.tcx,.gz"
          chips
          label="Select FIT, GPX or TCX files"
          multiple
          :prepend-icon="mdiUpload"
          @change="filesChosen"
        />
      </v-col>
    </v-row>
    <v-row v-if="hasTracks" align="center">
      <v-col cols="12" sm="8">
        <v-autocomplete
          v-model="sport"
          clearable
          hint="TCX files say whether they are a run or a ride, GPX files often don't. Left empty: the sport the file names, or generic"
          :items="sportItems"
          label="Sport of the GPX and TCX files that don't name it"
          persistent-hint
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-btn
          block
          color="primary"
          :disabled="uploadedFiles.total > 0 && uploadedFiles.completed < uploadedFiles.total"
          :prepend-icon="mdiUpload"
          @click="uploadActivity"
        >
          Upload
        </v-btn>
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
