import { defineStore } from 'pinia'
import { ref } from 'vue'

// 设置接口定义
interface Settings {
  language: string
}

export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const language = ref<string>('zh')
  const isLoading = ref(false)

  // 加载设置
  const loadSettings = async (): Promise<void> => {
    try {
      isLoading.value = true
      
      // 从后端API加载设置
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const settings: Settings = await response.json()
          if (settings.language) {
            language.value = settings.language
          }
        }
      } catch (error) {
        console.warn('Failed to load settings from backend:', error)
        // 如果后端不可用，使用默认语言
        language.value = 'zh'
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 设置语言
  const setLanguage = async (newLanguage: string): Promise<void> => {
    try {
      isLoading.value = true
      
      // 更新本地状态
      language.value = newLanguage
      
      // 保存到后端配置文件
      try {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            language: newLanguage
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to save settings to backend')
        }
      } catch (error) {
        console.error('Failed to save settings to backend:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to set language:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 重置设置
  const resetSettings = async (): Promise<void> => {
    try {
      isLoading.value = true
      
      // 重置为默认值
      language.value = 'zh'
      
      // 重置后端设置
      try {
        const response = await fetch('/api/settings', {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to reset settings on backend')
        }
      } catch (error) {
        console.error('Failed to reset settings on backend:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to reset settings:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 状态
    language,
    isLoading,
    // 动作
    loadSettings,
    setLanguage,
    resetSettings
  }
})