<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue'
  import 'leaflet/dist/leaflet.css'
  import type { LatLngTuple, Map as LeafletMap, PointTuple } from 'leaflet'
  import { LMap, LPolyline, LTileLayer } from '@vue-leaflet/vue-leaflet'
  import type { Point } from '@/types/activities'

  // the whole trace in grey, the highlighted stretch in color; the view on the stretch
  const props = withDefaults(defineProps<{ trace: Point[], highlight?: Point[], height?: string }>(), {
    highlight: () => [],
    height: '320px',
  })

  const toLatLngs = (points: Point[]): LatLngTuple[] => points.map(p => [p.lat, p.lon])
  const traceLatLngs = computed(() => toLatLngs(props.trace))
  const highlightLatLngs = computed(() => toLatLngs(props.highlight))

  // the start of the view, until it fits the stretch
  const center = computed((): PointTuple => {
    const first = props.highlight[0] ?? props.trace[0]
    return first ? [first.lat, first.lon] : [45, 5]
  })

  const map = ref()
  let leaflet: LeafletMap | null = null
  const fit = () => {
    const points = highlightLatLngs.value.length > 1 ? highlightLatLngs.value : traceLatLngs.value
    if (leaflet && points.length > 1) {
      leaflet.fitBounds(points, { padding: [20, 20], maxZoom: 17 })
    }
  }
  const ready = async () => {
    await nextTick()
    leaflet = map.value?.leafletObject ?? null
    fit()
  }
  // the view follows the stretch only when it is set from elsewhere (the slider, released): not at each move
  defineExpose({ fit })
  watch(() => props.trace, fit)
</script>

<template>
  <div class="segment-map" :style="{ height }">
    <LMap
      ref="map"
      :center="center"
      :options="{ zoomSnap: 0.5 }"
      :use-global-leaflet="false"
      :zoom="13"
      @ready="ready"
    >
      <LTileLayer layer-type="base" name="OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LPolyline v-if="traceLatLngs.length > 1" color="#9e9e9e" :lat-lngs="traceLatLngs" :weight="3" />
      <LPolyline v-if="highlightLatLngs.length > 1" color="#e65100" :lat-lngs="highlightLatLngs" :weight="5" />
    </LMap>
  </div>
</template>

<style scoped>
.segment-map {
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
}
</style>
