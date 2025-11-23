<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { useTerminalStore } from '../stores/terminal'
import { initializeApiService, terminalApi } from '../services/api-service'

const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const terminalStore = useTerminalStore()

// Terminal management state / 终端管理状态
const terminals = ref<any[]>([])
const isLoading = ref(true)
const activeTerminalId = ref<string | null>(null)
const terminalInstances = ref<Map<string, { term: Terminal, fitAddon: FitAddon, ws: WebSocket }>>(new Map())

// Computed properties / 计算属性
const stats = computed(() => terminalStore.stats)
const activeTerminal = computed(() => 
  terminals.value.find(t => t.id === activeTerminalId.value)
)

// Fetch terminals from API / 从API获取终端列表
const fetchTerminals = async () => {
  try {
    // Use dynamic API service / 使用动态API服务
    const response = await terminalApi.list()
    if (!response.ok) {
      throw new Error('Failed to fetch terminals')
    }
    const data = await response.json()
    
    const fetchedTerminals = data.terminals || []
    terminals.value = fetchedTerminals
    terminalStore.updateTerminals(fetchedTerminals)
    
    // Auto-select first terminal if none selected / 如果没有选中终端，自动选择第一个
    if (fetchedTerminals.length > 0 && !activeTerminalId.value) {
      activeTerminalId.value = fetchedTerminals[0].id
    }
  } catch (error) {
    console.error('Error fetching terminals:', error)
    terminals.value = []
    terminalStore.updateTerminals([])
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('messages.fetchTerminalsError'),
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}


// Delete terminal / 删除终端
const deleteTerminal = async (id: string) => {
  try {
    // Close terminal instance first / 先关闭终端实例
    const terminalInstance = terminalInstances.value.get(id)
    if (terminalInstance) {
      if (terminalInstance.ws) {
        terminalInstance.ws.close()
      }
      if (terminalInstance.term) {
        terminalInstance.term.dispose()
      }
      terminalInstances.value.delete(id)
    }
    
    // Use dynamic API service / 使用动态API服务
    const response = await terminalApi.delete(id)

    if (!response.ok) {
      throw new Error('Failed to delete terminal')
    }

    terminals.value = terminals.value.filter(t => t.id !== id)
    terminalStore.updateTerminals(terminals.value)
    
    // Select another terminal if the deleted one was active / 如果删除的是当前活跃终端，选择另一个
    if (activeTerminalId.value === id && terminals.value.length > 0) {
      activeTerminalId.value = terminals.value[0].id
    } else if (terminals.value.length === 0) {
      activeTerminalId.value = null
    }
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('messages.terminalDeleted'),
      life: 3000
    })
  } catch (error) {
    console.error('Error deleting terminal:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('messages.deleteTerminalError'),
      life: 3000
    })
  }
}

// Initialize terminal instance / 初始化终端实例
const initializeTerminal = async (terminalId: string) => {
  if (terminalInstances.value.has(terminalId)) {
    return // Already initialized / 已经初始化过了
  }

  try {
    // Create xterm instance / 创建xterm实例
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selectionBackground: '#ffffff40'
      },
      convertEol: true,
      rows: 30,
      cols: 100
    })

    // Add FitAddon / 添加FitAddon
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    // Create WebSocket connection / 创建WebSocket连接
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // Connect to backend port 1106, not frontend port 1107 / 连接到后端端口1106，而不是前端端口1107
    const wsUrl = `${protocol}//127.0.0.1:1106`
    const ws = new WebSocket(wsUrl)

    // WebSocket event handlers / WebSocket事件处理
    ws.onopen = () => {
      console.log(`WebSocket connected for terminal ${terminalId}`)
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.terminalId === terminalId && message.type === 'output') {
        term.write(message.data)
      }
    }

    ws.onerror = (error) => {
      console.error(`WebSocket error for terminal ${terminalId}:`, error)
    }

    ws.onclose = () => {
      console.log(`WebSocket disconnected for terminal ${terminalId}`)
    }

    // Terminal data handling / 终端数据处理
    term.onData((data) => {
      sendTerminalInput(terminalId, data)
    })

    // Save instance / 保存实例
    terminalInstances.value.set(terminalId, { term, fitAddon, ws })

    // Wait for DOM update then open terminal / 等待DOM更新后打开终端
    await nextTick()
    const container = document.getElementById(`terminal-${terminalId}`)
    if (container) {
      term.open(container)
      fitAddon.fit()
      
      // Load historical output / 加载历史输出
      loadTerminalOutput(terminalId)
    }

    // Listen for window resize / 监听窗口大小变化
    const resizeHandler = () => {
      const instance = terminalInstances.value.get(terminalId)
      if (instance) {
        instance.fitAddon.fit()
      }
    }
    window.addEventListener('resize', resizeHandler)

  } catch (error) {
    console.error(`Failed to initialize terminal ${terminalId}:`, error)
  }
}

