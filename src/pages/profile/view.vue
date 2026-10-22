<script setup lang="ts">
  import ApiTokens from '@/components/ApiTokens.vue'
</script>

<template>
  <v-container>
    <router-link :to="'/profile/edit'"><v-btn color="primary">Edit</v-btn></router-link>
    <ApiTokens class="mt-6" />
  </v-container>
</template>

<style scoped lang="sass">

</style>
