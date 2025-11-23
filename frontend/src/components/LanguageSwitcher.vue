<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'

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
      :label="isChinese ? '🇺🇸 English' : '🇨🇳 简体中文'"
      type="button"
      class="language-button"
      @click="switchLanguage"
    />
  </div>
</template>

<style scoped>
/* 语言切换器容器 */
.language-switcher {
  display: inline-flex;
  gap: 8px;
}

/* 主按钮样式 */
.language-button {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.language-button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}
</style>