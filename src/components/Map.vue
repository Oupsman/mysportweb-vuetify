<script setup lang="ts">
  import { defineProps, ref } from 'vue'
  import 'leaflet/dist/leaflet.css'
  import StartIcon from '@/assets/start.svg'
  import StopIcon from '@/assets/stop.svg'

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
  const gpsBounds = ref([])
  const markers = ref([])

  // iterate over activitiesStore.activity.gps_points to create an 2 dimensions array of Float wanted by leaflet
  const transformedPoints: number[][] = props.activity.gps_points.map(point => [point.lat, point.lon])
  const gpsCenter: number[] = [props.activity.gps_center.lat, props.activity.gps_center.lon]
  gpsBounds.value = props.activity.gps_bounds.map(point => [point.lat, point.lon])
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
  console.log(markers.value)
  const mapIsReady = async () => {
    showMap.value = true
    await nextTick()
    leafletObject.value = gpsMap.value.leafletObject

    if (leafletObject.value !== undefined && leafletObject.value !== null) {
      // set default map view port
      leafletObject.value.zoomControl.setPosition('topright')
      leafletReady.value = true

      await nextTick()

      if (gpsBounds.value.length > 0) {
        try {
          leafletObject.value.fitBounds(gpsBounds.value.map(b => [b[0], b[1]] as LatLngTuple))
        } catch (err) {
          console.log(err, `Invalid bounds array: ${gpsBounds.value}`)
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
      :useGlobalLeaflet="false"
      @ready="mapIsReady"
      @error="handleMapError"
      :zoomAnimation="true"
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
          color="red"
          :lat-lngs="transformedPoints"
        />
        <LMarker
          v-for="marker in markers"
          :key="marker.name "
          :lat-lng="marker.coords"
        >
          <LIcon :icon-url="marker.icon" />
        </LMarker>
      </template>
    </l-map>
  </div>
</template>

<style scoped lang="css">

    </style>
