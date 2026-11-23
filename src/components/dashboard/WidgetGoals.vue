<script setup lang="ts">
  import { computed } from 'vue'
  import { mdiBullseyeArrow } from '@mdi/js'
  import GoalCard from '@/components/GoalCard.vue'
  import { useAppStore } from '@/stores/app'
  import { useGoalsStore } from '@/stores/goals'

  // the goals in progress (not the ended custom ones); the dashboard loads them
  const goalsStore = useGoalsStore()
  const appStore = useAppStore()
  const active = computed(() => goalsStore.goals.filter(g => g.state !== 'missed' && !(g.period === 'custom' && g.days_left === 0 && g.state === 'reached')))
</script>

<template>
  <v-card class="widget-card">
    <v-card-item>
      <template #prepend>
        <v-icon color="primary" :icon="mdiBullseyeArrow" />
      </template>
      <v-card-title>Goals</v-card-title>
      <template #append>
        <v-btn size="small" variant="text" @click="appStore.navigateToPage('/goals')">
          {{ active.length ? 'All goals' : 'Set a goal' }}
        </v-btn>
      </template>
    </v-card-item>
    <v-card-text>
      <div v-if="!active.length" class="text-body-2 text-medium-emphasis">
        Set a target for the week, the month, the year or a race, and follow it here.
      </div>
      <div v-else class="goals">
        <GoalCard
          v-for="goal in active"
          :key="goal.id"
          class="cursor-pointer"
          compact
          :goal="goal"
          @click="appStore.navigateToPage('/goals')"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
/* as many columns as the width of the widget allows */
.goals {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px 24px;
}
</style>
