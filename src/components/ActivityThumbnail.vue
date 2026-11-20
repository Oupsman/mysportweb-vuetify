<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { mediaUrl } from '@/api'
  import { sportColor, sportIcon, sportLabel } from '@/utils/format'

  // thumbnail: the URL the backend gives, '' for an activity without map (indoor, or a short loop inside
  // the privacy zones). The map with the sport as a badge, or the sport alone.
  const props = defineProps<{ thumbnail: string, sport: string }>()

  // the image failed (deleted, not drawn yet): the sport alone
  const failed = ref(false)
  watch(() => props.thumbnail, () => {
    failed.value = false
  })
</script>

<template>
  <div class="thumbnail" :title="sportLabel(sport)">
    <v-img
      v-if="thumbnail && !failed"
      :alt="sportLabel(sport)"
      cover
      height="48"
      rounded
      :src="mediaUrl(thumbnail)"
      width="72"
      @error="failed = true"
    >
      <v-icon class="badge" :color="sportColor(sport)" :icon="sportIcon(sport)" size="14" />
    </v-img>
    <v-sheet
      v-else
      class="placeholder d-flex align-center justify-center"
      height="48"
      rounded
      width="72"
    >
      <v-icon :color="sportColor(sport)" :icon="sportIcon(sport)" />
    </v-sheet>
  </div>
</template>

<style scoped>
.thumbnail {
  width: 72px;
  height: 48px;
  margin: 2px 0;
}

/* no map, or until the map is loaded (lazily, once scrolled to) */
.thumbnail .v-img,
.thumbnail .placeholder {
  background: rgb(var(--v-theme-surface-variant), 0.12);
}

/* the sport in the top left corner of the map, readable on any tile */
.badge {
  position: absolute;
  top: 3px;
  left: 3px;
  box-sizing: content-box;
  padding: 3px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
}
</style>
