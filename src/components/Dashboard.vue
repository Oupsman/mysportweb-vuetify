<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import {
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
  import WidgetHighlights from '@/components/dashboard/WidgetHighlights.vue'
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
  import { defaultLayout, gap, maxRows, rowHeight, widgetDef, widgetDefs } from '@/utils/dashboardWidgets'
  import { bottom, columns, compact, place } from '@/utils/gridLayout'
  import type { Box } from '@/utils/gridLayout'

  const userStore = useUserStore()
  const appStore = useAppStore()
  const layoutStore = useDashboardLayoutStore()
  const dashboard = computed(() => userStore.dashboard)
  const hasActivities = computed(() => dashboard.value.totals.all_time.activities > 0)
  // the grid on large screens; smaller ones stack the widgets in reading order, fitting their content
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
  // in the DOM in a fixed order (moving a widget doesn't move its element, nor redraw its charts)
  const shown = computed(() => widgets.value.filter(w => !w.hidden))
  // the ones in the grid; the others are in the widgets menu, with why they don't show
  const placed = computed(() => shown.value.filter(w => !unavailable.value[w.id]))

  // where the widgets are: the saved places, gone up into the room left by the widgets not shown
  const boxes = computed(() => {
    const laid = compact(placed.value.map(w => ({ id: w.id, x: w.x, y: w.y, w: w.w, h: w.h })))
    return new Map(laid.map((box, index) => [box.id, { ...box, index }]))
  })
  const rows = computed(() => bottom([...boxes.value.values()]))

  // how a layout shows: the widgets hidden, the places of the others in the grid
  const arrangement = (layout: WidgetLayout[]) => JSON.stringify([
    layout.filter(w => w.hidden).map(w => w.id).sort(),
    compact(layout.filter(w => !w.hidden && !unavailable.value[w.id])
      .map(w => ({ id: w.id, x: w.x, y: w.y, w: w.w, h: w.h }))),
  ])

  // the places of the boxes into the draft
  const apply = (laid: Box[]) => {
    for (const box of laid) {
      const widget = draft.value.find(w => w.id === box.id)
      if (widget) {
        Object.assign(widget, { x: box.x, y: box.y, w: box.w, h: box.h })
      }
    }
  }
  const currentBoxes = (): Box[] => [...boxes.value.values()].map(({ id, x, y, w, h }) => ({ id, x, y, w, h }))

  const startEditing = () => {
    draft.value = layoutStore.layout.map(w => ({ ...w }))
    saveError.value = ''
    editing.value = true
  }
  const cancel = () => {
    endGesture(false)
    editing.value = false
  }
  const reset = () => {
    draft.value = defaultLayout()
  }
  const save = async () => {
    saving.value = true
    saveError.value = ''
    try {
      apply(currentBoxes())
      await layoutStore.save(draft.value, arrangement(draft.value) === arrangement(defaultLayout()))
      editing.value = false
    } catch (e) {
      saveError.value = (e as Error).message
    } finally {
      saving.value = false
    }
  }

  // shown again: below the others, then up as far as it goes
  const toggle = (id: string) => {
    const widget = draft.value.find(w => w.id === id)
    if (!widget) {
      return
    }
    if (widget.hidden) {
      Object.assign(widget, { x: 0, y: rows.value, hidden: false })
    } else {
      widget.hidden = true
    }
  }
  const visibleCount = computed(() => draft.value.filter(w => !w.hidden).length)

  // dragging a widget by its handle or resizing it by its corner: the layout made again from the one at the
  // start at each cell the pointer reaches, the others making room
  interface Gesture {
    kind: 'move' | 'resize'
    id: string
    snapshot: Box[]
    start: Box
    // the pointer in the grid at the start; in the widget, to move it
    gridX: number
    gridY: number
    offsetX: number
    offsetY: number
    target: string
  }
  const grid = ref<HTMLElement | null>(null)
  const gesture = ref<Gesture | null>(null)
  const pointer = ref({ x: 0, y: 0 })
  const gridRect = ref<DOMRect | null>(null)
  const rowPitch = rowHeight + gap
  const colPitch = (rect: DOMRect) => (rect.width + gap) / columns
  const clamp = (x: number, min: number, max: number) => Math.min(Math.max(x, min), max)

  const update = () => {
    const g = gesture.value
    if (!g || !grid.value) {
      return
    }
    const rect = grid.value.getBoundingClientRect()
    gridRect.value = rect
    const px = pointer.value.x - rect.left
    const py = pointer.value.y - rect.top
    const def = widgetDef.get(g.id)
    const to = g.kind === 'move'
      ? {
        x: Math.round((px - g.offsetX) / colPitch(rect)),
        y: Math.round((py - g.offsetY) / rowPitch),
      }
      : {
        w: clamp(g.start.w + Math.round((px - g.gridX) / colPitch(rect)), def?.minW ?? 1, columns - g.start.x),
        h: clamp(g.start.h + Math.round((py - g.gridY) / rowPitch), def?.minH ?? 1, maxRows),
      }
    const target = JSON.stringify(to)
    if (target !== g.target) {
      g.target = target
      apply(place(g.snapshot.map(b => ({ ...b })), g.id, to))
    }
  }

  // near the top or the bottom of the window, the page scrolls
  let frame = 0
  const autoScroll = () => {
    const top = 160
    const y = pointer.value.y
    let dy = 0
    if (y < top) {
      dy = -Math.ceil((top - y) / 8)
    } else if (y > window.innerHeight - 60) {
      dy = Math.ceil((y - window.innerHeight + 60) / 8)
    }
    if (dy) {
      window.scrollBy(0, dy)
      update()
    }
    frame = requestAnimationFrame(autoScroll)
  }

  const onPointerMove = (event: PointerEvent) => {
    pointer.value = { x: event.clientX, y: event.clientY }
    update()
  }
  const onPointerUp = () => endGesture(true)
  const onPointerCancel = () => endGesture(false)
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      endGesture(false)
    }
  }

  const startGesture = (event: PointerEvent, id: string, kind: Gesture['kind']) => {
    const el = (event.currentTarget as HTMLElement).closest('.dashboard-widget')
    const box = boxes.value.get(id)
    if (!lgAndUp.value || event.button !== 0 || !grid.value || !el || !box || gesture.value) {
      return
    }
    event.preventDefault()
    const rect = grid.value.getBoundingClientRect()
    const widgetRect = el.getBoundingClientRect()
    gesture.value = {
      kind,
      id,
      snapshot: currentBoxes(),
      start: { id, x: box.x, y: box.y, w: box.w, h: box.h },
      gridX: event.clientX - rect.left,
      gridY: event.clientY - rect.top,
      offsetX: event.clientX - widgetRect.left,
      offsetY: event.clientY - widgetRect.top,
      target: '',
    }
    pointer.value = { x: event.clientX, y: event.clientY }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerCancel)
    window.addEventListener('keydown', onKeyDown)
    update()
    frame = requestAnimationFrame(autoScroll)
  }

  // kept, or back to the layout at the start (Escape, the gesture cancelled)
  const endGesture = (keep: boolean) => {
    const g = gesture.value
    if (!g) {
      return
    }
    if (!keep) {
      apply(g.snapshot)
    }
    gesture.value = null
    cancelAnimationFrame(frame)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerCancel)
    window.removeEventListener('keydown', onKeyDown)
  }
  onBeforeUnmount(() => endGesture(false))

  // the arrow keys on the handle move the widget by a cell, with Shift they resize it. Going down, it passes
  // the widget below it: one row down, it would go back up into its place.
  const onHandleKey = (event: KeyboardEvent, id: string) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }
    const move = moves[event.key]
    const box = boxes.value.get(id)
    const def = widgetDef.get(id)
    if (!move || !box || !def || !lgAndUp.value || gesture.value) {
      return
    }
    event.preventDefault()
    const [dx, dy] = move
    if (event.shiftKey) {
      apply(place(currentBoxes(), id, {
        w: clamp(box.w + dx, def.minW, columns - box.x),
        h: clamp(box.h + dy, def.minH, maxRows),
      }))
      return
    }
    const before = JSON.stringify(currentBoxes())
    for (let step = 1; step <= rows.value + 1; step++) {
      const laid = place(currentBoxes(), id, { x: box.x + dx * step, y: box.y + dy * step })
      if (JSON.stringify(laid.map(({ id, x, y, w, h }) => ({ id, x, y, w, h }))) !== before) {
        apply(laid)
        return
      }
    }
  }

  // the widget dragged follows the pointer, above the place it will take
  const dragOffset = computed(() => {
    const g = gesture.value
    const rect = gridRect.value
    const box = g && boxes.value.get(g.id)
    if (!g || g.kind !== 'move' || !rect || !box) {
      return ''
    }
    const dx = pointer.value.x - g.offsetX - (rect.left + box.x * colPitch(rect))
    const dy = pointer.value.y - g.offsetY - (rect.top + box.y * rowPitch)
    return `translate(${dx}px, ${dy}px)`
  })

  const area = (box: Box) => ({
    gridColumn: `${box.x + 1} / span ${box.w}`,
    gridRow: `${box.y + 1} / span ${box.h}`,
  })
  const widgetStyle = (id: string): Record<string, string | number> => {
    const box = boxes.value.get(id)
    if (!box) {
      return {}
    }
    if (!lgAndUp.value) {
      return { order: box.index }
    }
    return gesture.value?.id === id && dragOffset.value
      ? { ...area(box), transform: dragOffset.value }
      : area(box)
  }
  const gridStyle = computed(() => {
    const style: Record<string, string> = { '--row-h': `${rowHeight}px`, '--gap': `${gap}px` }
    if (lgAndUp.value && editing.value) {
      // room below the widgets to drop one there
      style.gridTemplateRows = `repeat(${rows.value + 4}, ${rowHeight}px)`
    }
    return style
  })
  // stacked: the narrow ones by two
  const isNarrow = (id: string) => (boxes.value.get(id)?.w ?? 12) <= 4

  const sizeLabel = (id: string) => {
    const box = boxes.value.get(id)
    return box ? `${box.w} × ${box.h}` : ''
  }
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
          <template v-if="lgAndUp">
            Drag a widget by its handle to move it, by its corner to resize it. On the handle, the arrow keys
            move it, Shift + arrows resize it.
          </template>
          <template v-else>Widen the window to arrange the widgets: here they stack in their order.</template>
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

      <div
        ref="grid"
        class="dashboard-grid"
        :class="{
          'dashboard-grid--free': lgAndUp,
          'dashboard-grid--editing': lgAndUp && editing,
          'dashboard-grid--gesture': gesture,
        }"
        :style="gridStyle"
      >
        <!-- where the widget dragged or resized will be -->
        <div
          v-if="gesture && boxes.get(gesture.id)"
          class="dashboard-placeholder"
          :style="area(boxes.get(gesture.id)!)"
        />
        <div
          v-for="widget in shown"
          v-show="!unavailable[widget.id]"
          :key="widget.id"
          class="dashboard-widget"
          :class="{
            'dashboard-widget--narrow': isNarrow(widget.id),
            'dashboard-widget--editing': editing,
            'dashboard-widget--moving': gesture?.id === widget.id && gesture.kind === 'move',
            'dashboard-widget--resizing': gesture?.id === widget.id && gesture.kind === 'resize',
          }"
          :style="widgetStyle(widget.id)"
        >
          <!-- inert while customizing: a click doesn't open an activity -->
          <div class="dashboard-widget__content" :inert="editing">
            <WidgetTotals v-if="widget.id.startsWith('total-')" :measure="totalsMeasure(widget.id)" />
            <WidgetHighlights v-else-if="widget.id === 'highlights'" />
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
                <span v-if="lgAndUp" class="ml-1">· {{ sizeLabel(widget.id) }}</span>
              </v-chip>
              <v-spacer />
              <v-btn
                v-if="lgAndUp"
                :aria-label="`Move ${widgetDef.get(widget.id)?.title}: drag, or arrow keys; Shift + arrow keys to resize`"
                class="dashboard-widget__handle"
                density="comfortable"
                :icon="mdiDrag"
                size="small"
                title="Drag to move; arrow keys to move, Shift + arrow keys to resize"
                variant="flat"
                @keydown="onHandleKey($event, widget.id)"
                @pointerdown="startGesture($event, widget.id, 'move')"
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
              title="Drag to resize"
              @pointerdown="startGesture($event, widget.id, 'resize')"
            >
              <v-icon :icon="mdiResizeBottomRight" size="small" />
            </div>
          </template>
        </div>
      </div>
    </template>
  </v-container>
