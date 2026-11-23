<script setup lang="ts">
  import { mdiStarShootingOutline } from '@mdi/js'
  import { useAppStore } from '@/stores/app'
  import { useUserStore } from '@/stores/user'
  import { describeHighlight } from '@/utils/highlights'
  import { formatDate } from '@/utils/format'

  // the new bests and the goals completed of the last 30 days, the latest first
  const userStore = useUserStore()
  const appStore = useAppStore()
  const open = (id: string) => appStore.navigateToPage(`/activity/${id}`)
</script>

<template>
  <v-card class="widget-card">
    <v-card-item>
      <template #prepend>
        <v-icon color="amber-darken-2" :icon="mdiStarShootingOutline" />
      </template>
      <v-card-title>Highlights</v-card-title>
      <v-card-subtitle>New bests and goals of the last 30 days</v-card-subtitle>
    </v-card-item>
    <v-card-text class="widget-scroll">
      <div v-if="!(userStore.dashboard.highlights?.length)" class="text-body-2 text-medium-emphasis">
        Nothing new these 30 days. Your next best effort, best time on a segment or completed goal shows here.
      </div>
      <v-list v-else density="compact">
        <v-list-item
          v-for="(h, i) in userStore.dashboard.highlights"
          :key="i"
          class="px-0"
          @click="open(h.activity_id)"
        >
          <template #prepend>
            <v-icon :color="describeHighlight(h).color" :icon="describeHighlight(h).icon" />
          </template>
          <v-list-item-title>
            {{ describeHighlight(h).title }}: <strong>{{ describeHighlight(h).value }}</strong>
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ formatDate(h.date) }} · {{ h.activity_title }}
            <span v-if="describeHighlight(h).gain"> · {{ describeHighlight(h).gain }}</span>
            <span v-if="h.kind !== 'goal' && !h.current"> · beaten since</span>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>
