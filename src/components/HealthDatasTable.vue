<script setup lang="ts">
  import { computed } from 'vue'
  import { mdiDeleteOutline, mdiPencilOutline } from '@mdi/js'
  import type { HealthData } from '@/types/health'
  import { formatHealthValue, formatMeasureDate, healthMetrics, measuredMetrics } from '@/utils/health'

  const props = defineProps<{ datas: HealthData[], busy?: number | null }>()
  const emit = defineEmits<{
    edit: [data: HealthData]
    delete: [data: HealthData]
  }>()

  // the table is the accessible view of the chart: every measure, the metrics measured at least once
  const headers = computed(() => [
    { title: 'Date', key: 'date', sortable: true },
    ...measuredMetrics(props.datas).map(m => ({
      title: `${m.title} (${m.unit})`,
      key: m.key,
      sortable: false,
      align: 'end' as const,
    })),
    { title: '', key: 'actions', sortable: false, align: 'end' as const },
  ])

  const cell = (key: string, data: HealthData) => {
    const metric = healthMetrics.find(m => m.key === key)
    return metric && data[metric.values[0].field] > 0 ? formatHealthValue(metric, data) : ''
  }
</script>

<template>
  <v-card>
    <v-card-title>Measures</v-card-title>
    <v-data-table
      density="compact"
      :headers="headers"
      hover
      :items="datas"
      :items-per-page="25"
      no-data-text="No measure yet"
      :sort-by="[{ key: 'date', order: 'desc' }]"
    >
      <template #[`item.date`]="{ item }">
        <span class="text-no-wrap">{{ formatMeasureDate(item.date) }}</span>
      </template>
      <template v-for="m in healthMetrics" :key="m.key" #[`item.${m.key}`]="{ item }">
        <span class="text-no-wrap">{{ cell(m.key, item) }}</span>
      </template>
      <template #[`item.actions`]="{ item }">
        <div class="d-flex justify-end">
          <v-btn
            :disabled="busy !== null && busy !== undefined"
            :icon="mdiPencilOutline"
            size="small"
            title="Edit"
            variant="text"
            @click="emit('edit', item)"
          />
          <v-btn
            color="error"
            :disabled="busy !== null && busy !== undefined"
            :icon="mdiDeleteOutline"
            :loading="busy === item.id"
            size="small"
            title="Delete"
            variant="text"
            @click="emit('delete', item)"
          />
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>
