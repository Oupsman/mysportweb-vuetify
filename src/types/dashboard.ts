import { Activity } from '@/types/activities'

export interface Dashboard {
  activities: Activity[],
  activities_calendar: Activity[],
  total_duration: number,
  total_distance: number,
  nb_activities: number,
  nb_equipments: number,
}
