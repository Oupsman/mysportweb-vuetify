/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import 'unfonts.css' // self-hosted Roboto, configured in vite.config.mts
import 'vuetify/styles'
import { VCalendar } from 'vuetify/labs/VCalendar'
// Composables
import { createVuetify } from 'vuetify'
// SVG icons: components import the ones they use from @mdi/js, only those are bundled
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components: {
    VCalendar,
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#257800',
          secondary: '#74e3b6',
        },
      },
    },
  },
})
