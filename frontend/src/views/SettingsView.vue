<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import ToggleButton from 'primevue/togglebutton'
import RadioButton from 'primevue/radiobutton'
import Toast from 'primevue/toast'
import ConfirmationDialog from 'primevue/confirmdialog'
import { useToast } from 'primevue/usetoast'
import { useSettingsStore } from '../stores/settings'

const router = useRouter()
const { t, locale } = useI18n()
const toast = useToast()
const settingsStore = useSettingsStore()

// 语言选项 / Language options
const languageOptions = [
  { value: 'zh', label: t('settings.chinese') },
  { value: 'en', label: t('settings.english') }
]

// 配置数据 / Configuration data
const configData = ref<any>({
  language: 'zh',
  server: {
    host: '127.0.0.1',
    port: 1106,
    cors: {
      origin: ['http://localhost:1107', 'http://127.0.0.1:1107'],
      credentials: true
    }
  },
  terminal: {
    defaultShell: 'pwsh.exe',
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    maxBufferSize: 10000,
    sessionTimeout: 86400000
  },
  mcp: {
    enableDnsRebindingProtection: false,
    allowedHosts: ['127.0.0.1', 'localhost', 'localhost:1106']
  },
  logging: {
    level: 'info',
    enableConsole: true,
    enableFile: false,
    filePath: './logs/app.log'
  }
})
const originalConfigData = ref<any>({})
const isLoading = ref(false)
const hasChanges = ref(false)

// 对话框状态 / Dialog state
const showResetDialog = ref(false)

// 当前选择的语言 / Current selected language
const selectedLanguage = computed({
  get: () => configData.value.language || locale.value,
  set: (value: string) => {
    configData.value.language = value
    hasChanges.value = true
  }
})

// 返回首页 / Go back to home
const goBack = () => {
  router.push('/')
}

