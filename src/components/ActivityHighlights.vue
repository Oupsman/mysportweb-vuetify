<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { mdiStarShootingOutline } from '@mdi/js'
  import { api, errorMessage } from '@/api'
  import type { Highlight } from '@/types/highlights'
  import { describeHighlight } from '@/utils/highlights'
  import { formatClock } from '@/utils/format'

  // what an activity of the user achieved: hidden when nothing
  const props = defineProps<{ activityId: string }>()
  const highlights = ref<Highlight[]>([])
  const error = ref('')

  onMounted(async () => {
    try {
      highlights.value = (await api.get(`/api/v1/activity/${props.activityId}/highlights`)).data.highlights ?? []
    } catch (e) {
      error.value = errorMessage(e, 'The highlights could not be loaded')
    }
  })
</script>

<template>
  <v-card v-if="highlights.length > 0 || error">
    <v-card-item>
      <template #prepend>
        <v-icon color="amber-darken-2" :icon="mdiStarShootingOutline" />
      </template>
      <v-card-title>Highlights</v-card-title>
      <v-card-subtitle>Compared with your activities before this one</v-card-subtitle>
    </v-card-item>
    <v-card-text>
      <v-alert v-if="error" density="compact" type="error" variant="tonal">{{ error }}</v-alert>
      <v-list v-else density="compact">
        <v-list-item
          v-for="(h, i) in highlights"
          :key="i"
        >
          <template #prepend>
            <v-icon :color="describeHighlight(h).color" :icon="describeHighlight(h).icon" />
          </template>
          <v-list-item-title>
            {{ describeHighlight(h).title }}: <strong>{{ describeHighlight(h).value }}</strong>
            <v-chip
              v-if="h.kind !== 'goal' && h.rank === 1"
              class="ml-2"
              :color="h.current ? 'amber-darken-2' : 'grey'"
              size="x-small"
              :title="h.current ? 'Still your best' : 'Beaten since'"
            >{{ h.current ? 'Still your best' : 'Beaten since' }}</v-chip>
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ describeHighlight(h).gain }}
            <span v-if="h.kind !== 'goal' && h.start_offset > 0"> · at {{ formatClock(h.start_offset) }}</span>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>
