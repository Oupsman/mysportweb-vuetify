<script setup lang="ts">
  import { computed } from 'vue'
  import { mdiNavigation } from '@mdi/js'
  import type { Weather } from '@/types/weather'
  import { compassPoint, weatherCondition } from '@/utils/weather'

  // the weather at the start of an activity, from Open-Meteo: its licence asks for the link
  const props = defineProps<{ weather: Weather }>()
  const condition = computed(() => weatherCondition(props.weather.code))
  const round = (v: number | null, digits = 0) => v === null ? '' : v.toFixed(digits)
</script>

<template>
  <v-card>
    <v-card-item>
      <template #prepend>
        <v-icon color="blue-darken-2" :icon="condition.icon" size="large" />
      </template>
      <v-card-title>
        {{ condition.text }}<span v-if="weather.temperature !== null">, {{ round(weather.temperature, 1) }} °C</span>
      </v-card-title>
      <v-card-subtitle>Weather at the start</v-card-subtitle>
    </v-card-item>
    <v-card-text>
      <div class="d-flex flex-wrap ga-6">
        <div v-if="weather.apparent_temperature !== null">
          <div class="text-caption text-medium-emphasis">Feels like</div>
          <div>{{ round(weather.apparent_temperature, 1) }} °C</div>
        </div>
        <div v-if="weather.wind_speed !== null">
          <div class="text-caption text-medium-emphasis">Wind</div>
          <div class="d-flex align-center">
            <!-- the arrow points where the wind goes -->
            <v-icon
              v-if="weather.wind_direction !== null"
              class="mr-1"
              :icon="mdiNavigation"
              size="small"
              :style="{ transform: `rotate(${(weather.wind_direction + 180) % 360}deg)` }"
              :title="`From ${compassPoint(weather.wind_direction)} (${round(weather.wind_direction)}°)`"
            />
            {{ round(weather.wind_speed) }} km/h
            <span v-if="weather.wind_direction !== null" class="ml-1">from {{ compassPoint(weather.wind_direction) }}</span>
          </div>
          <div v-if="weather.wind_gusts !== null" class="text-caption">gusts {{ round(weather.wind_gusts) }} km/h</div>
        </div>
        <div v-if="weather.precipitation !== null">
          <div class="text-caption text-medium-emphasis">Precipitation</div>
          <div>{{ round(weather.precipitation, 1) }} mm/h</div>
        </div>
        <div v-if="weather.humidity !== null">
          <div class="text-caption text-medium-emphasis">Humidity</div>
          <div>{{ round(weather.humidity) }} %</div>
        </div>
        <div v-if="weather.cloud_cover !== null">
          <div class="text-caption text-medium-emphasis">Clouds</div>
          <div>{{ round(weather.cloud_cover) }} %</div>
        </div>
      </div>
      <div class="text-caption text-medium-emphasis mt-3">
        Within about 10 km of the start ·
        <a href="https://open-meteo.com/" rel="noopener" target="_blank">Weather data by Open-Meteo.com</a>
      </div>
    </v-card-text>
  </v-card>
</template>
