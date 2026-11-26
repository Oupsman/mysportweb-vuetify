<script setup lang="ts">
  import { mdiCommentOutline, mdiHandClap } from '@mdi/js'
  import { useRouter } from 'vue-router'
  import ActivityThumbnail from '@/components/ActivityThumbnail.vue'
  import type { FeedItem } from '@/types/follows'
  import { formatDate, formatDistance, formatDuration, formatElevation, formatSpeedFor, sportLabel } from '@/utils/format'

  // an activity in the feed or on a profile: who, when, the figures, the map; opens the activity
  const props = defineProps<{ item: FeedItem, showOwner: boolean }>()
  // not a link itself: the name of the owner is one, links don't nest
  const router = useRouter()
  const open = () => router.push(`/activity/${props.item.id}`)
</script>

<template>
  <v-card link @click="open">
    <v-card-item>
      <template #prepend>
        <ActivityThumbnail :sport="item.sport" :thumbnail="item.thumbnail" />
      </template>
      <v-card-title class="text-wrap">{{ item.title }}</v-card-title>
      <v-card-subtitle>
        <router-link v-if="showOwner" :to="`/athletes/${item.owner.uuid}`" @click.stop>{{ item.owner.username }}</router-link>
        <template v-if="showOwner"> · </template>{{ sportLabel(item.sport) }} · {{ formatDate(item.date) }}
      </v-card-subtitle>
    </v-card-item>
    <v-card-text class="d-flex flex-wrap ga-4">
      <span v-if="item.distance > 0">{{ formatDistance(item.distance) }}</span>
      <span>{{ formatDuration(item.duration) }}</span>
      <span v-if="item.elevation > 0">{{ formatElevation(item.elevation) }}</span>
      <span v-if="item.avg_speed > 0">{{ formatSpeedFor(item.sport, item.avg_speed) }}</span>
      <v-spacer />
      <span v-if="item.cheer_count > 0" class="text-medium-emphasis" :class="{ 'text-primary': item.cheered }">
        <v-icon :icon="mdiHandClap" size="small" /> {{ item.cheer_count }}
      </span>
      <span v-if="item.comment_count > 0" class="text-medium-emphasis">
        <v-icon :icon="mdiCommentOutline" size="small" /> {{ item.comment_count }}
      </span>
    </v-card-text>
  </v-card>
</template>
