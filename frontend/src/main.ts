import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css' // 导入PrimeIcons CSS
import i18n from './i18n'

// 导入PrimeVue组件
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Popover from 'primevue/popover'
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import VirtualScroller from 'primevue/virtualscroller'

import App from './App.vue'
import router from './router'
import './style.css'

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
app.directive('tooltip', Tooltip)

// 注册PrimeVue组件
app.component('Button', Button)
app.component('Menu', Menu)
app.component('Popover', Popover)
app.component('Card', Card)
app.component('Badge', Badge)
app.component('Dialog', Dialog)
app.component('InputText', InputText)
app.component('VirtualScroller', VirtualScroller)

app.mount('#app')