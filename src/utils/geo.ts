import type { Point } from '@/types/activities'

const earthRadius = 6371000

// the distance between two points, meters
export const haversine = (a: Point, b: Point): number => {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * earthRadius * Math.asin(Math.sqrt(h))
}

// the distance from the first point to each point of a trace, meters
export const cumulativeDistances = (points: Point[]): number[] => {
  const distances = [0]
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + haversine(points[i - 1], points[i]))
  }
  return distances
}

// the index of the point whose distance is the closest to a distance, in increasing distances
export const indexAtDistance = (distances: number[], distance: number): number => {
  let low = 0
  let high = distances.length - 1
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (distances[middle] < distance) {
      low = middle + 1
    } else {
      high = middle
    }
  }
  if (low > 0 && distance - distances[low - 1] < distances[low] - distance) {
    return low - 1
  }
  return low
}
