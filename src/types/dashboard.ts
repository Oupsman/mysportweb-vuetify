import type { ActivityCalendar, ActivitySummary } from '@/types/activities'

export interface Dashboard {
  activities: ActivitySummary[],
  activities_calendar: ActivityCalendar[] | null,
  total_duration: string,
  total_distance: number,
  nb_activities: number,
  nb_equipments: number,
  max_distance: number,
  max_duration: number,
  max_elevation: number,
}
