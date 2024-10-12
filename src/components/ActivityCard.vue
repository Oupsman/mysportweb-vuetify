<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useActivitiesStore } from '@/stores/activities'
  import { useAppStore } from '@/stores/app'
  import { useUserStore } from '@/stores/user'
  const activitiesStore = useActivitiesStore()
  const appStore = useAppStore()
  const userStore = useUserStore()
  const props = defineProps({
    activity: {
      type: Object,
      required: true,
    },
  })
  const thumbnailUrl = ref('')
  const hover = ref(false)
  const formatedDate = computed(() => {
    const date = new Date(props.activity.date)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}/${day}/${year} ${hours}:${minutes}`
  })
  thumbnailUrl.value = `${import.meta.env.VITE_BACKEND_URL}/MEDIA/${userStore.session.uuid}/thumbnails/${props.activity.id}.png`
  console.log(thumbnailUrl.value)
</script>

<template>
  <v-container class="ma-2 pa-1" style="height: 250px; width:300px;" @mouseleave="hover = false" @mouseover="hover = true">
    <v-card v-if="!hover" style="height: 250px; width:300px;">
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
    <v-card v-if="hover" style="height: 250px; width:300px; ">
      <v-lazy>
        <v-img :src="thumbnailUrl" />
      </v-lazy>
      <v-card-actions>
        <v-btn color="primary" @click="appStore.navigateToPage(`/activity/${props.activity.id}`)">View</v-btn>
        <router-link :to="'/activity/' + props.activity.id + '/edit'"><v-btn color="primary">Edit</v-btn></router-link>
        <v-btn color="primary" @click="activitiesStore.deleteActivity(props.activity.id)">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<style scoped lang="sass">

</style>
