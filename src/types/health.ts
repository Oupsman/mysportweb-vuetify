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
