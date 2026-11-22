import L from 'leaflet'

// an activity of the heatmap, its trace decoded
export interface HeatTrace {
  id: string
  title: string
  date: string // YYYY-MM-DD
  sport: string
  distance: number // meters
  bounds: [number, number, number, number] // south, west, north, east
  lats: Float64Array
  lons: Float64Array
}

// decodes Google's encoded polyline format, precision 5
export const decodePolyline = (encoded: string): { lats: Float64Array, lons: Float64Array } => {
  const lats: number[] = []
  const lons: number[] = []
  let lat = 0
  let lon = 0
  let i = 0
  while (i < encoded.length) {
    for (let k = 0; k < 2; k++) {
      let result = 0
      let shift = 0
      let b: number
      do {
        b = encoded.charCodeAt(i++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const delta = (result & 1) ? ~(result >> 1) : (result >> 1)
      if (k === 0) lat += delta
      else lon += delta
    }
    lats.push(lat / 1e5)
    lons.push(lon / 1e5)
  }
  return { lats: Float64Array.from(lats), lons: Float64Array.from(lons) }
}

// the color of an intensity (0: no trace, 1: many), from transparent through blue and yellow to white
const ramp = (() => {
  const stops: [number, [number, number, number]][] = [
    [0, [20, 40, 160]], [0.35, [40, 140, 255]], [0.65, [255, 210, 40]], [0.85, [255, 120, 30]], [1, [255, 255, 255]],
  ]
  const lut = new Uint8ClampedArray(256 * 4)
  for (let v = 1; v < 256; v++) {
    const x = v / 255
    let j = 0
    while (j < stops.length - 2 && x > stops[j + 1][0]) j++
    const [x0, c0] = stops[j]
    const [x1, c1] = stops[j + 1]
    const f = Math.min(1, Math.max(0, (x - x0) / (x1 - x0)))
    for (let c = 0; c < 3; c++) lut[v * 4 + c] = c0[c] + f * (c1[c] - c0[c])
    // the faintest traces stay visible
    lut[v * 4 + 3] = Math.min(255, 110 + v * 1.4)
  }
  return lut
})()

// each trace adds this much opacity: n passes give 1 - (1 - a)^n, about saturated after 40
const passAlpha = 0.09

// HeatLayer draws traces on a canvas over the map: each one faintly, the overlaps adding up, then colored
// by intensity. Redrawn after each move or zoom, with the traces out of view skipped.
export const HeatLayer = L.Layer.extend({
  initialize (this: any) {
    this._traces = [] as HeatTrace[]
  },
  setTraces (this: any, traces: HeatTrace[]) {
    this._traces = traces
    if (this._map) this._redraw()
    return this
  },
  onAdd (this: any, map: L.Map) {
    this._map = map
    this._canvas = L.DomUtil.create('canvas', 'heat-layer leaflet-zoom-hide')
    this._canvas.style.pointerEvents = 'none'
    map.getPanes().overlayPane.append(this._canvas)
    map.on('moveend zoomend resize', this._redraw, this)
    this._redraw()
  },
  onRemove (this: any, map: L.Map) {
    map.off('moveend zoomend resize', this._redraw, this)
    this._canvas.remove()
  },
  _redraw (this: any) {
    const map: L.Map = this._map
    const size = map.getSize()
    const canvas: HTMLCanvasElement = this._canvas
    canvas.width = size.x
    canvas.height = size.y
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]))
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx || size.x === 0 || size.y === 0) return
    const view = map.getBounds()
    const zoom = map.getZoom()
    ctx.lineWidth = zoom >= 15 ? 3 : (zoom >= 12 ? 2 : 1.5)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeStyle = `rgba(255,255,255,${passAlpha})`
    for (const t of this._traces as HeatTrace[]) {
      const [s, w, n, e] = t.bounds
      if (n < view.getSouth() || s > view.getNorth() || e < view.getWest() || w > view.getEast()) continue
      ctx.beginPath()
      let lastX = Number.NaN
      let lastY = Number.NaN
      for (let i = 0; i < t.lats.length; i++) {
        const p = map.latLngToContainerPoint([t.lats[i], t.lons[i]])
        // the points closer than a pixel draw nothing more
        if (i > 0 && i < t.lats.length - 1 && Math.abs(p.x - lastX) < 1 && Math.abs(p.y - lastY) < 1) continue
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
        lastX = p.x
        lastY = p.y
      }
      ctx.stroke()
    }
    // the accumulated opacity becomes a color
    const image = ctx.getImageData(0, 0, size.x, size.y)
    const px = image.data
    for (let i = 0; i < px.length; i += 4) {
      const v = px[i + 3]
      if (v === 0) continue
      px[i] = ramp[v * 4]
      px[i + 1] = ramp[v * 4 + 1]
      px[i + 2] = ramp[v * 4 + 2]
      px[i + 3] = ramp[v * 4 + 3]
    }
    ctx.putImageData(image, 0, 0)
  },
})

// the traces passing within pixels of a point of the map, at most max
export const tracesNear = (map: L.Map, traces: HeatTrace[], at: L.LatLng, pixels = 6, max = 15): HeatTrace[] => {
  const target = map.latLngToContainerPoint(at)
  const found: HeatTrace[] = []
  const margin = map.containerPointToLatLng([target.x + pixels, target.y + pixels])
  const dLat = Math.abs(margin.lat - at.lat)
  const dLon = Math.abs(margin.lng - at.lng)
  for (const t of traces) {
    const [s, w, n, e] = t.bounds
    if (at.lat < s - dLat || at.lat > n + dLat || at.lng < w - dLon || at.lng > e + dLon) continue
    let prev = map.latLngToContainerPoint([t.lats[0], t.lons[0]])
    for (let i = 1; i < t.lats.length; i++) {
      const p = map.latLngToContainerPoint([t.lats[i], t.lons[i]])
      if (L.LineUtil.pointToSegmentDistance(target, prev, p) <= pixels) {
        found.push(t)
        break
      }
      prev = p
    }
    if (found.length >= max) break
  }
  return found
}

// the bounds where most traces are: around the median of their centers, the trips far away left out
export const mainBounds = (traces: HeatTrace[], radiusDegrees = 1.5): L.LatLngBounds | null => {
  if (traces.length === 0) return null
  const median = (values: number[]) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)]
  const centers = traces.map(t => [(t.bounds[0] + t.bounds[2]) / 2, (t.bounds[1] + t.bounds[3]) / 2])
  const mLat = median(centers.map(c => c[0]))
  const mLon = median(centers.map(c => c[1]))
  let bounds: L.LatLngBounds | null = null
  traces.forEach((t, i) => {
    if (Math.abs(centers[i][0] - mLat) > radiusDegrees || Math.abs(centers[i][1] - mLon) > radiusDegrees) return
    const b = L.latLngBounds([t.bounds[0], t.bounds[1]], [t.bounds[2], t.bounds[3]])
    bounds = bounds ? bounds.extend(b) : b
  })
  return bounds
}
