<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'

const { locale } = useI18n()

const isChinese = computed(() => locale.value === 'zh')

const switchLanguage = () => {
  if (isChinese.value) {
    locale.value = 'en'
    localStorage.setItem('language', 'en')
  } else {
    locale.value = 'zh'
    localStorage.setItem('language', 'zh')
  }
}
</script>

<template>
  <div class="language-switcher">
    <Button
      variant="outline"
      class="language-button"
      @click="switchLanguage"
    >
      {{ isChinese ? '🇺🇸 English' : '🇨🇳 简体中文' }}
    </Button>
  </div>
</template>

<style scoped>
/* 语言切换器容器 / Language switcher container */
.language-switcher {
  display: inline-flex;
  gap: 8px;
}

/* 主按钮样式 / Main button styles */
.language-button {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: var(--text-primary) !important;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.language-button:hover {
  background: rgba(255, 255, 255, 0.15) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}
</style>