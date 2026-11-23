// The comparison of two activities on the same route: their series at the same distances from their start,
// and the time gap between them along the way. Nothing here imports the rest of the application.

// what the comparison reads of an activity (the fields of /activity/:id)
export interface ComparedActivity {
  time_stamps: (string | number)[] | null // seconds since the start of each record
  dist_array: number[] | null // meters at each record
  speeds?: number[] | null // m/s at each record
  altitudes?: number[] | null // meters at each record
  hearts?: number[] | null
  heart_time_stamps?: number[] | null // their own time stamps, the records' ones when empty
  powers?: number[] | null
  power_ts?: (string | number)[] | null
}

// a series as a function of a variable: xs ascending
interface Curve {
  xs: number[]
  ys: number[]
}

// the series of the comparison, at the same distances; null where an activity has no such series
export interface Comparison {
  distances: number[] // km, from 0 to the shorter of the two
  gap: number[] // seconds: positive when the second activity is behind the first one
  timeA: number[]
  timeB: number[]
  speedA: number[] | null // km/h
  speedB: number[] | null
  hrA: number[] | null
  hrB: number[] | null
  powerA: number[] | null
  powerB: number[] | null
  altitude: number[] | null // of the first activity, meters
}

const numbers = (values?: (string | number)[] | null): number[] => (values ?? []).map(Number)

// the value of a curve at x, linear between its points, its ends beyond; NaN without points
export const interpolate = (curve: Curve, x: number): number => {
  const { xs, ys } = curve
  if (xs.length === 0) return Number.NaN
  if (x <= xs[0]) return ys[0]
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1]
  let lo = 0
  let hi = xs.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (xs[mid] <= x) lo = mid
    else hi = mid
  }
  const span = xs[hi] - xs[lo]
  return span > 0 ? ys[lo] + (ys[hi] - ys[lo]) * (x - xs[lo]) / span : ys[lo]
}

// a curve from xs and ys of the same length, keeping the points where xs grows (a pause repeats the
// distance: its first point is kept, the time it reached it) and both are numbers
const curve = (xs: number[], ys: number[]): Curve => {
  const result: Curve = { xs: [], ys: [] }
  const n = Math.min(xs.length, ys.length)
  for (let i = 0; i < n; i++) {
    const x = xs[i]
    const y = ys[i]
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    if (result.xs.length > 0 && x <= result.xs[result.xs.length - 1]) continue
    result.xs.push(x)
    result.ys.push(y)
  }
  return result
}

// the time at each distance, and a series sampled at times (its own time stamps) at each distance
const timeByDistance = (a: ComparedActivity): Curve => curve(a.dist_array ?? [], numbers(a.time_stamps))

const byTime = (values?: number[] | null, stamps?: (string | number)[] | null): Curve | null => {
  const ys = values ?? []
  const xs = numbers(stamps)
  return ys.length > 0 && ys.length === xs.length ? curve(xs, ys) : null
}

// at least two points to tell a distance from another
const usable = (c: Curve | null): c is Curve => c !== null && c.xs.length > 1

// compares b with a over the distance both covered, every step meters (or more, to keep at most maxPoints).
// null when one of them has no distances.
export const compareActivities = (a: ComparedActivity, b: ComparedActivity, step = 10, maxPoints = 3000): Comparison | null => {
  const timeA = timeByDistance(a)
  const timeB = timeByDistance(b)
  if (!usable(timeA) || !usable(timeB)) return null
  const end = Math.min(timeA.xs[timeA.xs.length - 1], timeB.xs[timeB.xs.length - 1])
  if (end <= 0) return null
  const every = Math.max(step, end / maxPoints)
  const meters: number[] = []
  for (let d = 0; d <= end; d += every) meters.push(d)

  const tA = meters.map(d => interpolate(timeA, d))
  const tB = meters.map(d => interpolate(timeB, d))
  // a series by time, read at the time each activity reached each distance
  const along = (c: Curve | null, times: number[], scale = 1): number[] | null =>
    usable(c) ? times.map(t => interpolate(c, t) * scale) : null
  const recordStamps = (x: ComparedActivity) => numbers(x.time_stamps)
  const hrStamps = (x: ComparedActivity) => (x.heart_time_stamps?.length ? x.heart_time_stamps : recordStamps(x))

  return {
    distances: meters.map(d => d / 1000),
    gap: meters.map((_, i) => tB[i] - tA[i]),
    timeA: tA,
    timeB: tB,
    speedA: along(byTime(a.speeds, a.time_stamps), tA, 3.6),
    speedB: along(byTime(b.speeds, b.time_stamps), tB, 3.6),
    hrA: along(byTime(a.hearts, hrStamps(a)), tA),
    hrB: along(byTime(b.hearts, hrStamps(b)), tB),
    powerA: along(byTime(a.powers, a.power_ts), tA),
    powerB: along(byTime(b.powers, b.power_ts), tB),
    altitude: along(byTime(a.altitudes, a.time_stamps), tA),
  }
}
