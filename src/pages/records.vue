<script setup lang="ts">
  import PersonalRecords from '@/components/PersonalRecords.vue'
  import PowerCurveSection from '@/components/PowerCurveSection.vue'
</script>

<template>
  <v-container>
    <h2 class="text-h4 mb-4">Records</h2>
    <PersonalRecords />
    <PowerCurveSection class="mt-6" />
  </v-container>
</template>
