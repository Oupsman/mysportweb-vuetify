<script setup lang="ts">
  import { computed, defineProps, inject, ref } from 'vue'
  import 'leaflet/dist/leaflet.css'
  import StartIcon from '@/assets/start.svg'
  import StopIcon from '@/assets/stop.svg'
  import type { Point } from '@/types/activities'
  import { activityCursorKey, nearestIndex } from '@/composables/activityCursor'
  import { LatLngExpression, LatLngTuple, Map as LeafletMap, PointTuple } from 'leaflet'

  import {
    LCircleMarker,
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
  // position at the time hovered on the charts. Only for the owner: other users get neither the
  // full trace nor its time stamps
  const cursor = inject(activityCursorKey, ref(null))
  const gpsPoints: Point[] = props.activity.gps_points ?? []
  const gpsStamps: number[] = props.activity.gps_time_stamps ?? []
  const activityStart = new Date(props.activity.date).getTime()
  const cursorPosition = computed((): LatLngTuple | null => {
    if (cursor.value === null || gpsStamps.length !== gpsPoints.length) {
      return null
    }
    const offset = (cursor.value - activityStart) / 1000
    const index = nearestIndex(gpsStamps, offset, s => s)
    // no position when there is no GPS fix around this time
    if (index < 0 || Math.abs(gpsStamps[index] - offset) > 60) {
      return null
    }
    return [gpsPoints[index].lat, gpsPoints[index].lon]
  })

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
        <LCircleMarker
          v-if="cursorPosition"
          color="white"
          fill-color="#257800"
          :fill-opacity="1"
          :lat-lng="cursorPosition"
          :radius="7"
          :weight="2"
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
