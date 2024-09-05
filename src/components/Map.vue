<script setup lang="ts">
  import { LMap, LPolyline, LTileLayer } from '@vue-leaflet/vue-leaflet'
  import { useActivitiesStore } from '@/stores/activities'
  const activitiesStore = useActivitiesStore()

  // iterate over activitiesStore.activity.gps_points to create an 2 dimensionals array of Float wanted by leaflet
  onMounted(() => {
    const transformedPoints: number[][] = activitiesStore.activity?.gps_points.map(point => [point.lat, point.lon])
  })
</script>

<template>
  <l-map
    v-if="activitiesStore.activity !== undefined"
    ref="map"
    v-model:zoom="zoom"
    :center="activitiesStore.activity?.gps_center"
    :useGlobalLeaflet="false"
  >
    <l-tile-layer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      layer-type="base"
      name="OpenStreetMap"
    />
    <l-polyline
      color="green"
      :lat-lngs="transformedPoints"
      />
    </l-map>
</template>

<style scoped lang="sass">

</style>
