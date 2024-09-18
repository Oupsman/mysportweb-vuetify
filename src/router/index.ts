/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHashHistory } from 'vue-router/auto'
import { setupLayouts } from 'virtual:generated-layouts'
import { routes } from 'vue-router/auto-routes'
import ActivityViewPage from '../pages/activity/view.vue'
import ActivityEditPage from '../pages/activity/edit.vue'
import ProfileEditPage from '../pages/profile/edit.vue'
import ProfileView from '../pages/profile/view.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
})

router.addRoute(
  {
    path: '/activity/:id', component: ActivityViewPage,
  })

router.addRoute({
  path: '/activity/:id/edit', name: 'ActivityEdit', component: ActivityEditPage,
})
router.addRoute({
  path: '/profile', name: 'Profile', component: ProfileView,
})

router.addRoute({
  path: '/profile/edit', name: 'ProfileEdit', component: ProfileEditPage,
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (!localStorage.getItem('vuetify:dynamic-reload')) {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    } else {
      console.error('Dynamic import error, reloading page did not fix it', err)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