</template>

<style>
/* not scoped: the cards are in the widget components */

/* stacked (small screens): one column, two from sm with the narrow widgets side by side; each fits its
   content */
.dashboard-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr);
}
@media (min-width: 600px) {
  .dashboard-grid:not(.dashboard-grid--free) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .dashboard-grid:not(.dashboard-grid--free) .dashboard-widget:not(.dashboard-widget--narrow) {
    grid-column: 1 / -1;
  }
}
.dashboard-widget {
  position: relative;
  min-width: 0;
}
.dashboard-widget__content {
  height: 100%;
}
.dashboard-widget .widget-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* the grid (large screens): each widget at its place, as high as its rows; the content scrolls, the charts
   take the room left */
.dashboard-grid--free {
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: var(--row-h);
  gap: var(--gap);
}
.dashboard-grid--free .dashboard-widget {
  min-height: 0;
}
.dashboard-grid--free .widget-card {
  overflow: hidden;
}
.dashboard-grid--free .widget-card > .v-card-text {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.dashboard-grid--free .widget-card > .widget-scroll {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.dashboard-grid--free .widget-card > .widget-scroll > .v-table__wrapper {
  flex: 1 1 0;
  overflow: auto;
}
.dashboard-grid--free .weekly-chart,
.dashboard-grid--free .zones-chart,
.dashboard-grid--free .readiness-chart {
  flex: 1 1 0;
  height: auto !important;
  min-height: 120px;
}

/* customizing: the cells of the grid drawn, the widgets outlined */
.dashboard-grid--editing {
  background-image:
    linear-gradient(to bottom, transparent var(--row-h), rgb(var(--v-theme-background)) var(--row-h)),
    linear-gradient(to right, rgba(var(--v-theme-primary), 0.07) calc(100% - var(--gap)), transparent calc(100% - var(--gap)));
  background-size:
    100% calc(var(--row-h) + var(--gap)),
    calc((100% + var(--gap)) / 12) 100%;
}
.dashboard-grid--gesture {
  user-select: none;
}
.dashboard-widget--editing {
  outline: 2px dashed rgba(var(--v-theme-primary), 0.6);
  outline-offset: -1px;
  border-radius: 4px;
}
.dashboard-widget--editing .dashboard-widget__content {
  opacity: 0.85;
  user-select: none;
}
.dashboard-widget--moving {
  z-index: 4;
  opacity: 0.85;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
.dashboard-widget--moving .dashboard-widget__handle {
  cursor: grabbing;
}
.dashboard-widget--resizing {
  z-index: 4;
}
.dashboard-placeholder {
  border: 2px dashed rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
  border-radius: 4px;
  z-index: 0;
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
  max-width: 70%;
}
.dashboard-widget__handle {
  cursor: grab;
  touch-action: none;
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
  z-index: 5;
}
</style>
