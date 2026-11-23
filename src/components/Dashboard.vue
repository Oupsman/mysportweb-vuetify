<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import {
    mdiArrowCollapseVertical,
    mdiArrowLeft,
    mdiArrowRight,
    mdiClose,
    mdiDrag,
    mdiResizeBottomRight,
    mdiRestore,
    mdiUpload,
    mdiViewDashboardEditOutline,
    mdiViewGridPlusOutline,
  } from '@mdi/js'
  import ReadinessCard from '@/components/ReadinessCard.vue'
  import MaintenanceCard from '@/components/MaintenanceCard.vue'
  import WidgetCalendar from '@/components/dashboard/WidgetCalendar.vue'
  import WidgetGoals from '@/components/dashboard/WidgetGoals.vue'
  import WidgetCo2 from '@/components/dashboard/WidgetCo2.vue'
  import WidgetRecent from '@/components/dashboard/WidgetRecent.vue'
  import WidgetSports from '@/components/dashboard/WidgetSports.vue'
  import WidgetTotals from '@/components/dashboard/WidgetTotals.vue'
  import WidgetWeeklyVolume from '@/components/dashboard/WidgetWeeklyVolume.vue'
  import WidgetZones from '@/components/dashboard/WidgetZones.vue'
  import { useTrainingStore } from '@/stores/training'
  import { useUserStore } from '@/stores/user'
  import { useAppStore } from '@/stores/app'
  import { useDashboardLayoutStore } from '@/stores/dashboardLayout'
  import { useGoalsStore } from '@/stores/goals'
  import type { PeriodTotals, WidgetLayout } from '@/types/dashboard'
  import {
    defaultLayout,
    heightStep,
    maxHeight,
    minHeight,
    widgetDef,
    widgetDefs,
  } from '@/utils/dashboardWidgets'

  const userStore = useUserStore()
  const appStore = useAppStore()
  const layoutStore = useDashboardLayoutStore()
  const dashboard = computed(() => userStore.dashboard)
  const hasActivities = computed(() => dashboard.value.totals.all_time.activities > 0)
  // the sizes apply on large screens; smaller ones stack the widgets
  const { lgAndUp } = useDisplay()

  const trainingStore = useTrainingStore()
  // the weeks with time in zones: none without heart rate
  const hasHrZones = computed(() => (trainingStore.hrZones?.weeks ?? []).some(w => w.zones.some(s => s > 0)))
  const hasPowerZones = computed(() => (trainingStore.powerZones?.weeks ?? []).some(w => w.zones.some(s => s > 0)))
  const reminderCount = ref(0)
  const goalsStore = useGoalsStore()

  onMounted(() => {
    userStore.refreshDashboard().catch(() => {})
    // the dashboard shows without them: they have their own widgets
    trainingStore.getReadiness().catch(() => {})
    trainingStore.getHrZones().catch(() => {})
    trainingStore.getPowerZones().catch(() => {})
    goalsStore.load().catch(() => {})
    layoutStore.load(userStore.session?.uuid ?? '')
  })

  // the widgets with something to show; the others are left out of the dashboard until they have, and
  // explained while customizing it
  const unavailable = computed((): Record<string, string> => ({
    'hr-zones': hasHrZones.value ? '' : 'Shown once your activities have heart rate data.',
    'power-zones': hasPowerZones.value ? '' : 'Shown once your rides have a power meter.',
    readiness: trainingStore.readiness ? '' : 'Shown once your readiness is computed.',
    maintenance: reminderCount.value > 0 ? '' : 'Shown when a maintenance is due or soon.',
  }))

  const totalsMeasure = (id: string) => id.replace('total-', '') as keyof PeriodTotals

  // customizing: the changes go to a draft, saved or dropped at the end
  const editing = ref(false)
  const draft = ref<WidgetLayout[]>([])
  const saving = ref(false)
  const saveError = ref('')
  const widgets = computed(() => editing.value ? draft.value : layoutStore.layout)
  const shown = computed(() => widgets.value.filter(w => !w.hidden))
  // the ones in the grid: the same while customizing, else the rows would wrap differently and the widgets
  // change size; the others are in the widgets menu, with why they don't show
  const placed = computed(() => shown.value.filter(w => !unavailable.value[w.id]))

  const startEditing = () => {
    draft.value = layoutStore.layout.map(w => ({ ...w }))
    saveError.value = ''
    editing.value = true
  }
  const cancel = () => {
    editing.value = false
  }
  const reset = () => {
    draft.value = defaultLayout()
  }
  const save = async () => {
    saving.value = true
    saveError.value = ''
    try {
      await layoutStore.save(draft.value)
      editing.value = false
    } catch (e) {
      saveError.value = (e as Error).message
    } finally {
      saving.value = false
    }
  }

  const toggle = (id: string) => {
    const widget = draft.value.find(w => w.id === id)
    if (widget) {
      widget.hidden = !widget.hidden
    }
  }
  const visibleCount = computed(() => draft.value.filter(w => !w.hidden).length)

  // puts the widget at the place of target, the others shifting
  const moveTo = (id: string, target: string) => {
    const from = draft.value.findIndex(w => w.id === id)
    const to = draft.value.findIndex(w => w.id === target)
    if (from < 0 || to < 0 || from === to) {
      return
    }
    const [widget] = draft.value.splice(from, 1)
    draft.value.splice(to, 0, widget)
  }
  // moves a widget before or after the next shown one (the hidden ones keep their place)
  const step = (id: string, direction: -1 | 1) => {
    const order = placed.value.map(w => w.id)
    const target = order[order.indexOf(id) + direction]
    if (target) {
      moveTo(id, target)
    }
  }

  // dragging by the handle, over the other widgets. The widget it just took the place of may shift under the
  // pointer: it is passed over until the pointer reaches another one, else the two would swap back and forth.
  const dragging = ref<string | null>(null)
  let lastTarget: string | null = null
  const onDragStart = (event: DragEvent, id: string) => {
    dragging.value = id
    lastTarget = null
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', id)
      const el = (event.target as HTMLElement).closest('.dashboard-widget')
      if (el) {
        event.dataTransfer.setDragImage(el, 24, 24)
      }
    }
  }
  const onDragOver = (event: DragEvent, id: string) => {
    if (!dragging.value) {
      return
    }
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    if (id === dragging.value) {
      return
    }
    if (id !== lastTarget) {
      moveTo(dragging.value, id)
    }
    lastTarget = id
  }
  const onDragEnd = () => {
    dragging.value = null
    lastTarget = null
  }

  // resizing by the corner: the width snaps to the columns, the height to heightStep pixels; a widget fitting
  // its content keeps doing it while only its width changes
  const grid = ref<HTMLElement | null>(null)
  const resizing = ref<{
    widget: WidgetLayout
    x: number
    y: number
    w: number
    h: number
    pitch: number
  } | null>(null)
  const startResize = (event: PointerEvent, widget: WidgetLayout) => {
    const handle = event.currentTarget as HTMLElement
    const el = handle.closest('.dashboard-widget') as HTMLElement | null
    if (!grid.value || !el) {
      return
    }
    event.preventDefault()
    handle.setPointerCapture(event.pointerId)
    resizing.value = {
      widget,
      x: event.clientX,
      y: event.clientY,
      w: widget.w,
      h: widget.h || el.getBoundingClientRect().height,
      pitch: grid.value.getBoundingClientRect().width / 12,
    }
  }
  const onResize = (event: PointerEvent) => {
    const r = resizing.value
    if (!r) {
      return
    }
    const minW = widgetDef.get(r.widget.id)?.minW ?? 1
    r.widget.w = Math.min(Math.max(Math.round(r.w + (event.clientX - r.x) / r.pitch), minW), 12)
    const dy = event.clientY - r.y
    if (r.widget.h > 0 || Math.abs(dy) >= heightStep) {
      const h = Math.round((r.h + dy) / heightStep) * heightStep
      r.widget.h = Math.min(Math.max(h, minHeight), maxHeight)
    }
  }
  const endResize = () => {
    resizing.value = null
  }

  const sizeLabel = (widget: WidgetLayout) =>
    `${widget.w}/12 · ${widget.h > 0 ? `${widget.h} px` : 'fits content'}`

  // on small screens the widgets stack: the narrow ones by two
  const smCols = (widget: WidgetLayout) => widget.w <= 4 ? 6 : 12
