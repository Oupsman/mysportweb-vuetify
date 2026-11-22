<script setup lang="ts">
  import { ref } from 'vue'
  import { mdiCheck, mdiContentCopy } from '@mdi/js'

  // the recovery codes, shown once
  const props = defineProps<{ codes: string[] }>()
  const copied = ref(false)
  const copy = async () => {
    await navigator.clipboard.writeText(props.codes.join('\n'))
    copied.value = true
  }
</script>

<template>
  <v-alert class="mb-4" title="Keep these recovery codes now" type="warning" variant="tonal">
    <p class="mb-2">
      Each one logs you in once without your phone. They are shown only now: save them in your password manager
      or print them.
    </p>
    <div class="codes my-2">
      <code v-for="c in codes" :key="c">{{ c }}</code>
    </div>
    <v-btn :prepend-icon="copied ? mdiCheck : mdiContentCopy" size="small" variant="outlined" @click="copy">
      {{ copied ? 'Copied' : 'Copy' }}
    </v-btn>
  </v-alert>
</template>

<style scoped>
.codes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8em, 1fr));
  gap: 4px 16px;
  font-size: 1.05em;
}
</style>
