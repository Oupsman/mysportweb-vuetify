<script setup lang="ts">
  import { computed } from 'vue'
  import { useActivitiesStore } from '@/stores/activities'
  const activitiesStore = useActivitiesStore()
  const props = defineProps({
    activity: {
      type: Object,
      required: true,
    },
  })

  const formatedDate = computed(() => {
    const date = new Date(props.activity.date)
    return `${date.getDay()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`
  })

</script>

<template>
  <v-card class="h-auto w-20 ma-2 pa-1">
    <v-card-title>
      <h5 class="text-h5">{{ props.activity.title }}</h5>
    </v-card-title>
    <v-card-text>
      {{ formatedDate }}
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" @click="appStore.navigateToPage(`/activity/${props.activity.id}`)">View</v-btn>
      <v-btn color="primary" @click="appStore.navigateToPage(`/activity/edit/${props.activity.id}`)">Edit</v-btn>
      <v-btn color="primary" @click="activitiesStore.deleteActivity(props.activity.id)">Delete</v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped lang="sass">

</style>
