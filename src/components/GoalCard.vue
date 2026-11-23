<script setup lang="ts">
  import { computed } from 'vue'
  import type { PropType } from 'vue'
  import { mdiFire } from '@mdi/js'
  import type { Goal } from '@/types/goals'
  import {
    describeGoal,
    formatGoalValue,
    goalStates,
    goalTitle,
    leftText,
    paceText,
    percent,
    periodLabel,
  } from '@/utils/goals'

  // a goal and its progress; compact: without its history, for the dashboard
  const props = defineProps({
    goal: {
      type: Object as PropType<Goal>,
      required: true,
    },
    compact: {
      type: Boolean,
      default: false,
    },
  })

  const state = computed(() => goalStates[props.goal.state])
  const progress = computed(() => percent(props.goal.current.value, props.goal.target))
  // where a steady pace would be today, a mark on the bar
  const pace = computed(() => percent(props.goal.expected, props.goal.target))
  const showPace = computed(() => props.goal.state === 'ahead' || props.goal.state === 'behind')
  // the bars of the past periods, the current one last
  const bars = computed(() => {
    const highest = Math.max(props.goal.target, ...props.goal.history.map(p => p.value), props.goal.current.value)
    return [...props.goal.history, props.goal.current].map((p, i, all) => ({
      ...p,
      current: i === all.length - 1,
      height: highest > 0 ? Math.max(2, p.value / highest * 100) : 2,
      label: `${periodLabel(props.goal.period, p.start)}: ${formatGoalValue(props.goal.metric, p.value)}`,
    }))
  })
  const targetLine = computed(() => {
    const highest = Math.max(props.goal.target, ...props.goal.history.map(p => p.value), props.goal.current.value)
    return props.goal.target / highest * 100
  })
</script>

<template>
  <div class="goal">
    <div class="d-flex align-center ga-2">
      <div class="flex-grow-1 min-width-0">
        <div class="text-subtitle-1 font-weight-medium text-truncate">{{ goalTitle(goal) }}</div>
        <div class="text-caption text-medium-emphasis text-truncate">{{ describeGoal(goal) }}</div>
      </div>
      <v-chip
        v-if="goal.streak > 1"
        color="deep-orange"
        :prepend-icon="mdiFire"
        size="small"
        :title="`Reached ${goal.streak} ${goal.period}s in a row`"
        variant="tonal"
      >{{ goal.streak }}</v-chip>
      <v-chip :color="state.color" size="small" variant="flat">{{ state.label }}</v-chip>
      <slot name="actions" />
    </div>

    <div class="d-flex align-baseline mt-2">
      <span class="text-h6 font-weight-medium">{{ formatGoalValue(goal.metric, goal.current.value) }}</span>
      <span class="text-body-2 text-medium-emphasis ml-1">/ {{ formatGoalValue(goal.metric, goal.target) }}</span>
      <v-spacer />
      <span class="text-body-2">{{ Math.floor(progress) }}%</span>
    </div>
    <div class="progress">
      <v-progress-linear
        bg-color="surface-variant"
        :color="state.color"
        height="10"
        :model-value="progress"
        rounded
      />
      <div
        v-if="showPace"
        class="pace-mark"
        :style="{ left: `${pace}%` }"
        :title="`Steady pace: ${formatGoalValue(goal.metric, goal.expected)} by tonight`"
      />
    </div>
    <div class="d-flex flex-wrap justify-space-between text-caption text-medium-emphasis mt-1 ga-2">
      <span>{{ paceText(goal) }}</span>
      <span>{{ leftText(goal) }}</span>
    </div>

    <!-- the past periods against the target -->
    <div v-if="!compact && goal.history.length" :aria-label="`The last ${bars.length} periods`" class="history mt-3">
      <div class="target-line" :style="{ bottom: `${targetLine}%` }" />
      <div
        v-for="bar in bars"
        :key="bar.start"
        class="bar-slot"
        :title="bar.label"
      >
        <div
          class="bar"
          :class="{ 'bar--reached': bar.reached, 'bar--current': bar.current }"
          :style="{ height: `${bar.height}%` }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.min-width-0 {
  min-width: 0;
}
.progress {
  position: relative;
}
.pace-mark {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  margin-left: -1px;
  background: rgb(var(--v-theme-on-surface));
  border-radius: 1px;
}
.history {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 56px;
}
.bar-slot {
  flex: 1 1 0;
  height: 100%;
  display: flex;
  align-items: flex-end;
}
.bar {
  width: 100%;
  border-radius: 2px 2px 0 0;
  background: rgba(var(--v-theme-on-surface), 0.25);
}
.bar--reached {
  background: rgb(var(--v-theme-success));
}
.bar--current {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 1px;
}
.target-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.5);
  pointer-events: none;
}
</style>
