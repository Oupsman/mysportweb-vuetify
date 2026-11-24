// the time and the speed the activities compare on: while moving, the stops left out whether their device
// paused at them or not; the timer's for an activity whose moving time isn't known
interface Timed {
  duration: number
  avg_speed: number
  moving_time?: number | null
  avg_moving_speed?: number | null
}

const known = (a: Timed) => (a.moving_time ?? 0) > 0 && (a.avg_moving_speed ?? 0) > 0

export const comparableTime = (a: Timed): number => known(a) ? Math.round(a.moving_time!) : a.duration

export const comparableSpeed = (a: Timed): number => known(a) ? a.avg_moving_speed! : a.avg_speed
