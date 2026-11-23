import { mdiBullseyeArrow, mdiFlash, mdiMapMarkerPath, mdiTrophy } from '@mdi/js'
import type { Highlight } from '@/types/highlights'
import { effortTarget, formatEffortTime } from '@/utils/efforts'
import { formatGoalValue } from '@/utils/goals'

// how a highlight is shown: an icon, what it is, the value, how much better than the best before
export interface HighlightText {
  icon: string
  color: string
  title: string
  value: string
  gain: string
}

const medals: Record<number, { color: string, text: string }> = {
  1: { color: 'amber-darken-2', text: 'Best' },
  2: { color: 'blue-grey-lighten-1', text: '2nd best' },
  3: { color: 'brown-lighten-1', text: '3rd best' },
}

export const medal = (rank: number) => medals[rank] ?? { color: 'grey', text: `#${rank}` }

export const describeHighlight = (h: Highlight): HighlightText => {
  if (h.kind === 'goal') {
    return {
      icon: mdiBullseyeArrow,
      color: 'primary',
      title: `Goal completed${h.name ? `: ${h.name}` : ''}`,
      value: h.metric ? formatGoalValue(h.metric, h.value) : '',
      gain: h.metric ? `target ${formatGoalValue(h.metric, h.target)}` : '',
    }
  }
  const { color, text } = medal(h.rank)
  if (h.kind === 'segment') {
    return {
      icon: mdiMapMarkerPath,
      color,
      title: `${text} on ${h.name}`,
      value: formatEffortTime(h.value),
      gain: h.previous === null ? '' : gainText(h.previous - h.value, h.rank, 'time'),
    }
  }
  const power = h.effort_kind === 'power'
  return {
    icon: power ? mdiFlash : mdiTrophy,
    color,
    title: `${text} ${power ? 'power over' : ''} ${effortTarget(h.effort_kind ?? 'distance', h.target)}`.replace(/\s+/g, ' '),
    value: power ? `${Math.round(h.value)} W` : formatEffortTime(h.value),
    gain: h.previous === null ? '' : power
      ? gainText(h.value - h.previous, h.rank, 'power')
      : gainText(h.previous - h.value, h.rank, 'time'),
  }
}

// the gain on the best before: "−0:50 on the best", or how far behind it for a 2nd or 3rd
const gainText = (gain: number, rank: number, kind: 'time' | 'power'): string => {
  const amount = kind === 'power' ? `${Math.round(Math.abs(gain))} W` : formatEffortTime(Math.abs(gain))
  if (rank === 1) {
    return kind === 'power' ? `+${amount} on your best` : `−${amount} on your best`
  }
  return kind === 'power' ? `${amount} below your best` : `${amount} behind your best`
}
