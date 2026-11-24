<script setup lang="ts">
  import { computed, defineProps, inject, nextTick, onBeforeUnmount, ref } from 'vue'
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
    // any CSS height: the activity page gives the map the height of the screen
    height: {
      type: String,
      default: '400px',
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
  if (props.activity.gps_points?.length) {
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
  const publicPoints: LatLngExpression[] = (props.activity.public_gps_points ?? []).map((point: Point) => [point.lat, point.lon])
  const gpsCenter: PointTuple = [props.activity.gps_center.lat, props.activity.gps_center.lon]
  const gpsBounds: LatLngExpression[] = (props.activity.gps_bounds ?? []).map((point: Point) => [point.lat, point.lon])

  // Leaflet only measures its container at creation: without this, a resized map shows grey tiles
  const container = ref<HTMLElement>()
  let resizeObserver: ResizeObserver | undefined
  onBeforeUnmount(() => resizeObserver?.disconnect())

  const mapIsReady = async () => {
    showMap.value = true
    await nextTick()
    leafletObject.value = gpsMap.value.leafletObject
    if (container.value && !resizeObserver) {
      resizeObserver = new ResizeObserver(() => leafletObject.value?.invalidateSize?.())
      resizeObserver.observe(container.value)
    }

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
      computeArrows()
      leafletObject.value.on('zoomend', computeArrows)
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

  // chevrons along the trace showing the direction of travel (which way a loop was ridden).
  // Placed in screen pixels, so they stay evenly spaced at every zoom level: recomputed on zoomend
  const ARROW_SPACING = 100 // px between two chevrons
  const ARROW_SMOOTHING = 8 // px before and after the tip used for the direction, against GPS jitter
  const ARROW_WING = 8 // px length of each side of a chevron
  const ARROW_ANGLE = (150 * Math.PI) / 180 // angle of the wings from the direction of travel
  // one polyline per chevron: Leaflet takes nested arrays, vue-leaflet's prop type does not say so
  const arrows = ref<LatLngExpression[]>([])
  const arrowTrace: LatLngExpression[] = publicActivity.value ? publicPoints : transformedPoints!

  const computeArrows = () => {
    const map = leafletObject.value
    if (!map?.project || arrowTrace.length < 2) {
      arrows.value = []
      return
    }
    const zoom = map.getZoom()
    const pixels = arrowTrace.map(p => map.project(p, zoom))
    // cumulative pixel distance at each point
    const distances = [0]
    for (let i = 1; i < pixels.length; i++) {
      distances.push(distances[i - 1] + pixels[i].distanceTo(pixels[i - 1]))
    }
    const total = distances[distances.length - 1]
    // position on the trace at a given distance from the start
    let segment = 1
    const at = (d: number): [number, number] => {
      while (segment < distances.length - 1 && distances[segment] < d) {
        segment++
      }
      while (segment > 1 && distances[segment - 1] > d) {
        segment--
      }
      const a = pixels[segment - 1]
      const b = pixels[segment]
      const length = distances[segment] - distances[segment - 1]
      const t = length > 0 ? (d - distances[segment - 1]) / length : 0
      return [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t]
    }
    const result: LatLngTuple[][] = []
    // the first one half a spacing from the start and none in the last half spacing: not on the markers
    for (let d = ARROW_SPACING / 2; d <= total - ARROW_SPACING / 2; d += ARROW_SPACING) {
      const before = at(d - ARROW_SMOOTHING)
      const after = at(d + ARROW_SMOOTHING)
      const tip = at(d)
      if (before[0] === after[0] && before[1] === after[1]) {
        continue
      }
      const direction = Math.atan2(after[1] - before[1], after[0] - before[0])
      const wing = (angle: number): LatLngTuple => {
        const latLng = map.unproject(
          [tip[0] + ARROW_WING * Math.cos(direction + angle), tip[1] + ARROW_WING * Math.sin(direction + angle)],
          zoom,
        )
        return [latLng.lat, latLng.lng]
      }
      const tipLatLng = map.unproject(tip, zoom)
      result.push([wing(ARROW_ANGLE), [tipLatLng.lat, tipLatLng.lng], wing(-ARROW_ANGLE)])
    }
    arrows.value = result as unknown as LatLngExpression[]
  }
  onBeforeUnmount(() => leafletObject.value?.off?.('zoomend', computeArrows))

  const handleMapError = (error: any) => {
    console.error('Error loading map:', error)
  }
</script>

<template>
  <div ref="container" :style="{ height, width: '100%' }">
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
        <LPolyline
          color="#5a0000"
          :interactive="false"
          :lat-lngs="arrows"
          :weight="3"
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
