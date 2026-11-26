import type { WidgetLayout } from '@/types/dashboard'
import { bottom, columns, flow } from '@/utils/gridLayout'

// the grid of the dashboard on large screens: rows of rowHeight pixels, gap pixels between the rows and the
// columns
export const rowHeight = 32
export const gap = 8
export const maxRows = 100

// the widgets of the dashboard: the order of the widgets menu, their place in the default layout (column x,
// row y, w columns wide, h rows high), the smallest they can be
export interface WidgetDef {
  id: string
  title: string
  description: string
  x: number
  y: number
  w: number
  h: number
  minW: number
  minH: number
}

export const widgetDefs: WidgetDef[] = [
  { id: 'total-distance', title: 'Distance', description: 'This week, month, year and all time', x: 0, y: 0, w: 3, h: 6, minW: 2, minH: 4 },
  { id: 'total-duration', title: 'Time', description: 'This week, month, year and all time', x: 3, y: 0, w: 3, h: 6, minW: 2, minH: 4 },
  { id: 'total-elevation', title: 'Elevation', description: 'This week, month, year and all time', x: 6, y: 0, w: 3, h: 6, minW: 2, minH: 4 },
  { id: 'total-activities', title: 'Activities', description: 'This week, month, year and all time', x: 9, y: 0, w: 3, h: 6, minW: 2, minH: 4 },
  { id: 'highlights', title: 'Highlights', description: 'New bests and goals completed of the last 30 days', x: 0, y: 6, w: 6, h: 8, minW: 3, minH: 4 },
  { id: 'goals', title: 'Goals', description: 'The progress of your training goals', x: 6, y: 6, w: 6, h: 8, minW: 3, minH: 4 },
  { id: 'maintenance', title: 'Maintenance', description: 'The reminders due or soon on your equipment', x: 0, y: 14, w: 12, h: 6, minW: 3, minH: 4 },
  { id: 'weekly-volume', title: 'Weekly volume', description: 'Distance or time of the last weeks, by sport', x: 0, y: 20, w: 8, h: 11, minW: 4, minH: 6 },
  { id: 'calendar', title: 'Calendar', description: 'Your activities of the month', x: 8, y: 20, w: 4, h: 11, minW: 3, minH: 6 },
  // beside the two zones charts, as high as both
  { id: 'hr-zones', title: 'Heart rate zones', description: 'Time in zones of the last weeks', x: 0, y: 31, w: 8, h: 10, minW: 4, minH: 6 },
  { id: 'readiness', title: 'Readiness', description: 'Fitness, fatigue and form', x: 8, y: 31, w: 4, h: 20, minW: 3, minH: 8 },
  { id: 'power-zones', title: 'Power zones', description: 'Time in zones of the rides with a power meter', x: 0, y: 41, w: 8, h: 10, minW: 4, minH: 6 },
  { id: 'recent', title: 'Recent activities', description: 'Your last activities', x: 0, y: 51, w: 8, h: 15, minW: 4, minH: 4 },
  { id: 'co2', title: 'CO₂ saved', description: 'Commutes instead of driving', x: 8, y: 51, w: 4, h: 6, minW: 3, minH: 4 },
  { id: 'sports', title: 'By sport', description: 'Totals and records of each sport', x: 8, y: 57, w: 4, h: 9, minW: 3, minH: 4 },
]

export const widgetDef = new Map(widgetDefs.map(d => [d.id, d]))

export const defaultLayout = (): WidgetLayout[] =>
  widgetDefs.map(d => ({ id: d.id, x: d.x, y: d.y, w: d.w, h: d.h, hidden: false }))

const clamp = (x: number, min: number, max: number) => Math.min(Math.max(Math.round(x), min), max)

// the rows of a height in pixels of a layout saved before the grid
const rowsOf = (pixels: number) => Math.round((pixels + gap) / (rowHeight + gap))

// the saved layout with what the application knows: the widgets gone dropped, the new ones added below the
// others, the sizes and places kept in the grid. A layout saved before the grid (an order, heights in pixels)
// is laid out in its order. null: the default layout.
export const mergeLayout = (saved: WidgetLayout[] | null): WidgetLayout[] => {
  if (!saved) {
    return defaultLayout()
  }
  const legacy = saved.some(w => typeof w.x !== 'number' || typeof w.y !== 'number')
  const layout: WidgetLayout[] = []
  const seen = new Set<string>()
  for (const widget of saved) {
    const def = widgetDef.get(widget.id)
    if (!def || seen.has(widget.id)) {
      continue
    }
    seen.add(widget.id)
    const w = clamp(widget.w, def.minW, columns)
    const h = legacy ? (widget.h > 0 ? rowsOf(widget.h) : def.h) : widget.h
    layout.push({
      id: widget.id,
      x: legacy ? 0 : clamp(widget.x, 0, columns - w),
      y: legacy ? 0 : clamp(widget.y, 0, maxRows * widgetDefs.length),
      w,
      h: clamp(h, def.minH, maxRows),
      hidden: !!widget.hidden,
    })
  }
  if (legacy) {
    // the ones shown in their order, as the user saw them; the hidden ones below
    const shown = flow(layout.filter(w => !w.hidden))
    let below = bottom(shown)
    for (const widget of layout.filter(w => w.hidden)) {
      widget.y = below
      below += widget.h
    }
  }
  let y = bottom(layout)
  for (const def of widgetDefs) {
    if (!seen.has(def.id)) {
      layout.push({ id: def.id, x: 0, y, w: def.w, h: def.h, hidden: false })
      y += def.h
    }
  }
  return layout
}

export const sameLayout = (a: WidgetLayout[], b: WidgetLayout[]): boolean =>
  a.length === b.length && a.every((w, i) =>
    w.id === b[i].id && w.x === b[i].x && w.y === b[i].y && w.w === b[i].w && w.h === b[i].h &&
    w.hidden === b[i].hidden)