// Load terminal historical output / 加载终端历史输出
const loadTerminalOutput = async (terminalId: string) => {
  try {
    // Use dynamic API service / 使用动态API服务
    const response = await terminalApi.readOutput(terminalId)
    if (!response.ok) {
      throw new Error('Failed to load output')
    }
    const data = await response.json()
    
    const instance = terminalInstances.value.get(terminalId)
    if (instance && data.output) {
      instance.term.write(data.output)
    }
  } catch (error) {
    console.error(`Failed to load output for terminal ${terminalId}:`, error)
  }
}

// Send terminal input / 发送终端输入
const sendTerminalInput = async (terminalId: string, input: string) => {
  try {
    // Use dynamic API service / 使用动态API服务
    const response = await terminalApi.writeInput(terminalId, input)
    
    if (!response.ok) {
      throw new Error('Failed to send input')
    }
  } catch (error) {
    console.error(`Failed to send input to terminal ${terminalId}:`, error)
  }
}

// Switch terminal / 切换终端
const switchTerminal = (terminalId: string) => {
  activeTerminalId.value = terminalId
  initializeTerminal(terminalId)
}

// Clear terminal / 清空终端
const clearTerminal = (terminalId: string) => {
  const instance = terminalInstances.value.get(terminalId)
  if (instance && instance.term) {
    instance.term.clear()
  }
}

// Reconnect terminal / 重新连接终端
const reconnectTerminal = (terminalId: string) => {
  // Close existing connection / 关闭现有连接
  const instance = terminalInstances.value.get(terminalId)
  if (instance && instance.ws) {
    instance.ws.close()
  }
  if (instance && instance.term) {
    instance.term.dispose()
  }
  terminalInstances.value.delete(terminalId)
  
  // Re-initialize / 重新初始化
  initializeTerminal(terminalId)
}

// Helper functions / 辅助函数
const getStatusSeverity = (status: string) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'warning'
    case 'terminated':
      return 'danger'
    default:
      return 'info'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return 'pi-check-circle'
    case 'inactive':
      return 'pi-pause-circle'
    case 'terminated':
      return 'pi-times-circle'
    default:
      return 'pi-question-circle'
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return t('home.justNow')
  if (diffMins < 60) return `${diffMins} ${t('home.minutesAgo')}`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} ${t('home.hoursAgo')}`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} ${t('home.daysAgo')}`
}

// Watchers / 监听器
watch(() => terminalStore.refreshTrigger, () => {
  fetchTerminals()
})

watch(() => activeTerminalId.value, (newId) => {
  if (newId) {
    initializeTerminal(newId)
  }
})

// Lifecycle hooks / 生命周期钩子
onMounted(async () => {
  try {
    // Initialize API service first / 首先初始化API服务
    await initializeApiService()
    console.log('API service initialized, fetching terminals...')
    fetchTerminals()
  } catch (error) {
    console.error('Failed to initialize API service:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: 'Failed to initialize API service',
      life: 3000
    })
    isLoading.value = false
  }
})

onUnmounted(() => {
  // Clean up all terminal instances / 清理所有终端实例
  terminalInstances.value.forEach((instance) => {
    if (instance.ws) {
      instance.ws.close()
    }
    if (instance.term) {
      instance.term.dispose()
    }
  })
  terminalInstances.value.clear()
})

