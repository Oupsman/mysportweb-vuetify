/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHashHistory } from 'vue-router/auto'
import { setupLayouts } from 'virtual:generated-layouts'
import { routes } from 'vue-router/auto-routes'
import ProfileEditPage from '../pages/profile/edit.vue'
import ProfileView from '../pages/profile/view.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
})
/*
router.addRoute(
  {
    path: '/activity/:id',
    name: 'ActivityView',
    component: ActivityViewPage,
  })
router.addRoute({
  path: '/activity/:id/edit', name: 'ActivityEdit', component: ActivityEditPage,
})
*/
router.addRoute({
  path: '/profile', name: 'Profile', component: ProfileView,
})

router.addRoute({
  path: '/profile/edit', name: 'ProfileEdit', component: ProfileEditPage,
})

// pages open without session: login, sign up and the view of an activity (public ones are visible to anyone)
const isPublic = (path: string): boolean =>
  path === '/login' || path === '/signup' || (/^\/activity\/[^/]+$/.test(path) && path !== '/activity/add')

// keeps the requested page: without session, the login page brings back to it
router.beforeEach(async to => {
  // imported here: the stores import the router
  const { useUserStore } = await import('@/stores/user')
  const loggedIn = useUserStore().restoreSession()
  if (!loggedIn && !isPublic(to.path)) {
    return { path: '/login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
  }
  if (loggedIn && (to.path === '/login' || to.path === '/signup')) {
    return { path: '/' }
  }
})

// title of the page, from its first path segment; the activity pages show the activity title once loaded
router.afterEach(async to => {
  const { useAppStore } = await import('@/stores/app')
  const section = to.path.split('/')[1] ?? ''
  useAppStore().pageTitle = section ? section.charAt(0).toUpperCase() + section.slice(1) : 'Home'
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
