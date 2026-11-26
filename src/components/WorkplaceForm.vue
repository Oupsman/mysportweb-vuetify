<script setup lang="ts">
  import { computed, nextTick, ref } from 'vue'
  import 'leaflet/dist/leaflet.css'
  import type { LatLngTuple, Map as LeafletMap, LeafletMouseEvent } from 'leaflet'
  import { LCircle, LCircleMarker, LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'
  import { mdiCrosshairsGps } from '@mdi/js'
  import { useWorkplacesStore } from '@/stores/workplaces'
  import {
    WORKPLACE_DEFAULT_DIAMETER,
    WORKPLACE_MAX_DIAMETER,
    WORKPLACE_MIN_DIAMETER,
  } from '@/types/workplaces'
  import type { Workplace } from '@/types/workplaces'

  // the workplace to edit, none to create one; the other workplaces of the user give the map its start
  const props = defineProps<{ workplace: Workplace | null }>()
  const emit = defineEmits<{ saved: [workplace: Workplace, created: boolean], cancel: [] }>()

  const workplacesStore = useWorkplacesStore()
  const name = ref(props.workplace?.name ?? '')
  const center = ref<LatLngTuple | null>(props.workplace ? [props.workplace.lat, props.workplace.lon] : null)
  const diameter = ref(props.workplace?.diameter ?? WORKPLACE_DEFAULT_DIAMETER)

  // the view: the workplace, else another one of the user, else France until the user's position is known
  const other = workplacesStore.workplaces.find(w => w.id !== props.workplace?.id)
  const start: LatLngTuple = center.value ?? (other ? [other.lat, other.lon] : [46.6, 2.5])
  const startZoom = center.value || other ? 15 : 5

  const map = ref()
  let leaflet: LeafletMap | null = null
  const ready = async () => {
    await nextTick()
    leaflet = map.value?.leafletObject ?? null
    // opened in a dialog: the map was measured before the dialog had its size
    setTimeout(() => leaflet?.invalidateSize(), 250)
  }

  const place = (e: LeafletMouseEvent) => {
    center.value = [e.latlng.lat, e.latlng.lng]
  }

  const locating = ref(false)
  const locateError = ref('')
  const locate = () => {
    if (!navigator.geolocation) {
      locateError.value = 'Your browser doesn\'t give its position'
      return
    }
    locating.value = true
    locateError.value = ''
    navigator.geolocation.getCurrentPosition(position => {
      locating.value = false
      center.value = [position.coords.latitude, position.coords.longitude]
      leaflet?.setView(center.value, 16)
    }, error => {
      locating.value = false
      locateError.value = error.message || 'Your position is unknown'
    }, { enableHighAccuracy: true, timeout: 15_000 })
  }

  const diameterLabel = computed(() => diameter.value >= 1000
    ? `${(diameter.value / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} km`
    : `${diameter.value} m`)

  const saving = ref(false)
  const error = ref('')
  const save = async () => {
    if (!center.value) {
      return
    }
    saving.value = true
    error.value = ''
    try {
      const saved = await workplacesStore.save({
        name: name.value.trim(),
        lat: center.value[0],
        lon: center.value[1],
        diameter: diameter.value,
      }, props.workplace?.id)
      emit('saved', saved, !props.workplace)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      saving.value = false
    }
  }
</script>

<template>
  <v-card>
    <v-card-title>{{ workplace ? 'Edit the workplace' : 'New workplace' }}</v-card-title>
    <v-card-text>
      <v-alert v-if="error" class="mb-4" type="error">{{ error }}</v-alert>
      <v-text-field
        v-model="name"
        counter="100"
        label="Name"
        maxlength="100"
        placeholder="Office"
      />
      <div class="d-flex align-center mb-2">
        <span class="text-body-2 text-medium-emphasis">
          {{ center ? 'Click on the map to move it.' : 'Click on the map where you work.' }}
        </span>
        <v-spacer />
        <v-btn
          :loading="locating"
          :prepend-icon="mdiCrosshairsGps"
          size="small"
          variant="text"
          @click="locate"
        >My position</v-btn>
      </div>
      <v-alert
        v-if="locateError"
        class="mb-2"
        density="compact"
        type="warning"
        variant="tonal"
      >
        {{ locateError }}
      </v-alert>
      <div class="workplace-map">
        <LMap
          ref="map"
          :center="start"
          :use-global-leaflet="false"
          :zoom="startZoom"
          @click="place"
          @ready="ready"
        >
          <LTileLayer layer-type="base" name="OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <template v-if="center">
            <LCircle
              color="#1976d2"
              :fill-opacity="0.15"
              :lat-lng="center"
              :radius="diameter / 2"
              :weight="2"
            />
            <LCircleMarker
              color="#1976d2"
              :fill-opacity="1"
              :lat-lng="center"
              :radius="5"
            />
          </template>
        </LMap>
      </div>
      <v-slider
        v-model="diameter"
        class="mt-4"
        hide-details
        :label="`Diameter: ${diameterLabel}`"
        :max="WORKPLACE_MAX_DIAMETER"
        :min="WORKPLACE_MIN_DIAMETER"
        :step="25"
      />
      <div class="text-caption text-medium-emphasis mt-2">
        The activities you import that start or end in the circle are commutes.
      </div>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn @click="emit('cancel')">Cancel</v-btn>
      <v-btn color="primary" :disabled="!center" :loading="saving" @click="save">Save</v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.workplace-map {
  height: 360px;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
}
</style>