// Watch terminal list changes, auto-initialize new terminals / 监听终端列表变化，自动初始化新终端
watch(terminals, (newTerminals) => {
  if (newTerminals.length > 0 && !activeTerminalId.value) {
    activeTerminalId.value = newTerminals[0].id
  }
}, { deep: true })
</script>

<template>
  <div class="h-screen bg-jet-black flex flex-col overflow-hidden">
    <Toast />
    
    <!-- Loading state / 加载状态 -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="text-center animate-fade-in">
        <div class="text-4xl text-neon-blue mb-4">
          <i class="pi pi-spin pi-spinner"></i>
        </div>
        <p class="text-text-secondary text-lg">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Main workspace / 主工作区 - 全屏终端布局 -->
    <div v-else class="flex-1 flex overflow-hidden">
      <!-- Left sidebar with terminal tabs / 左侧边栏带终端标签 -->
      <aside class="w-80 bg-charcoal border-r border-border-dark flex flex-col flex-shrink-0">
        <div class="p-4 border-b border-border-dark bg-onyx">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i class="pi pi-terminal text-neon-blue"></i>
              <span class="font-semibold text-text-primary">{{ t('home.terminals') }}</span>
              <Badge :value="stats.total" severity="info" class="text-xs" />
            </div>
          </div>
        </div>

        <!-- Terminal tabs / 终端标签 -->
        <div class="flex-1 overflow-y-auto p-2">
          <div v-if="terminals.length === 0" class="flex flex-col items-center justify-center h-full text-center p-8">
            <div class="text-5xl text-text-muted mb-4">
              <i class="pi pi-inbox"></i>
            </div>
            <p class="text-text-secondary mb-2">{{ t('home.noTerminals') }}</p>
            <p class="text-text-muted text-sm">请使用CTI工具创建终端</p>
          </div>
          
          <div v-else class="space-y-2">
            <div
              v-for="terminal in terminals"
              :key="terminal.id"
              :class="['p-3 rounded-lg border cursor-pointer transition-all duration-200',
                       { 'bg-slate-darker border-neon-blue shadow-neon-blue': terminal.id === activeTerminalId,
                         'bg-onyx border-border-dark hover:bg-slate-dark hover:border-border-medium': terminal.id !== activeTerminalId }]"
              @click="switchTerminal(terminal.id)"
            >
              <div class="flex flex-col space-y-2">
                <div class="flex justify-between items-center">
                  <div class="flex items-center space-x-2">
                    <span class="font-mono text-sm font-semibold text-text-primary bg-slate-dark px-2 py-1 rounded">
                      {{ terminal.id || 'N/A' }}
                    </span>
                    <Badge
                      :severity="getStatusSeverity(terminal.status)"
                      :value="terminal.status"
                      class="text-xs"
                    />
                  </div>
                  <div class="flex space-x-1 opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                      icon="pi pi-trash"
                      v-tooltip="t('terminal.clear')"
                      severity="secondary"
                      size="small"
                      text
                      class="w-6 h-6 text-text-muted hover:text-text-primary"
                      @click.stop="clearTerminal(terminal.id)"
                    />
                    <Button
                      icon="pi pi-refresh"
                      v-tooltip="t('terminal.reconnect')"
                      severity="secondary"
                      size="small"
                      text
                      class="w-6 h-6 text-text-muted hover:text-text-primary"
                      @click.stop="reconnectTerminal(terminal.id)"
                    />
                    <Button
                      icon="pi pi-times"
                      v-tooltip="t('home.terminate')"
                      severity="danger"
                      size="small"
                      text
                      class="w-6 h-6 text-text-muted hover:text-red-500"
                      @click.stop="deleteTerminal(terminal.id)"
                    />
                  </div>
                </div>
                <div class="space-y-1">
                  <div class="flex items-center space-x-2 text-xs text-text-tertiary">
                    <i class="pi pi-cog w-3"></i>
                    <span class="text-text-muted">PID:</span>
                    <span class="text-text-secondary">{{ terminal.pid }}</span>
                  </div>
                  <div class="flex items-center space-x-2 text-xs text-text-tertiary">
                    <i class="pi pi-folder w-3"></i>
                    <span class="text-text-secondary truncate" :title="terminal.cwd">
                      {{ terminal.cwd || t('home.default') }}
                    </span>
                  </div>
                  <div class="flex items-center space-x-2 text-xs text-text-tertiary">
                    <i class="pi pi-clock w-3"></i>
                    <span class="text-text-secondary">{{ formatDate(terminal.created) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Right main content area / 右侧主内容区域 - 全屏终端 -->
      <main class="flex-1 flex flex-col bg-jet-black overflow-hidden">
        <div v-if="!activeTerminalId" class="flex-1 flex items-center justify-center">
          <div class="text-center animate-fade-in">
            <div class="text-6xl text-text-muted mb-6">
              <i class="pi pi-desktop"></i>
            </div>
            <h3 class="text-2xl font-bold text-text-primary mb-3">{{ t('home.noTerminalSelected') }}</h3>
            <p class="text-text-secondary max-w-md">
              {{ t('home.selectTerminalFromSidebar') }}
            </p>
          </div>
        </div>

        <div v-else class="flex-1 flex flex-col overflow-hidden">
          <!-- Terminal header / 终端头部 -->
          <header class="glass-effect border-b border-border-dark px-4 py-3 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="flex items-center space-x-2">
                <i :class="[getStatusIcon(activeTerminal?.status), 'text-lg']"></i>
                <span class="font-semibold text-text-primary">{{ activeTerminal?.id || 'Terminal ' + (activeTerminalId || 'N/A') }}</span>
                <Badge
                  :severity="getStatusSeverity(activeTerminal?.status)"
                  :value="activeTerminal?.status"
                  class="text-xs"
                />
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <Button
                icon="pi pi-trash"
                v-tooltip="t('terminal.clear')"
                severity="secondary"
                size="small"
                class="w-8 h-8 text-text-secondary hover:text-neon-blue"
                @click="clearTerminal(activeTerminalId!)"
              />
              <Button
                icon="pi pi-refresh"
                v-tooltip="t('terminal.reconnect')"
                severity="secondary"
                size="small"
                class="w-8 h-8 text-text-secondary hover:text-neon-blue"
                @click="reconnectTerminal(activeTerminalId!)"
              />
              <Button
                icon="pi pi-times"
                v-tooltip="t('home.terminate')"
                severity="danger"
                size="small"
                class="w-8 h-8 text-text-secondary hover:text-red-500"
                @click="deleteTerminal(activeTerminalId!)"
              />
            </div>
          </header>

          <!-- Terminal content / 终端内容 - 占满剩余空间 -->
          <div class="flex-1 bg-jet-black overflow-hidden">
            <div
              :id="`terminal-${activeTerminalId}`"
              class="w-full h-full bg-jet-black rounded-lg"
            ></div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* xterm.js 样式优化 / xterm.js styles optimization */
:deep(.xterm) {
  height: 100% !important;
  background: #0a0a0a !important;
  border-radius: 0.5rem !important;
}

:deep(.xterm-viewport) {
  background: #0a0a0a !important;
}

:deep(.xterm-screen) {
  background: #0a0a0a !important;
}

/* 隐藏 xterm.js 辅助元素 / Hide xterm.js helper elements */
:deep(.xterm-helper-textarea),
:deep(.xterm-char-measure-element) {
  position: absolute !important;
  left: -99999px !important;
  top: -99999px !important;
  width: 0 !important;
  height: 0 !important;
  opacity: 0 !important;
  pointer-events: none !important;
  visibility: hidden !important;
  display: none !important;
  font-size: 0 !important;
  line-height: 0 !important;
  z-index: -9999 !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
}

/* 响应式设计 / Responsive design */
@media (max-width: 768px) {
  .w-80 {
    width: 16rem;
  }
}
</style>