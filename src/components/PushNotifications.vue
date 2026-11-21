<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { mdiBellOutline, mdiDeleteOutline } from '@mdi/js'
  import { usePushStore } from '@/stores/push'
  import { browserName, currentSubscription, pushSupport, subscribe } from '@/utils/push'

  const pushStore = usePushStore()
  const support = pushSupport()

  // the id of the subscription of this browser on the backend, to remove it from here
  const thisKey = 'msw-push-subscription'
  const readThisId = (): number | null => {
    try {
      const id = Number(localStorage.getItem(thisKey))
      return id > 0 ? id : null
    } catch {
      return null
    }
  }
  const thisId = ref<number | null>(readThisId())
  const rememberThis = (id: number | null) => {
    thisId.value = id
    try {
      if (id) {
        localStorage.setItem(thisKey, String(id))
      } else {
        localStorage.removeItem(thisKey)
      }
    } catch {
      // only this card forgets which one is this browser
    }
  }

  const subscribed = ref(false)
  const busy = ref(false)
  const error = ref('')
  const info = ref('')

  onMounted(async () => {
    try {
      await pushStore.load()
      if (support === 'supported') {
        const subscription = await currentSubscription()
        subscribed.value = subscription !== null && pushStore.subscriptions.some(s => s.id === thisId.value)
      }
    } catch (error_) {
      error.value = (error_ as Error).message
    }
  })

  const run = async (action: () => Promise<void>) => {
    busy.value = true
    error.value = ''
    info.value = ''
    try {
      await action()
    } catch (error_) {
      error.value = (error_ as Error).message
    } finally {
      busy.value = false
    }
  }

  const turnOn = () => run(async () => {
    const subscription = await subscribe(pushStore.publicKey)
    rememberThis(await pushStore.save(subscription, browserName()))
    subscribed.value = true
  })

  const turnOff = () => run(async () => {
    const subscription = await currentSubscription()
    await subscription?.unsubscribe()
    if (thisId.value && pushStore.subscriptions.some(s => s.id === thisId.value)) {
      await pushStore.remove(thisId.value)
    }
    rememberThis(null)
    subscribed.value = false
  })

  const toggle = (on: boolean | null) => (on ? turnOn() : turnOff())

  const test = () => run(async () => {
    await pushStore.test()
    info.value = 'Sent: it shows within a minute on each subscribed browser.'
  })

  const remove = (id: number) => run(async () => {
    await pushStore.remove(id)
    if (id === thisId.value) {
      await (await currentSubscription())?.unsubscribe()
      rememberThis(null)
      subscribed.value = false
    }
  })

  const since = (date: string) =>
    new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))
  const unsupportedText = computed(() => support === 'insecure'
    ? 'Notifications need the app served over HTTPS.'
    : 'This browser can\'t receive notifications. On iPhone and iPad, add the app to the home screen first (Share → Add to Home Screen), then open it from there.')
</script>

<template>
  <v-card>
    <v-card-item>
      <template #prepend>
        <v-icon color="primary" :icon="mdiBellOutline" />
      </template>
      <v-card-title>Notifications</v-card-title>
      <v-card-subtitle>When an equipment is due for a service</v-card-subtitle>
    </v-card-item>
    <v-card-text>
      <v-alert
        v-if="error"
        class="mb-3"
        density="compact"
        type="error"
        variant="tonal"
      >{{ error }}</v-alert>
      <v-alert
        v-if="info"
        class="mb-3"
        density="compact"
        type="success"
        variant="tonal"
      >{{ info }}</v-alert>

      <div v-if="support !== 'supported'" class="text-body-2 text-medium-emphasis mb-3">{{ unsupportedText }}</div>
      <div v-else class="d-flex align-center flex-wrap ga-3 mb-3">
        <v-switch
          color="primary"
          density="compact"
          hide-details
          inset
          label="Notify this browser"
          :loading="busy"
          :model-value="subscribed"
          @update:model-value="toggle"
        />
        <v-btn
          :disabled="busy || pushStore.subscriptions.length === 0"
          size="small"
          variant="tonal"
          @click="test"
        >Send a test</v-btn>
      </div>

      <div class="text-body-2 text-medium-emphasis">
        Set the service interval of an equipment on its page: you are notified once it is past it, once per
        service.
      </div>

      <v-list v-if="pushStore.subscriptions.length > 0" class="mt-2" density="compact">
        <v-list-subheader>Subscribed browsers</v-list-subheader>
        <v-list-item
          v-for="subscription in pushStore.subscriptions"
          :key="subscription.id"
          :subtitle="`since ${since(subscription.created_at)}`"
          :title="(subscription.name || 'Browser') + (subscription.id === thisId ? ' (this one)' : '')"
        >
          <template #append>
            <v-btn
              density="comfortable"
              :disabled="busy"
              :icon="mdiDeleteOutline"
              size="small"
              title="Stop notifying this browser"
              variant="text"
              @click="remove(subscription.id)"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>
