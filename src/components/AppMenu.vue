<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useUserStore } from '@/stores/user'
  import { useAppStore } from '@/stores/app'
  const userStore = useUserStore()
  const appStore = useAppStore()
  const { userIsLoggedIn, session } = storeToRefs(userStore)
  const { drawer } = storeToRefs(appStore)
  const goToPage = (page: string): void => {
    appStore.navigateToPage(page)
  }
  const menuItems = [
    {
      icon: 'mdi-home-analytics',
      title: 'Home',
      page: '/',
    },
    {
      icon: 'mdi-bicycle',
      title: 'Equipments',
      page: '/equipments',
    },
    {
      icon: 'mdi-podium',
      title: 'Activities',
      page: '/activities',
    },
    {
      icon: 'mdi-heart',
      title: 'Health Datas',
      page: '/health',
    },
    {
      icon: 'mdi-account',
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
        <template v-slot:prepend>
          <v-icon :icon="item.icon" />
        </template>
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
      <v-list-item @click="userStore.logout()">
        <template v-slot:prepend>
          <v-icon icon="mdi-account-arrow-right" />
        </template>
        <v-list-item-title>Log out</v-list-item-title>
      </v-list-item>
    </v-list>
    <v-list v-else dense>
      <v-list-item @click="goToPage('/login')">
        <template v-slot:prepend>
          <v-icon icon="mdi-account" />
        </template>
        <v-list-item-title>Login</v-list-item-title>
      </v-list-item>
      <v-list-item @click="goToPage('/signup')">
        <template v-slot:prepend>
          <v-icon icon="mdi-account-plus" />
        </template>
        <v-list-item-title>Sign up</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
