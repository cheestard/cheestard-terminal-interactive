import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Aura from '@primeuix/themes/aura'
import router from './router'
import i18n from './i18n'
import App from './App.vue'
import './style.css'

// PrimeVue CSS
import 'primeicons/primeicons.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
})
app.use(ToastService)

app.mount('#app')