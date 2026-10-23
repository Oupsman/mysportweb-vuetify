// a measure, 0 for the values not measured
export interface HealthDataFields {
  date: string; // the day, at midnight UTC
  weight: number; // kg
  fat: number; // %
  muscle: number; // %
  bone: number; // kg
  body_water: number; // %
  rest_hr: number; // bpm
  vo2max: number; // ml/kg/min
  systolic: number; // mmHg
  diastolic: number; // mmHg
}

export interface HealthData extends HealthDataFields {
  id: number;
}

// what the charts and the summary show
export type HealthValue = Exclude<keyof HealthDataFields, 'date'>

// when the target weight is reached at the pace of the recent measures (computed by the backend)
export interface WeightEstimate {
  status: 'no_target' | 'not_enough_data' | 'reached' | 'on_track' | 'wrong_direction' | 'too_slow'
  target: number // kg, 0 without target
  current: number // the weight of the trend today, kg
  per_week: number // kg per week, negative when losing
  date: string | null // only on track
  measures: number // the weight measures of the last 60 days
}
