import type { WidgetLayout } from '@/types/dashboard'

// the widgets of the dashboard, in their default order: their default width (columns out of 12 on large
// screens) and height (0: fits the content), the narrowest they can be
export interface WidgetDef {
  id: string
  title: string
  description: string
  w: number
  h: number
  minW: number
}

export const widgetDefs: WidgetDef[] = [
  { id: 'total-distance', title: 'Distance', description: 'This week, month, year and all time', w: 3, h: 0, minW: 2 },
  { id: 'total-duration', title: 'Time', description: 'This week, month, year and all time', w: 3, h: 0, minW: 2 },
  { id: 'total-elevation', title: 'Elevation', description: 'This week, month, year and all time', w: 3, h: 0, minW: 2 },
  { id: 'total-activities', title: 'Activities', description: 'This week, month, year and all time', w: 3, h: 0, minW: 2 },
  { id: 'highlights', title: 'Highlights', description: 'New bests and goals completed of the last 30 days', w: 6, h: 0, minW: 3 },
  { id: 'goals', title: 'Goals', description: 'The progress of your training goals', w: 12, h: 0, minW: 3 },
  { id: 'maintenance', title: 'Maintenance', description: 'The reminders due or soon on your equipment', w: 12, h: 0, minW: 3 },
  { id: 'weekly-volume', title: 'Weekly volume', description: 'Distance or time of the last weeks, by sport', w: 8, h: 0, minW: 4 },
  { id: 'calendar', title: 'Calendar', description: 'Your activities of the month', w: 4, h: 0, minW: 3 },
  { id: 'hr-zones', title: 'Heart rate zones', description: 'Time in zones of the last weeks', w: 8, h: 0, minW: 4 },
  { id: 'readiness', title: 'Readiness', description: 'Fitness, fatigue and form', w: 4, h: 0, minW: 3 },
  { id: 'power-zones', title: 'Power zones', description: 'Time in zones of the rides with a power meter', w: 8, h: 0, minW: 4 },
  { id: 'co2', title: 'CO₂ saved', description: 'Commutes instead of driving', w: 4, h: 0, minW: 3 },
  { id: 'recent', title: 'Recent activities', description: 'Your last activities', w: 8, h: 0, minW: 4 },
  { id: 'sports', title: 'By sport', description: 'Totals and records of each sport', w: 4, h: 0, minW: 3 },
]

export const widgetDef = new Map(widgetDefs.map(d => [d.id, d]))

// heights: snapped to this step, from the minimum
export const heightStep = 10
export const minHeight = 120
export const maxHeight = 2000

export const defaultLayout = (): WidgetLayout[] => widgetDefs.map(d => ({ id: d.id, w: d.w, h: d.h, hidden: false }))

const clamp = (x: number, min: number, max: number) => Math.min(Math.max(Math.round(x), min), max)

// the saved layout with what the application knows: the widgets gone dropped, the new ones added at the
// end, the sizes kept in bounds. null: the default layout.
export const mergeLayout = (saved: WidgetLayout[] | null): WidgetLayout[] => {
  if (!saved) {
    return defaultLayout()
  }
  const layout: WidgetLayout[] = []
  const seen = new Set<string>()
  for (const widget of saved) {
    const def = widgetDef.get(widget.id)
    if (!def || seen.has(widget.id)) {
      continue
    }
    seen.add(widget.id)
    layout.push({
      id: widget.id,
      w: clamp(widget.w, def.minW, 12),
      h: widget.h > 0 ? clamp(widget.h, minHeight, maxHeight) : 0,
      hidden: !!widget.hidden,
    })
  }
  for (const def of widgetDefs) {
    if (!seen.has(def.id)) {
      layout.push({ id: def.id, w: def.w, h: def.h, hidden: false })
    }
  }
  return layout
}

export const sameLayout = (a: WidgetLayout[], b: WidgetLayout[]): boolean =>
  a.length === b.length && a.every((w, i) =>
    w.id === b[i].id && w.w === b[i].w && w.h === b[i].h && w.hidden === b[i].hidden)
