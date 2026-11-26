<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue'
  import FeedActivityCard from '@/components/FeedActivityCard.vue'
  import type { FeedCursor, FeedItem, FeedLoader } from '@/types/follows'

  // activities page by page, the most recent first: the feed, or the ones of a profile; load gets a page
  const props = defineProps<{ load: FeedLoader, showOwner: boolean }>()

  const items = ref<FeedItem[]>([])
  const next = ref<FeedCursor | null>(null)
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')

  const more = async (reset = false) => {
    loading.value = true
    error.value = ''
    try {
      const page = await props.load(reset ? null : next.value)
      items.value = reset ? page.activities : [...items.value, ...page.activities]
      next.value = page.next
      loaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }
  onMounted(() => more(true))
  // another profile: the same component, another loader
  watch(() => props.load, () => more(true))
</script>

<template>
  <div>
    <v-alert v-if="error" class="mb-4" type="error" variant="tonal">{{ error }}</v-alert>
    <v-progress-linear v-if="loading && !loaded" indeterminate />
    <div v-if="loaded && items.length === 0" class="text-medium-emphasis"><slot name="empty" /></div>
    <FeedActivityCard
      v-for="item in items"
      :key="item.id"
      class="mb-3"
      :item="item"
      :show-owner="showOwner"
    />
    <div v-if="next" class="d-flex justify-center">
      <v-btn :loading="loading" variant="tonal" @click="more()">Load more</v-btn>
    </div>
  </div>
</template>
