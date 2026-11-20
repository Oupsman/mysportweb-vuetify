/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'
import { forgetLegacyToken } from '@/auth'

// Components
import App from './App.vue'
// Composables
import { createApp } from 'vue'

// the session is a cookie now: the token kept by the previous versions goes
forgetLegacyToken()

const app = createApp(App)

registerPlugins(app)
// app.config.devtools = true

app.mount('#app')
