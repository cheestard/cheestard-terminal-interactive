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
  <div class="settings-page min-h-screen bg-gradient-dark text-text-primary relative overflow-y-auto">
    <!-- 背景装饰元素 / Background decorative elements -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-0 right-0 w-96 h-96 bg-neon-blue opacity-10 rounded-full filter blur-3xl animate-float"></div>
      <div class="absolute bottom-0 left-0 w-80 h-80 bg-neon-purple opacity-10 rounded-full filter blur-3xl animate-float" style="animation-delay: 2s;"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-green opacity-5 rounded-full filter blur-3xl animate-float" style="animation-delay: 4s;"></div>
    </div>
    <Toast />
    <ConfirmationDialog
      :visible="showResetDialog"
      :message="t('settings.resetConfirm')"
      :header="t('common.confirm')"
      icon="pi pi-exclamation-triangle"
      @accept="resetConfiguration"
      @reject="rejectReset"
    />
    
    <!-- 页面头部 / Page header -->
    <div class="glass-effect border-b border-border-dark sticky top-0 z-10 animate-slide-up">
      <div class="max-w-6xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <Button
              icon="pi pi-arrow-left"
              :label="t('settings.backToHome')"
              text
              severity="secondary"
              class="text-text-secondary hover:text-neon-blue hover:bg-bg-glass-hover transition-all duration-200 hover:shadow-neon-blue"
              @click="goBack"
            />
            <h1 class="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent">{{ t('settings.title') }}</h1>
          </div>
          
          <!-- 操作按钮 / Action buttons -->
          <div class="flex items-center space-x-3">
            <Button
              :label="t('settings.reset')"
              icon="pi pi-refresh"
              severity="secondary"
              class="text-text-secondary hover:text-neon-blue hover:bg-bg-glass-hover transition-all duration-200 hover:shadow-neon-blue"
              @click="confirmReset"
              :disabled="isLoading"
            />
            <Button
              :label="t('settings.save')"
              icon="pi pi-save"
              severity="primary"
              class="bg-neon-blue hover:bg-neon-purple text-jet-black font-semibold transition-all duration-200 hover:shadow-neon-blue hover:scale-105"
              @click="saveConfiguration"
              :disabled="!hasChanges || isLoading"
              :loading="isLoading"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 设置内容 / Settings content -->
    <div class="max-w-6xl mx-auto px-6 py-8" v-if="!isLoading">
      <div class="space-y-6">
        <!-- 应用配置 / Application configuration -->
        <Card class="glass-effect border border-border-dark hover:shadow-glass hover:border-neon-blue transition-all duration-300 animate-fade-in group">
          <template #title>
            <div class="flex items-center space-x-2">
              <i class="pi pi-cog text-neon-blue"></i>
              <span class="text-text-primary font-semibold">{{ t('settings.appConfig') }}</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-6">
              <div class="flex flex-col space-y-2">
                <label class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-language text-neon-blue"></i>
                  <span>{{ t('settings.language') }}</span>
                </label>
                <div class="space-y-3">
                  <div
                    v-for="option in languageOptions"
                    :key="option.value"
                    class="flex items-center space-x-3 p-3 rounded-lg bg-charcoal border border-border-dark hover:bg-slate-dark transition-colors duration-200"
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

        <!-- 服务器配置 / Server configuration -->
        <Card class="glass-effect border border-border-dark hover:shadow-glass hover:border-neon-purple transition-all duration-300 animate-fade-in group">
          <template #title>
            <div class="flex items-center space-x-2">
              <i class="pi pi-server text-neon-purple"></i>
              <span class="text-text-primary font-semibold">{{ t('settings.serverConfig') }}</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-6">
              <div class="flex flex-col space-y-2">
                <label for="host" class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-globe text-neon-purple"></i>
                  <span>{{ t('settings.host') }}</span>
                </label>
                <InputText
                  id="host"
                  v-model="configData.server.host"
                  class="w-full max-w-md bg-charcoal border-border-dark text-text-primary focus:border-neon-purple"
                  placeholder="127.0.0.1"
                />
              </div>
              
              <div class="flex flex-col space-y-2">
                <label for="port" class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-key text-neon-purple"></i>
                  <span>{{ t('settings.port') }}</span>
                </label>
                <InputNumber
                  id="port"
                  v-model="configData.server.port"
                  class="w-full max-w-md bg-charcoal border-border-dark text-text-primary focus:border-neon-purple"
                  :min="1"
                  :max="65535"
                />
              </div>
              
              <div class="flex flex-col space-y-2">
                <label class="flex items-center space-x-2 text-text-primary font-medium">
                  <i class="pi pi-shield text-neon-purple"></i>
                  <span>{{ t('settings.corsOrigin') }}</span>
                </label>
                <div class="space-y-2">
                  <div
                    v-for="(origin, index) in configData.server.cors.origin"
                    :key="index"
                    class="flex items-center space-x-2"
                  >
                    <InputText
                      v-model="configData.server.cors.origin[index]"
                      class="flex-1 bg-charcoal border-border-dark text-text-primary focus:border-neon-purple"
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
                    class="text-neon-purple hover:bg-slate-dark"
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

        <!-- 终端配置 / Terminal configuration -->
        <Card class="glass-effect border border-border-dark hover:shadow-glass hover:border-neon-green transition-all duration-300 animate-fade-in group">
          <template #title>
            <div class="flex items-center space-x-2">
              <i class="pi pi-desktop text-neon-green"></i>
              <span class="text-text-primary font-semibold">{{ t('settings.terminalConfig') }}</span>
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

    <!-- 加载状态 / Loading state -->
    <div v-else class="flex items-center justify-center min-h-96">
      <div class="text-center animate-fade-in">
        <div class="text-4xl text-neon-blue mb-4">
          <i class="pi pi-spin pi-spinner"></i>
        </div>
        <p class="text-text-secondary text-lg">{{ t('common.loading') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* SettingsView 特有样式 / SettingsView specific styles */

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
  .animate-slide-up {
    animation: none;
    transition: none;
  }
}
</style>