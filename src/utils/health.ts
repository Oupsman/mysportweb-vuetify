import type { HealthData, HealthValue } from '@/types/health'

export interface HealthMetric {
  key: string
  title: string
  unit: string
  decimals: number
  // the series of the chart, sharing the unit: blood pressure has two
  values: { field: HealthValue, label: string }[]
  // a decrease is good news (weight, fat, resting heart rate, blood pressure); undefined: neutral
  lowerIsBetter?: boolean
}

export const healthMetrics: HealthMetric[] = [
  { key: 'weight', title: 'Weight', unit: 'kg', decimals: 1, values: [{ field: 'weight', label: 'Weight' }] },
  { key: 'fat', title: 'Body fat', unit: '%', decimals: 1, values: [{ field: 'fat', label: 'Body fat' }], lowerIsBetter: true },
  { key: 'muscle', title: 'Muscle', unit: '%', decimals: 1, values: [{ field: 'muscle', label: 'Muscle' }] },
  { key: 'water', title: 'Body water', unit: '%', decimals: 1, values: [{ field: 'body_water', label: 'Body water' }] },
  { key: 'bone', title: 'Bone mass', unit: 'kg', decimals: 1, values: [{ field: 'bone', label: 'Bone mass' }] },
  { key: 'rest_hr', title: 'Resting heart rate', unit: 'bpm', decimals: 0, values: [{ field: 'rest_hr', label: 'Resting HR' }], lowerIsBetter: true },
  { key: 'vo2max', title: 'VO2max', unit: 'ml/kg/min', decimals: 0, values: [{ field: 'vo2max', label: 'VO2max' }] },
  {
    key: 'pressure',
    title: 'Blood pressure',
    unit: 'mmHg',
    decimals: 0,
    values: [{ field: 'systolic', label: 'Systolic' }, { field: 'diastolic', label: 'Diastolic' }],
    lowerIsBetter: true,
  },
]

// the metrics with at least one measure
export const measuredMetrics = (datas: HealthData[]): HealthMetric[] =>
  healthMetrics.filter(m => datas.some(d => d[m.values[0].field] > 0))

export const formatHealthValue = (metric: HealthMetric, data: HealthData): string =>
  metric.values.map(v => data[v.field].toLocaleString('fr-FR', {
    minimumFractionDigits: metric.decimals, maximumFractionDigits: metric.decimals,
  })).join('/')

// a measure date is a day saved at midnight UTC: shown in UTC, it is the same day everywhere
export const formatMeasureDate = (date: string): string =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(date))
