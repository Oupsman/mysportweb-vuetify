<script setup lang="ts">
  import ApiTokens from '@/components/ApiTokens.vue'
  import PushNotifications from '@/components/PushNotifications.vue'
</script>

<template>
  <v-container>
    <router-link :to="'/profile/edit'"><v-btn color="primary">Edit</v-btn></router-link>
    <PushNotifications class="mt-6" />
    <ApiTokens class="mt-6" />
  </v-container>
</template>

<style scoped lang="sass">

</style>