// 加载配置 / Load configuration
const loadConfiguration = async () => {
  try {
    isLoading.value = true
    await settingsStore.loadFullConfig()
    configData.value = JSON.parse(JSON.stringify(settingsStore.configData))
    originalConfigData.value = JSON.parse(JSON.stringify(settingsStore.configData))
    hasChanges.value = false
  } catch (error) {
    console.error('Failed to load configuration:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: 'Failed to load configuration',
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

// 保存配置 / Save configuration
const saveConfiguration = async () => {
  try {
    isLoading.value = true
    await settingsStore.saveFullConfig(configData.value)
    // 更新语言设置 / Update language setting
    if (configData.value.language) {
      locale.value = configData.value.language
      localStorage.setItem('language', configData.value.language)
    }
    
    originalConfigData.value = JSON.parse(JSON.stringify(configData.value))
    hasChanges.value = false
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('settings.configSaved'),
      life: 3000
    })
  } catch (error) {
    console.error('Failed to save configuration:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: 'Failed to save configuration',
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

// 重置配置 / Reset configuration
const resetConfiguration = async () => {
  try {
    isLoading.value = true
    await settingsStore.resetSettings()
    await loadConfiguration()
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('settings.configReset'),
      life: 3000
    })
  } catch (error) {
    console.error('Failed to reset configuration:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: 'Failed to reset configuration',
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

// 确认重置 / Confirm reset
const confirmReset = () => {
  showResetDialog.value = true
}

// 拒绝重置 / Reject reset
const rejectReset = () => {
  showResetDialog.value = false
}

// 监听配置变化 / Watch for configuration changes
watch(configData, () => {
  hasChanges.value = JSON.stringify(configData.value) !== JSON.stringify(originalConfigData.value)
}, { deep: true })

// 初始化 / Initialize
onMounted(async () => {
  await loadConfiguration()
})
</script>

<template>
  <div class="settings-page min-h-screen bg-jet-black text-text-primary relative overflow-y-auto luxury-settings-container">
    <Toast />
    <ConfirmationDialog
      :visible="showResetDialog"
      :message="t('settings.resetConfirm')"
      :header="t('common.confirm')"
      icon="pi pi-exclamation-triangle"
      @accept="resetConfiguration"
      @reject="rejectReset"
    />
    
    <!-- 奢华页面头部 / Luxury page header -->
    <div class="luxury-header sticky top-0 z-10 animate-slide-up">
      <div class="max-w-6xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <Button
              icon="pi pi-arrow-left"
              :label="t('settings.backToHome')"
              text
              severity="secondary"
              class="text-text-secondary hover:text-luxury-gold hover:bg-luxury-glass transition-all duration-200 hover:shadow-luxury luxury-back-button"
              @click="goBack"
            />
            <h1 class="text-2xl font-bold font-serif-luxury bg-gradient-luxury bg-clip-text text-transparent">{{ t('settings.title') }}</h1>
          </div>
          
          <!-- 奢华操作按钮 / Luxury action buttons -->
          <div class="flex items-center space-x-3">
            <Button
              :label="t('settings.reset')"
              icon="pi pi-refresh"
              severity="secondary"
              class="text-text-secondary hover:text-rose-gold hover:bg-rose-gold-glass transition-all duration-200 hover:shadow-luxury luxury-reset-button"
              @click="confirmReset"
              :disabled="isLoading"
            />
            <Button
              :label="t('settings.save')"
              icon="pi pi-save"
              severity="primary"
              class="bg-luxury-gold hover:bg-rose-gold text-jet-black font-semibold transition-all duration-200 hover:shadow-luxury hover:scale-105 luxury-save-button"
              @click="saveConfiguration"
              :disabled="!hasChanges || isLoading"
              :loading="isLoading"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 设置内容 / Settings content -->
    <div class="max-w-5xl mx-auto px-8 py-10" v-if="!isLoading">
      <div class="space-y-8">
        <!-- 奢华应用配置 / Luxury application configuration -->
        <Card class="luxury-card border border-luxury-gold hover:shadow-luxury hover:border-rose-gold transition-all duration-300 animate-fade-in group">
          <template #title>
            <div class="flex items-center space-x-2">
              <i class="pi pi-cog text-luxury-gold"></i>
              <span class="text-text-primary font-semibold font-serif-luxury">{{ t('settings.appConfig') }}</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-6">
              <div class="flex flex-col space-y-2">
                <label class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-language text-luxury-gold"></i>
                  <span class="font-serif-luxury">{{ t('settings.language') }}</span>
                </label>
                <div class="space-y-3">
                  <div
                    v-for="option in languageOptions"
                    :key="option.value"
                    class="flex items-center space-x-3 p-3 rounded-lg bg-charcoal border border-luxury-gold hover:bg-luxury-glass transition-colors duration-200 luxury-language-option"
                  >
                    <RadioButton
                      v-model="selectedLanguage"
                      :inputId="`lang-${option.value}`"
                      :value="option.value"
                    />
                    <label :for="`lang-${option.value}`" class="text-text-primary cursor-pointer">
                      {{ option.label }}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- 奢华服务器配置 / Luxury server configuration -->
        <Card class="luxury-card border border-rose-gold hover:shadow-luxury hover:border-luxury-gold transition-all duration-300 animate-fade-in group">
          <template #title>
            <div class="flex items-center space-x-2">
              <i class="pi pi-server text-rose-gold"></i>
              <span class="text-text-primary font-semibold font-serif-luxury">{{ t('settings.serverConfig') }}</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-6">
              <div class="flex flex-col space-y-2">
                <label for="host" class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-globe text-rose-gold"></i>
                  <span class="font-serif-luxury">{{ t('settings.host') }}</span>
                </label>
                <InputText
                  id="host"
                  v-model="configData.server.host"
                  class="w-full max-w-md bg-charcoal border-rose-gold text-text-primary focus:border-luxury-gold luxury-input"
                  placeholder="127.0.0.1"
                />
              </div>
              
              <div class="flex flex-col space-y-2">
                <label for="port" class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-key text-rose-gold"></i>
                  <span class="font-serif-luxury">{{ t('settings.port') }}</span>
                </label>
                <InputNumber
                  id="port"
                  v-model="configData.server.port"
                  class="w-full max-w-md bg-charcoal border-rose-gold text-text-primary focus:border-luxury-gold luxury-input"
                  :min="1"
                  :max="65535"
                />
              </div>
              
              <div class="flex flex-col space-y-2">
                <label class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-shield text-rose-gold"></i>
                  <span class="font-serif-luxury">{{ t('settings.corsOrigin') }}</span>
                </label>
                <div class="space-y-2">
                  <div
                    v-for="(origin, index) in configData.server.cors.origin"
                    :key="index"
                    class="flex items-center space-x-2"
                  >
                    <InputText
                      v-model="configData.server.cors.origin[index]"
                      class="flex-1 bg-charcoal border-rose-gold text-text-primary focus:border-luxury-gold luxury-input"
                      placeholder="http://localhost:1107"
                    />
                    <Button
                      icon="pi pi-times"
                      severity="danger"
                      size="small"
                      text
                      class="text-text-muted hover:text-red-500"
                      @click="configData.server.cors.origin.splice(index, 1)"
                    />
                  </div>
                  <Button
                    icon="pi pi-plus"
                    :label="t('common.create')"
                    severity="secondary"
                    size="small"
                    class="text-rose-gold hover:bg-luxury-glass luxury-add-button"
                    @click="configData.server.cors.origin.push('')"
                  />
                </div>
              </div>
              
              <div class="flex flex-col space-y-2">
                <label class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-check text-neon-purple"></i>
                  <span>{{ t('settings.corsCredentials') }}</span>
                </label>
                <div class="flex items-center">
                  <ToggleButton
                    v-model="configData.server.cors.credentials"
                    onLabel="Enabled"
                    offLabel="Disabled"
                    onIcon="pi pi-check"
                    offIcon="pi pi-times"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- 奢华终端配置 / Luxury terminal configuration -->
        <Card class="luxury-card border border-platinum hover:shadow-luxury hover:border-luxury-gold transition-all duration-300 animate-fade-in group">
          <template #title>
            <div class="flex items-center space-x-2">
              <i class="pi pi-desktop text-platinum"></i>
              <span class="text-text-primary font-semibold font-serif-luxury">{{ t('settings.terminalConfig') }}</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-6">
              <div class="flex flex-col space-y-2">
                <label for="defaultShell" class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-terminal text-neon-green"></i>
                  <span>{{ t('settings.defaultShell') }}</span>
                </label>
                <InputText
                  id="defaultShell"
                  v-model="configData.terminal.defaultShell"
                  class="w-full max-w-md bg-charcoal border-border-dark text-text-primary focus:border-neon-green"
                  placeholder="pwsh.exe"
                />
              </div>
              
              <div class="flex flex-col space-y-2">
                <label for="fontSize" class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-text text-neon-green"></i>
                  <span>{{ t('settings.fontSize') }}</span>
                </label>
                <InputNumber
                  id="fontSize"
                  v-model="configData.terminal.fontSize"
                  class="w-full max-w-md bg-charcoal border-border-dark text-text-primary focus:border-neon-green"
                  :min="8"
                  :max="72"
                />
              </div>
              
              <div class="flex flex-col space-y-2">
                <label for="fontFamily" class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-font text-neon-green"></i>
                  <span>{{ t('settings.fontFamily') }}</span>
                </label>
                <InputText
                  id="fontFamily"
                  v-model="configData.terminal.fontFamily"
                  class="w-full max-w-md bg-charcoal border-border-dark text-text-primary focus:border-neon-green"
                  placeholder="Consolas, 'Courier New', monospace"
                />
              </div>
              
              <div class="flex flex-col space-y-2">
                <label for="maxBufferSize" class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-database text-neon-green"></i>
                  <span>{{ t('settings.maxBufferSize') }}</span>
                </label>
                <InputNumber
                  id="maxBufferSize"
                  v-model="configData.terminal.maxBufferSize"
                  class="w-full max-w-md bg-charcoal border-border-dark text-text-primary focus:border-neon-green"
                  :min="1000"
                  :max="100000"
                />
              </div>
              
              <div class="flex flex-col space-y-2">
                <label for="sessionTimeout" class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-clock text-neon-green"></i>
                  <span>{{ t('settings.sessionTimeout') }}</span>
                </label>
                <InputNumber
                  id="sessionTimeout"
                  v-model="configData.terminal.sessionTimeout"
                  class="w-full max-w-md bg-charcoal border-border-dark text-text-primary focus:border-neon-green"
                  :min="60000"
                  :max="604800000"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- MCP配置 / MCP configuration -->
        <Card class="glass-effect border border-border-dark hover:shadow-glass hover:border-accent-cyan transition-all duration-300 animate-fade-in group">
          <template #title>
            <div class="flex items-center space-x-2">
              <i class="pi pi-link text-accent-cyan"></i>
              <span class="text-text-primary font-semibold">{{ t('settings.mcpConfig') }}</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-6">
              <div class="flex flex-col space-y-2">
                <label class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-shield text-accent-cyan"></i>
                  <span>{{ t('settings.enableDnsRebindingProtection') }}</span>
                </label>
                <div class="flex items-center">
                  <ToggleButton
                    v-model="configData.mcp.enableDnsRebindingProtection"
                    onLabel="Enabled"
                    offLabel="Disabled"
                    onIcon="pi pi-check"
                    offIcon="pi pi-times"
                  />
                </div>
              </div>
              
              <div class="flex flex-col space-y-2">
                <label class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-list text-accent-cyan"></i>
                  <span>{{ t('settings.allowedHosts') }}</span>
                </label>
                <div class="space-y-2">
                  <div
                    v-for="(host, index) in configData.mcp.allowedHosts"
                    :key="index"
                    class="flex items-center space-x-2"
                  >
                    <InputText
                      v-model="configData.mcp.allowedHosts[index]"
                      class="flex-1 bg-charcoal border-border-dark text-text-primary focus:border-accent-cyan"
                      placeholder="127.0.0.1"
                    />
                    <Button
                      icon="pi pi-times"
                      severity="danger"
                      size="small"
                      text
                      class="text-text-muted hover:text-red-500"
                      @click="configData.mcp.allowedHosts.splice(index, 1)"
                    />
                  </div>
                  <Button
                    icon="pi pi-plus"
                    :label="t('common.create')"
                    severity="secondary"
                    size="small"
                    class="text-accent-cyan hover:bg-slate-dark"
                    @click="configData.mcp.allowedHosts.push('')"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- 日志配置 / Logging configuration -->
        <Card class="glass-effect border border-border-dark hover:shadow-glass hover:border-accent-violet transition-all duration-300 animate-fade-in group">
          <template #title>
            <div class="flex items-center space-x-2">
              <i class="pi pi-file text-accent-violet"></i>
              <span class="text-text-primary font-semibold">{{ t('settings.loggingConfig') }}</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-6">
              <div class="flex flex-col space-y-2">
                <label for="logLevel" class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-filter text-accent-violet"></i>
                  <span>{{ t('settings.logLevel') }}</span>
                </label>
                <InputText
                  id="logLevel"
                  v-model="configData.logging.level"
                  class="w-full max-w-md bg-charcoal border-border-dark text-text-primary focus:border-accent-violet"
                  placeholder="info"
                />
              </div>
              
              <div class="flex flex-col space-y-2">
                <label class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-desktop text-accent-violet"></i>
                  <span>{{ t('settings.enableConsole') }}</span>
                </label>
                <div class="flex items-center">
                  <ToggleButton
                    v-model="configData.logging.enableConsole"
                    onLabel="Enabled"
                    offLabel="Disabled"
                    onIcon="pi pi-check"
                    offIcon="pi pi-times"
                  />
                </div>
              </div>
              
              <div class="flex flex-col space-y-2">
                <label class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-file text-accent-violet"></i>
                  <span>{{ t('settings.enableFile') }}</span>
                </label>
                <div class="flex items-center">
                  <ToggleButton
                    v-model="configData.logging.enableFile"
                    onLabel="Enabled"
                    offLabel="Disabled"
                    onIcon="pi pi-check"
                    offIcon="pi pi-times"
                  />
                </div>
              </div>
              
              <div class="flex flex-col space-y-2" v-if="configData.logging.enableFile">
                <label for="filePath" class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-folder text-accent-violet"></i>
                  <span>{{ t('settings.filePath') }}</span>
                </label>
                <InputText
                  id="filePath"
                  v-model="configData.logging.filePath"
                  class="w-full max-w-md bg-charcoal border-border-dark text-text-primary focus:border-accent-violet"
                  placeholder="./logs/app.log"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- 奢华加载状态 / Luxury loading state -->
    <div v-else class="flex items-center justify-center min-h-96">
      <div class="text-center animate-fade-in">
        <div class="text-4xl text-luxury-gold mb-4">
          <i class="pi pi-spin pi-spinner"></i>
        </div>
        <p class="text-text-secondary text-lg font-serif-luxury">{{ t('common.loading') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 奢华设置页面特有样式 / Luxury SettingsView specific styles */

/* 奢华卡片样式 / Luxury card styles */
.luxury-card {
  background: var(--luxury-glass);
  backdrop-filter: blur(20px);
  border: 1px solid var(--luxury-gold);
  border-radius: 1rem;
  box-shadow: var(--multi-shadow);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.luxury-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--luxury-glow);
  border-color: var(--rose-gold);
}

/* 奢华输入框样式 / Luxury input styles */
.luxury-input {
  background: var(--charcoal);
  border: 1px solid var(--luxury-gold);
  border-radius: 0.5rem;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.luxury-input:focus {
  border-color: var(--luxury-gold);
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
  outline: none;
}

/* 奢华按钮样式 / Luxury button styles */
.luxury-back-button:hover {
  color: var(--luxury-gold);
  background: var(--luxury-glass);
  box-shadow: var(--luxury-shadow);
}

.luxury-reset-button:hover {
  color: var(--rose-gold);
  background: var(--rose-gold-glass);
  box-shadow: var(--luxury-shadow);
}

.luxury-save-button {
  background: var(--luxury-gold);
  color: var(--jet-black);
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: var(--luxury-shadow);
}

.luxury-save-button:hover {
  background: var(--rose-gold);
  transform: translateY(-2px);
  box-shadow: var(--luxury-glow);
}

.luxury-add-button {
  color: var(--rose-gold);
  border-color: var(--rose-gold);
  transition: all 0.3s ease;
}

.luxury-add-button:hover {
  background: var(--rose-gold-glass);
  box-shadow: var(--luxury-shadow);
}

/* 奢华语言选项样式 / Luxury language option styles */
.luxury-language-option {
  background: var(--charcoal);
  border: 1px solid var(--luxury-gold);
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.luxury-language-option:hover {
  background: var(--luxury-glass);
  border-color: var(--rose-gold);
  box-shadow: var(--luxury-shadow);
}

/* 响应式设计 / Responsive design */
@media (max-width: 768px) {
  .max-w-6xl {
    max-width: 100%;
  }
  
  .px-6 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .py-8 {
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
  }
}

/* 减少动画偏好支持 / Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-slide-up,
  .animate-luxury-float {
    animation: none;
    transition: none;
  }
}
</style>