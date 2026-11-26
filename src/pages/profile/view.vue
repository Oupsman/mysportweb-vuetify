<script setup lang="ts">
  import AccountDataCard from '@/components/AccountDataCard.vue'
  import AccountImportCard from '@/components/AccountImportCard.vue'
  import EmailCard from '@/components/EmailCard.vue'
  import ApiTokens from '@/components/ApiTokens.vue'
  import PushNotifications from '@/components/PushNotifications.vue'
  import StorageCard from '@/components/StorageCard.vue'
  import TwoFactorCard from '@/components/TwoFactorCard.vue'
  import WorkplacesCard from '@/components/WorkplacesCard.vue'
</script>

<template>
  <v-container>
    <router-link :to="'/profile/edit'"><v-btn color="primary">Edit</v-btn></router-link>
    <WorkplacesCard class="mt-6" />
    <EmailCard class="mt-6" />
    <TwoFactorCard class="mt-6" />
    <PushNotifications class="mt-6" />
    <ApiTokens class="mt-6" />
    <StorageCard class="mt-6" />
    <AccountDataCard class="mt-6" />
    <AccountImportCard class="mt-6" />
  </v-container>
</template>

<style scoped lang="sass">

</style>