</script>

<template>
  <v-container v-if="userStore.userIsLoggedIn" class="pa-4" fluid>
    <v-alert
      v-if="dashboard.nb_equipments === 0"
      class="mb-4"
      density="compact"
      type="info"
      variant="tonal"
    >
      Add your equipment to follow its mileage.
      <template #append>
        <v-btn size="small" variant="text" @click="appStore.navigateToPage('/equipment/add')">Add an equipment</v-btn>
      </template>
    </v-alert>

    <v-card v-if="!hasActivities" class="pa-8 text-center">
      <v-card-title class="text-h5">No activity yet</v-card-title>
      <v-card-text>Upload your FIT files to see your training here.</v-card-text>
      <v-btn color="primary" :prepend-icon="mdiUpload" @click="appStore.navigateToPage('/activity/add')">
        Upload activities
      </v-btn>
    </v-card>

    <template v-else-if="layoutStore.loaded">
      <!-- customizing: what to do, the widgets to show, saving -->
      <v-sheet
        v-if="editing"
        border
        class="edit-bar d-flex flex-wrap align-center ga-2 pa-2 mb-2"
        rounded
      >
        <div class="text-body-2 text-medium-emphasis flex-grow-1">
          Drag a widget by its handle to move it<template v-if="lgAndUp">, by its corner to resize it
            (double-click the corner: fit the content)</template>.
        </div>
        <v-menu :close-on-content-click="false" location="bottom end">
          <template #activator="{ props }">
            <v-btn v-bind="props" :prepend-icon="mdiViewGridPlusOutline" size="small" variant="tonal">
              Widgets {{ visibleCount }}/{{ widgetDefs.length }}
            </v-btn>
          </template>
          <v-list density="compact" max-height="420" min-width="300">
            <v-list-item
              v-for="def in widgetDefs"
              :key="def.id"
              :subtitle="unavailable[def.id] || def.description"
              :title="def.title"
              @click="toggle(def.id)"
            >
              <template #prepend>
                <v-checkbox-btn :model-value="!draft.find(w => w.id === def.id)?.hidden" tabindex="-1" />
              </template>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn :prepend-icon="mdiRestore" size="small" variant="text" @click="reset">Default</v-btn>
        <v-btn :disabled="saving" size="small" variant="text" @click="cancel">Cancel</v-btn>
        <v-btn
          color="primary"
          :loading="saving"
          size="small"
          variant="flat"
          @click="save"
        >Save</v-btn>
      </v-sheet>
      <div v-else class="d-flex justify-end mb-1">
        <v-btn
          :prepend-icon="mdiViewDashboardEditOutline"
          size="small"
          variant="text"
          @click="startEditing"
        >Customize</v-btn>
      </div>
      <v-alert
        v-if="saveError"
        class="mb-2"
        closable
        density="compact"
        type="error"
        @click:close="saveError = ''"
      >{{ saveError }}</v-alert>

      <v-alert
        v-if="!placed.length"
        class="mb-2"
        density="compact"
        type="info"
        variant="tonal"
      >No widget on your dashboard: add some with Customize, then Widgets.</v-alert>

      <div ref="grid">
        <v-row dense>
          <v-col
            v-for="widget in shown"
            v-show="!unavailable[widget.id]"
            :key="widget.id"
            cols="12"
            :lg="widget.w"
            :sm="smCols(widget)"
          >
            <div
              class="dashboard-widget"
              :class="{
                'dashboard-widget--fixed': widget.h > 0,
                'dashboard-widget--editing': editing,
                'dashboard-widget--dragging': dragging === widget.id,
              }"
              :style="{ '--widget-h': `${widget.h}px` }"
              @dragover="onDragOver($event, widget.id)"
              @drop.prevent
            >
              <!-- inert while customizing: a click doesn't open an activity -->
              <div class="dashboard-widget__content" :inert="editing">
                <WidgetTotals v-if="widget.id.startsWith('total-')" :measure="totalsMeasure(widget.id)" />
                <WidgetGoals v-else-if="widget.id === 'goals'" />
                <MaintenanceCard v-else-if="widget.id === 'maintenance'" @count="n => reminderCount = n" />
                <WidgetWeeklyVolume v-else-if="widget.id === 'weekly-volume'" />
                <WidgetCalendar v-else-if="widget.id === 'calendar'" />
                <WidgetZones v-else-if="widget.id === 'hr-zones'" kind="hr" />
                <WidgetZones v-else-if="widget.id === 'power-zones'" kind="power" />
                <ReadinessCard
                  v-else-if="widget.id === 'readiness' && trainingStore.readiness"
                  :readiness="trainingStore.readiness"
                />
                <WidgetCo2 v-else-if="widget.id === 'co2'" />
                <WidgetRecent v-else-if="widget.id === 'recent'" />
                <WidgetSports v-else-if="widget.id === 'sports'" />
              </div>

              <template v-if="editing">
                <div class="dashboard-widget__toolbar">
                  <v-chip class="dashboard-widget__label" label size="small" variant="flat">
                    {{ widgetDef.get(widget.id)?.title }}
                    <span v-if="lgAndUp" class="ml-1">· {{ sizeLabel(widget) }}</span>
                  </v-chip>
                  <v-spacer />
                  <v-btn
                    aria-label="Drag to move"
                    class="dashboard-widget__handle"
                    density="comfortable"
                    draggable="true"
                    :icon="mdiDrag"
                    size="small"
                    title="Drag to move"
                    variant="flat"
                    @dragend="onDragEnd"
                    @dragstart="onDragStart($event, widget.id)"
                  />
                  <v-btn
                    aria-label="Move before"
                    density="comfortable"
                    :disabled="placed[0]?.id === widget.id"
                    :icon="mdiArrowLeft"
                    size="small"
                    title="Move before"
                    variant="flat"
                    @click="step(widget.id, -1)"
                  />
                  <v-btn
                    aria-label="Move after"
                    density="comfortable"
                    :disabled="placed[placed.length - 1]?.id === widget.id"
                    :icon="mdiArrowRight"
                    size="small"
                    title="Move after"
                    variant="flat"
                    @click="step(widget.id, 1)"
                  />
                  <v-btn
                    v-if="lgAndUp && widget.h > 0"
                    aria-label="Fit the content"
                    density="comfortable"
                    :icon="mdiArrowCollapseVertical"
                    size="small"
                    title="Fit the content"
                    variant="flat"
                    @click="widget.h = 0"
                  />
                  <v-btn
                    aria-label="Remove from the dashboard"
                    density="comfortable"
                    :icon="mdiClose"
                    size="small"
                    title="Remove from the dashboard"
                    variant="flat"
                    @click="toggle(widget.id)"
                  />
                </div>
                <div
                  v-if="lgAndUp"
                  class="dashboard-widget__resize"
                  title="Drag to resize, double-click to fit the content"
                  @dblclick="widget.h = 0"
                  @lostpointercapture="endResize"
                  @pointercancel="endResize"
                  @pointerdown="startResize($event, widget)"
                  @pointermove="onResize"
                  @pointerup="endResize"
                >
                  <v-icon :icon="mdiResizeBottomRight" size="small" />
                </div>
              </template>
            </div>
          </v-col>
        </v-row>
      </div>
    </template>
  </v-container>
