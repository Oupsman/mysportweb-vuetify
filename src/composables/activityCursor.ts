import type { InjectionKey, Ref } from 'vue'

// time (ms since epoch) hovered on one of the activity charts, null when none is hovered;
// provided by ActivityView, the charts and the map follow it
export const activityCursorKey: InjectionKey<Ref<number | null>> = Symbol('activityCursor')

// index of the value closest to target in an increasing array, -1 when the array is empty
export function nearestIndex<T> (sorted: T[], target: number, value: (item: T) => number): number {
  if (sorted.length === 0) {
    return -1
  }
  let low = 0
  let high = sorted.length - 1
  while (low < high) {
    const middle = (low + high) >> 1
    if (value(sorted[middle]) < target) {
      low = middle + 1
    } else {
      high = middle
    }
  }
  if (low > 0 && target - value(sorted[low - 1]) < value(sorted[low]) - target) {
    return low - 1
  }
  return low
}
