<script setup lang="ts">
  import { computed, inject, onMounted, ref } from 'vue'
  import { mdiTrophy } from '@mdi/js'
  import { activityCursorKey } from '@/composables/activityCursor'
  import { useTrainingStore } from '@/stores/training'
  import type { BestEffort } from '@/types/records'
  import { effortKey, effortSpeed, effortTarget, effortValue, formatEffortTime, rankColor } from '@/utils/efforts'
  import { sportLabel } from '@/utils/format'

  // owner: the ranks among the user's efforts are shown, only the owner may read their records
  const props = defineProps<{ activityId: string, date: string, efforts: BestEffort[], owner: boolean }>()

  const trainingStore = useTrainingStore()
  // the rank (1 to 3) of each effort of this activity among the user's, by effortKey
  const ranks = ref<Record<string, number>>({})
  onMounted(async () => {
    if (!props.owner) {
      return
    }
    try {
      const { records } = await trainingStore.getRecords('', '', 3)
      const found: Record<string, number> = {}
      for (const r of records) {
        if (r.activity_id === props.activityId) {
          found[effortKey(r)] = r.rank
        }
      }
      ranks.value = found
    } catch (error) {
      // the efforts show without their ranks
      console.error(error)
    }
  })

  // the sport is told only for a multisport activity, whose efforts are of several sports
  const multisport = computed(() => new Set(props.efforts.map(e => e.sport)).size > 1)
  const sections = computed(() => [
    { title: 'Fastest', kind: 'distance', efforts: props.efforts.filter(e => e.kind === 'distance') },
    { title: 'Best power', kind: 'power', efforts: props.efforts.filter(e => e.kind === 'power') },
  ].filter(s => s.efforts.length > 0))
  const rankLabels = ['Record', '2nd best', '3rd best']

  // hovering an effort shows its start on the charts and the map
  const cursor = inject(activityCursorKey, ref(null))
  const start = new Date(props.date).getTime()
  const show = (effort: BestEffort | null) => {
    cursor.value = effort ? start + effort.start_offset * 1000 : null
  }
  const startedAt = (effort: BestEffort) => `started after ${formatEffortTime(effort.start_offset)}`
</script>

<template>
  <v-card>
    <v-card-item>
      <v-card-title>Best efforts</v-card-title>
      <v-card-subtitle>Elapsed time, pauses included; power from a power meter only</v-card-subtitle>
    </v-card-item>
    <v-card-text>
      <div class="sections">
        <div v-for="section in sections" :key="section.kind">
          <div class="text-subtitle-2 mb-1">{{ section.title }}</div>
          <v-table density="compact">
            <tbody>
              <tr
                v-for="effort in section.efforts"
                :key="effortKey(effort)"
                :title="startedAt(effort)"
                @mouseenter="show(effort)"
                @mouseleave="show(null)"
              >
                <td>
                  {{ effortTarget(effort.kind, effort.target) }}
                  <span v-if="multisport" class="text-medium-emphasis">({{ sportLabel(effort.sport) }})</span>
                </td>
                <td class="text-right font-weight-medium text-no-wrap">{{ effortValue(effort) }}</td>
                <td class="text-right text-medium-emphasis text-no-wrap">{{ effortSpeed(effort) }}</td>
                <td class="rank">
                  <v-chip
                    v-if="ranks[effortKey(effort)]"
                    :color="rankColor(ranks[effortKey(effort)])"
                    label
                    :prepend-icon="mdiTrophy"
                    size="x-small"
                    variant="flat"
                  >
                    {{ rankLabels[ranks[effortKey(effort)] - 1] }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}
.rank {
  width: 7.5em;
  text-align: right;
}
</style>
