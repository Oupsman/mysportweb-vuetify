<script setup lang="ts">
  import { defineProps, ref } from 'vue'
  import 'leaflet/dist/leaflet.css'
  import StartIcon from '@/assets/start.svg'
  import StopIcon from '@/assets/stop.svg'
  import type { Point } from '@/types/activities'
  import { LatLngExpression, LatLngTuple, Map as LeafletMap, PointTuple } from 'leaflet'

  import {
    LControlScale,
    LIcon,
    LMap,
    LMarker,
    LPolyline,
    LTileLayer,
  } from '@vue-leaflet/vue-leaflet'

  const props = defineProps({
    activity: {
      type: Object,
      required: true,
    },
  })
  const showMap = ref(false)
  const gpsMap = ref()
  const zoom = ref(9)
  const leafletReady = ref<boolean>(false)
  const leafletObject = ref({} as LeafletMap)
  // const gpsBounds = ref([])
  const markers = ref([])
  const publicActivity = ref(true)
  // iterate over activitiesStore.activity.gps_points to create an 2 dimensions array of Float wanted by leaflet
  let transformedPoints: LatLngExpression[]
  if (props.activity.gps_points !== null) {
    transformedPoints = props.activity.gps_points.map((point: Point) => [point.lat, point.lon])
    publicActivity.value = false
    const pointsNumbers = props.activity.gps_points.length
    markers.value = [
      {
        name: 'start',
        coords: [props.activity.gps_points[0].lat, props.activity.gps_points[0].lon],
        icon: StartIcon,
      },
      {
        name: 'stop',
        coords: [props.activity.gps_points[pointsNumbers - 1].lat, props.activity.gps_points[pointsNumbers - 1].lon],
        icon: StopIcon,
      },
    ]
  }
  const publicPoints: LatLngExpression[] = props.activity.public_gps_points.map((point: Point) => [point.lat, point.lon])
  const gpsCenter: PointTuple = [props.activity.gps_center.lat, props.activity.gps_center.lon]
  const gpsBounds: LatLngExpression[] = props.activity.gps_bounds.map((point: Point) => [point.lat, point.lon])

  const mapIsReady = async () => {
    showMap.value = true
    await nextTick()
    leafletObject.value = gpsMap.value.leafletObject

    if (leafletObject.value !== undefined && leafletObject.value !== null) {
      // set default map view port
      leafletObject.value.zoomControl.setPosition('topright')
      leafletReady.value = true

      await nextTick()

      if (gpsBounds.length > 0) {
        try {
          leafletObject.value.fitBounds(gpsBounds.map((b: LatLngExpression): LatLngTuple => {
            if (Array.isArray(b)) {
              return [b[0], b[1]]
            } else if (typeof b === 'object' && 'lat' in b && 'lng' in b) {
              return [b.lat, b.lng]
            }
            throw new Error('Invalid LatLngExpression')
          }))
        } catch (err) {
          console.log(err, `Invalid bounds array: ${gpsBounds}`)
        }
      }
    }
    console.log('Map is ready')
  }
  const handleMapError = (error: any) => {
    console.error('Error loading map:', error)
  }
</script>

<template>
  <div style="height: 400px; width: 100%;">
    <l-map
      ref="gpsMap"
      v-model="zoom"
      :center="gpsCenter"
      :use-global-leaflet="false"
      :zoom-animation="true"
      @error="handleMapError"
      @ready="mapIsReady"
    >
      <template v-if="leafletReady">
        <LControlScale
          position="bottomright"
        />
        <l-tile-layer
          layer-type="base"
          name="OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <l-polyline
          v-if="!publicActivity"
          color="red"
          :lat-lngs="transformedPoints"
        />
        <LPolyline
          color="blue"
          :lat-lngs="publicPoints"
        />
        <LMarker
          v-for="marker in markers"
          :key="marker.name"
          :lat-lng="marker.coords"
        >
          <LIcon :icon-size="[30, 30]" :icon-url="marker.icon" />
        </LMarker>
      </template>
    </l-map>
  </div>
</template>

<style scoped lang="css">

    </style>
