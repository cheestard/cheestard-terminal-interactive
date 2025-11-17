<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'

const { locale } = useI18n()
const menu = ref()
const items = ref<MenuItem[]>([
  {
    label: '🇨🇳 中文',
    command: () => {
      locale.value = 'zh'
      localStorage.setItem('language', 'zh')
    }
  },
  {
    label: '🇺🇸 English',
    command: () => {
      locale.value = 'en'
      localStorage.setItem('language', 'en')
    }
  }
])

const toggle = (event: Event) => {
  menu.value.toggle(event)
}

// 初始化语言设置
const initializeLanguage = () => {
  const savedLanguage = localStorage.getItem('language')
  if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
    locale.value = savedLanguage
  }
}

// 在组件挂载后初始化语言设置
onMounted(() => {
  initializeLanguage()
})
</script>

<template>
  <div class="card flex justify-center">
    <Button 
      type="button" 
      icon="pi pi-language" 
      aria-label="Language" 
      severity="secondary" 
      text 
      size="small"
      @click="toggle" 
      aria-haspopup="true" 
      aria-controls="overlay_menu"
    />
    <Menu ref="menu" id="overlay_menu" :model="items" :popup="true" />
  </div>
</template>