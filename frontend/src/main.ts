import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
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
  // 使用 styled 模式以获得默认样式支持 / Use styled mode for default style support
  unstyled: false,
  // 配置 PassThrough 以支持 Tailwind CSS / Configure PassThrough for Tailwind CSS support
  pt: {
    // 卡片组件的 PassThrough 配置 / Card component PassThrough configuration
    card: {
      root: 'glass-effect p-card'
    },
    // 输入框组件的 PassThrough 配置 / Input component PassThrough configuration
    inputtext: {
      root: 'p-inputtext'
    },
    // 按钮组件的 PassThrough 配置 / Button component PassThrough configuration
    button: {
      root: 'p-button'
    }
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