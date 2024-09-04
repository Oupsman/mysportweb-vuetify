<script setup lang="ts">
  import { useAppStore } from '@/stores/app'
  // const userStore = useUserStore();
  const appStore = useAppStore()
</script>

<template>
  <v-container class="h-auto w-100">
    <v-row>
      <v-col>
        <h2 class="text-h2">Activities</h2>
      </v-col>
      <v-col>
        <v-btn color="primary" @click="appStore.navigateToPage('/activity/add')">Upload an activity</v-btn>
      </v-col>
    </v-row>
    <v-row>
      <ActivitiesList />
    </v-row>
  </v-container>
</template>

<style scoped lang="sass">

</style>