</template>

<style>
/* the widgets fill their place; not scoped: the cards are in the widget components */
.dashboard-widget {
  position: relative;
  height: 100%;
}
.dashboard-widget__content {
  height: 100%;
}
.dashboard-widget .widget-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* a height chosen by the user, on large screens: the content scrolls, the charts take the room left */
@media (min-width: 1280px) {
  .dashboard-widget--fixed {
    height: var(--widget-h);
  }
  .dashboard-widget--fixed .widget-card {
    overflow: hidden;
  }
  .dashboard-widget--fixed .widget-card > .v-card-text {
    flex: 1 1 0;
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }
  .dashboard-widget--fixed .widget-card > .widget-scroll {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .dashboard-widget--fixed .widget-card > .widget-scroll > .v-table__wrapper {
    flex: 1 1 0;
    overflow: auto;
  }
  .dashboard-widget--fixed .weekly-chart,
  .dashboard-widget--fixed .zones-chart,
  .dashboard-widget--fixed .readiness-chart {
    flex: 1 1 0;
    height: auto !important;
    min-height: 120px;
  }
}

/* customizing */
.dashboard-widget--editing {
  outline: 2px dashed rgba(var(--v-theme-primary), 0.6);
  outline-offset: -1px;
  border-radius: 4px;
}
.dashboard-widget--editing .dashboard-widget__content {
  opacity: 0.85;
  user-select: none;
}
.dashboard-widget--dragging {
  opacity: 0.4;
}
.dashboard-widget__toolbar {
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  gap: 2px;
  z-index: 2;
}
.dashboard-widget__toolbar .v-btn {
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
}
.dashboard-widget__label.v-chip {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  max-width: 60%;
}
.dashboard-widget__handle {
  cursor: grab;
}
.dashboard-widget__resize {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: nwse-resize;
  touch-action: none;
  z-index: 2;
  border-radius: 4px 0 4px 0;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.edit-bar {
  position: sticky;
  top: 64px;
  z-index: 3;
}
</style>
