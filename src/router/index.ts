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

// After a deployment, a page opened before it still runs the previous build: the files of its lazy pages
// have new names and the old ones are gone. Loading the page again gets the new build.
// The browsers word the error differently: Chrome, Firefox (and Waterfox), Safari.
const outdatedBuild = [
  'Failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'Importing a module script failed',
]
const reloadKey = 'msw-outdated-build-reload'

router.onError((err, to) => {
  const message = String(err?.message ?? '')
  if (!outdatedBuild.some(text => message.includes(text))) {
    console.error(err)
    return
  }
  // once: if the file is still missing after a reload, reloading again won't help
  let last = 0
  try {
    last = Number(sessionStorage.getItem(reloadKey) ?? 0)
    sessionStorage.setItem(reloadKey, String(Date.now()))
  } catch {
    // no storage: reload anyway, the guard is only against a loop
  }
  if (Date.now() - last < 10_000) {
    console.error('The page could not be loaded, even after a reload', err)
    return
  }
  console.log('New version of the app: reloading')
  // the URL of the page asked (#/health): changing only the hash would not reload the page
  history.replaceState(history.state, '', router.resolve(to).href)
  location.reload()
})

export default router
