<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Card from 'primevue/card'
import RadioButton from 'primevue/radiobutton'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { useSettingsStore } from '../stores/settings'

const router = useRouter()
const { t, locale } = useI18n()
const toast = useToast()
const settingsStore = useSettingsStore()

// 语言选项
const languageOptions = [
  { value: 'zh', label: t('settings.chinese') },
  { value: 'en', label: t('settings.english') }
]

// 当前选择的语言 - 使用computed确保与store同步
const selectedLanguage = computed({
  get: () => settingsStore.language || locale.value,
  set: (value: string) => {
    // 通过setter更新值
    settingsStore.language = value
  }
})

// 返回首页
const goBack = () => {
  router.push('/')
}

// 保存语言设置
const saveLanguageSetting = async (newLocale: string) => {
  try {
    // 更新i18n语言
    locale.value = newLocale
    
    // 保存到Pinia store
    await settingsStore.setLanguage(newLocale)
    
    // 保存到本地存储
    localStorage.setItem('language', newLocale)
    
    // 显示成功提示
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('settings.saveSuccess'),
      life: 3000
    })
  } catch (error) {
    console.error('Failed to save language setting:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: 'Failed to save language setting',
      life: 3000
    })
  }
}

// 初始化设置
onMounted(async () => {
  try {
    // 从store加载设置
    await settingsStore.loadSettings()
    selectedLanguage.value = settingsStore.language || locale.value
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
})
</script>

<template>
  <div class="settings-container">
    <Toast />
    
    <!-- 页面头部 -->
    <div class="settings-header">
      <Button
        icon="pi pi-arrow-left"
        :label="t('settings.backToHome')"
        text
        severity="secondary"
        class="back-btn"
        @click="goBack"
      />
      <h1 class="page-title">{{ t('settings.title') }}</h1>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 语言设置卡片 -->
      <Card class="settings-card">
        <template #title>
          <div class="card-title">
            <i class="pi pi-language"></i>
            {{ t('settings.language') }}
          </div>
        </template>
        <template #content>
          <p class="setting-description">{{ t('settings.languageDescription') }}</p>
          
          <div class="language-options">
            <div 
              v-for="option in languageOptions" 
              :key="option.value"
              class="language-option"
              @click="saveLanguageSetting(option.value)"
            >
              <RadioButton 
                v-model="selectedLanguage" 
                :inputId="`lang-${option.value}`" 
                :value="option.value"
                @change="saveLanguageSetting(option.value)"
              />
              <label :for="`lang-${option.value}`" class="language-label">
                {{ option.label }}
              </label>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
/* 设置页面容器 */
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  animation: fadeIn var(--transition-slow) ease-out;
}

/* 页面头部 */
.settings-header {
  display: flex;
  align-items: center;
  gap: var(--spacing);
  margin-bottom: var(--spacing-xl);
}

.back-btn {
  transition: all var(--transition-fast);
}

.back-btn:hover {
  background-color: var(--primary-50) !important;
  color: var(--primary-500) !important;
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* 设置内容区域 */
.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 设置卡片 */
.settings-card {
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.settings-card:hover {
  box-shadow: var(--shadow-md);
}

.card-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.card-title i {
  color: var(--primary-500);
  font-size: var(--text-lg);
}

.setting-description {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
  line-height: var(--leading-relaxed);
}

/* 语言选项 */
.language-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.language-option {
  display: flex;
  align-items: center;
  gap: var(--spacing);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.language-option:hover {
  background-color: var(--bg-secondary);
  border-color: var(--border-light);
}

.language-label {
  cursor: pointer;
  font-size: var(--text-base);
  color: var(--text-primary);
  font-weight: 500;
  user-select: none;
}

/* 动画定义 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-container {
    padding: var(--spacing);
  }

  .settings-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .page-title {
    font-size: var(--text-xl);
  }

  .language-option {
    padding: var(--spacing-sm) var(--spacing);
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .settings-card {
    background: var(--bg-dark-secondary);
    border-color: var(--border-light);
  }

  .language-option:hover {
    background: var(--bg-dark-tertiary);
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  .settings-container,
  .back-btn,
  .settings-card,
  .language-option {
    animation: none;
    transition: none;
  }
}
</style>