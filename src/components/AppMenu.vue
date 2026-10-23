<script setup lang="ts">
  import { mdiAccount, mdiAccountArrowRight, mdiAccountPlus, mdiBicycle, mdiHeart, mdiHomeAnalytics, mdiPodium } from '@mdi/js'
  import { storeToRefs } from 'pinia'
  import { useUserStore } from '@/stores/user'
  import { useAppStore } from '@/stores/app'
  const userStore = useUserStore()
  const appStore = useAppStore()
  const { userIsLoggedIn } = storeToRefs(userStore)
  const { drawer } = storeToRefs(appStore)
  const goToPage = (page: string): void => {
    appStore.navigateToPage(page)
  }
  const menuItems = [
    {
      icon: mdiHomeAnalytics,
      title: 'Home',
      page: '/',
    },
    {
      icon: mdiBicycle,
      title: 'Equipments',
      page: '/equipments',
    },
    {
      icon: mdiPodium,
      title: 'Activities',
      page: '/activities',
    },
    {
      icon: mdiHeart,
      title: 'Health Datas',
      page: '/health',
    },
    {
      icon: mdiAccount,
      title: 'Your profile',
      page: '/profile/view',
    },
  ]
</script>

<template>
  <v-navigation-drawer v-model="drawer" app>
    <v-list v-if="userIsLoggedIn" dense>
      <v-list-item
        v-for="item in menuItems"
        :key="item.title"
        @click="goToPage(item.page)"
      >
        <template #prepend>
          <v-icon :icon="item.icon" />
        </template>
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
      <v-list-item @click="userStore.logout()">
        <template #prepend>
          <v-icon :icon="mdiAccountArrowRight" />
        </template>
        <v-list-item-title>Log out</v-list-item-title>
      </v-list-item>
    </v-list>
    <v-list v-else dense>
      <v-list-item @click="goToPage('/login')">
        <template #prepend>
          <v-icon :icon="mdiAccount" />
        </template>
        <v-list-item-title>Login</v-list-item-title>
      </v-list-item>
      <v-list-item @click="goToPage('/signup')">
        <template #prepend>
          <v-icon :icon="mdiAccountPlus" />
        </template>
        <v-list-item-title>Sign up</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
