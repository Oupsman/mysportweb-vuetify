<script setup lang="ts">
  import { computed } from 'vue'
  import { useActivitiesStore } from '@/stores/activities'
  import { useAppStore } from '@/stores/app'
  const activitiesStore = useActivitiesStore()
  const appStore = useAppStore()
  const props = defineProps({
    activity: {
      type: Object,
      required: true,
    },
  })

  const formatedDate = computed(() => {
    const date = new Date(props.activity.date)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}/${day}/${year} ${hours}:${minutes}`
  })

</script>

<template>
  <v-card class="h-auto w-33 ma-2 pa-1">
    <v-card-title>
      <h5 class="text-h5">{{ props.activity.title }}</h5>
    </v-card-title>
    <v-card-text>
      {{ formatedDate }}
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" @click="appStore.navigateToPage(`/activity/${props.activity.id}`)">View</v-btn>
      <router-link :to="'/activity/' + props.activity.id + '/edit'"><v-btn color="primary">Edit</v-btn></router-link>
      <v-btn color="primary" @click="activitiesStore.deleteActivity(props.activity.id)">Delete</v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped lang="sass">

</style>
