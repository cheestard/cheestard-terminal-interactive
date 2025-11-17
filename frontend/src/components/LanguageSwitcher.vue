<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const isOpen = ref(false)

const toggleLanguage = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
  localStorage.setItem('language', locale.value)
  isOpen.value = false
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

// 初始化语言设置
const savedLanguage = localStorage.getItem('language')
if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
  locale.value = savedLanguage
}
</script>

<template>
  <div class="dropdown dropdown-end z-[99999]" :class="{ 'dropdown-open': isOpen }">
    <label tabindex="0" role="button" class="btn btn-ghost btn-circle btn-xs" @click="toggleDropdown">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
      </svg>
    </label>
    <ul tabindex="0" class="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-36 z-[99999]">
      <li>
        <a @click="toggleLanguage" :class="{ 'active': locale === 'zh' }" class="text-sm">
          🇨🇳 中文
        </a>
      </li>
      <li>
        <a @click="toggleLanguage" :class="{ 'active': locale === 'en' }" class="text-sm">
          🇺🇸 English
        </a>
      </li>
    </ul>
  </div>
</template>