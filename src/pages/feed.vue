<script setup lang="ts">
  import FeedList from '@/components/FeedList.vue'
  import { useFollowsStore } from '@/stores/follows'

  // the activities of the users followed, as their visibility lets the user see them
  const followsStore = useFollowsStore()
</script>

<template>
  <v-container class="feed">
    <h5 class="text-h5 mb-4">Feed</h5>
    <FeedList :load="followsStore.feed" show-owner>
      <template #empty>
        Nothing yet: the activities of the athletes you follow show here.
        <router-link to="/athletes">Find athletes to follow</router-link>.
      </template>
    </FeedList>
  </v-container>
</template>

<style scoped lang="sass">
.feed
  max-width: 760px
</style>
