<template>
  <v-app>
    <app-menu />
    <v-app-bar app style="position: relative">
      <v-app-bar-nav-icon @click="appStore.toggleDrawer()" />
      <v-toolbar-title>MySportWeb - {{ pageTitle }} </v-toolbar-title>
    </v-app-bar>
    <v-main>
      <router-view />
      <v-dialog v-model="dialog.visible" :fullscreen="dialog.fullscreen">
        <v-card>
          <v-card-title>{{ dialog.title }}</v-card-title>
          <v-card-text>
            <p v-html="dialog.contents" />
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="appStore.hideDialog">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-main>
    <v-footer app>
      <span>&copy; {{ currentYear }} MySportWeb Fitness Tracker</span>
    </v-footer>
  </v-app>
</template>

<script lang="ts" setup>
  import { onMounted } from 'vue'
  import { useUserStore } from '@/stores/user'
  import { useAppStore } from '@/stores/app'
  import { storeToRefs } from 'pinia'
  import AppMenu from './components/AppMenu.vue'
  const userStore = useUserStore()
  const appStore = useAppStore()
  const { pageTitle, dialog } = storeToRefs(appStore)
  const currentYear = new Date().getFullYear()
  onMounted(async () => {
    // check validity of the token
    if (!userStore.checkToken) {
      appStore.navigateToPage('/login')
    } else {
      appStore.navigateToPage('/')
    }
  })
</script>
