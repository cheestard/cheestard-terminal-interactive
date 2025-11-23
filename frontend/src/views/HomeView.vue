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
import VirtualScroller from 'primevue/virtualscroller'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { useTerminalStore } from '../stores/terminal'

const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const terminalStore = useTerminalStore()

const terminals = ref<any[]>([])
const isLoading = ref(true)
const newTerminalShell = ref('')
const newTerminalCwd = ref('')

// 终端相关状态
const terminalInstances = ref<Map<string, { term: Terminal, fitAddon: FitAddon, ws: WebSocket }>>(new Map())
const activeTerminalId = ref<string | null>(null)

// 直接使用store中的showCreateModal，避免状态同步问题
const showCreateModal = computed({
  get: () => terminalStore.showCreateModal,
  set: (value) => {
    if (!value) {
      terminalStore.closeCreateModal()
    }
  }
})

// 计算属性 - 使用store中的统计数据
const stats = computed(() => terminalStore.stats)

const fetchTerminals = async () => {
  try {
    const response = await fetch('/api/terminals')
    if (!response.ok) {
      throw new Error('Failed to fetch terminals')
    }
    const data = await response.json()
    
    // 使用后端返回的终端数据，不进行任何ID修改
    const fetchedTerminals = data.terminals || []
    
    // 更新本地状态和store
    terminals.value = fetchedTerminals
    terminalStore.updateTerminals(fetchedTerminals)
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

const createTerminal = async () => {
  try {
    const response = await fetch('/api/terminals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shell: newTerminalShell.value || undefined,
        cwd: newTerminalCwd.value || undefined,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create terminal')
    }

    const newTerminal = await response.json()
    
    // 直接使用后端返回的数据，不修改ID
    terminals.value.unshift(newTerminal) // 添加到开头
    
    // 更新store中的终端列表
    terminalStore.updateTerminals(terminals.value)
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('messages.terminalCreated'),
      life: 3000
    })

    // Reset form and close modal
    newTerminalShell.value = ''
    newTerminalCwd.value = ''
    handleCancelModal()
  } catch (error) {
    console.error('Error creating terminal:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('messages.createTerminalError'),
      life: 3000
    })
  }
}

// 处理模态框关闭
const handleCancelModal = () => {
  terminalStore.closeCreateModal()
}

// 处理模态框可见性变化
const handleModalVisibilityChange = (visible: boolean) => {
  if (!visible) {
    terminalStore.closeCreateModal()
  }
}

const deleteTerminal = async (id: string) => {
  try {
    // 先关闭终端实例
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

    const response = await fetch(`/api/terminals/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete terminal')
    }

    terminals.value = terminals.value.filter(t => t.id !== id)
    
    // 更新store中的终端列表
    terminalStore.updateTerminals(terminals.value)
    
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

// 初始化终端实例
const initializeTerminal = async (terminalId: string) => {
  if (terminalInstances.value.has(terminalId)) {
    return // 已经初始化过了
  }

  try {
    // 创建xterm实例
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selection: '#ffffff40'
      },
      convertEol: true,
      rows: 15,
      cols: 80
    })

    // 添加FitAddon
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    // 创建WebSocket连接 - 修复端口问题
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    // 如果前端运行在不同端口，需要指定WebSocket端口
    // 使用127.0.0.1而不是localhost，确保与后端监听地址一致
    const wsHost = host.includes(':1107') ? host.replace('localhost', '127.0.0.1') : '127.0.0.1:1107'
    const wsUrl = `${protocol}//${wsHost}`
    const ws = new WebSocket(wsUrl)

    // WebSocket事件处理
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

    // 终端数据处理
    term.onData((data) => {
      sendTerminalInput(terminalId, data)
    })

    // 保存实例
    terminalInstances.value.set(terminalId, { term, fitAddon, ws })

    // 等待DOM更新后打开终端
    await nextTick()
    const container = document.getElementById(`terminal-${terminalId}`)
    if (container) {
      term.open(container)
      fitAddon.fit()
      
      // 加载历史输出
      loadTerminalOutput(terminalId)
    }

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      const instance = terminalInstances.value.get(terminalId)
      if (instance) {
        instance.fitAddon.fit()
      }
    })

  } catch (error) {
    console.error(`Failed to initialize terminal ${terminalId}:`, error)
  }
}

// 加载终端历史输出
const loadTerminalOutput = async (terminalId: string) => {
  try {
    const response = await fetch(`/api/terminals/${terminalId}/output`)
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

// 发送终端输入
const sendTerminalInput = async (terminalId: string, input: string) => {
  try {
    const response = await fetch(`/api/terminals/${terminalId}/input`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input })
    })
    
    if (!response.ok) {
      throw new Error('Failed to send input')
    }
  } catch (error) {
    console.error(`Failed to send input to terminal ${terminalId}:`, error)
  }
}

// 激活终端
const activateTerminal = (terminalId: string) => {
  activeTerminalId.value = terminalId
  initializeTerminal(terminalId)
}

// 清空终端
const clearTerminal = (terminalId: string) => {
  const instance = terminalInstances.value.get(terminalId)
  if (instance && instance.term) {
    instance.term.clear()
  }
}

// 重新连接终端
const reconnectTerminal = (terminalId: string) => {
  // 关闭现有连接
  const instance = terminalInstances.value.get(terminalId)
  if (instance && instance.ws) {
    instance.ws.close()
  }
  if (instance && instance.term) {
    instance.term.dispose()
  }
  terminalInstances.value.delete(terminalId)
  
  // 重新初始化
  initializeTerminal(terminalId)
}

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

// 监听刷新触发器
watch(() => terminalStore.refreshTrigger, () => {
  fetchTerminals()
})

// 监听创建触发器
watch(() => terminalStore.createTrigger, () => {
  // 创建触发器会自动设置showCreateModal为true
})

// 监听模态框显示状态
watch(() => showCreateModal.value, () => {
  // 模态框状态变化
})

onMounted(() => {
  fetchTerminals()
})

onUnmounted(() => {
  // 清理所有终端实例
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

// 监听终端列表变化，自动初始化新终端
watch(terminals, (newTerminals) => {
  newTerminals.forEach(terminal => {
    if (terminal.id && !terminalInstances.value.has(terminal.id)) {
      // 延迟初始化，确保DOM已渲染
      setTimeout(() => {
        initializeTerminal(terminal.id)
      }, 100)
    }
  })
}, { deep: true })
</script>

<template>
  <div class="dashboard-container">
    <Toast />
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-content">
        <div class="loading-spinner">
          <i class="pi pi-spin pi-spinner"></i>
        </div>
        <p class="loading-text">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- 终端列表 - 使用虚拟列表 -->
    <section v-else-if="terminals.length > 0" class="terminals-section">
      <VirtualScroller
        :items="terminals"
        :itemSize="200"
        class="terminal-virtual-list"
        :showLoader="true"
        :delay="200"
      >
        <template #item="{ item: terminal, index }">
          <div
            :key="terminal.id"
            class="terminal-row"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <!-- 左侧终端信息 -->
            <div class="terminal-info-panel">
              <div class="terminal-header-compact">
                <div class="terminal-id-compact">
                  <span class="id-label">{{ t('home.id') }}:</span>
                  <span class="id-value">{{ terminal.id }}</span>
                </div>
                <Badge
                  :severity="getStatusSeverity(terminal.status)"
                  :value="terminal.status"
                  class="status-badge-compact"
                />
              </div>
              
              <div class="terminal-details">
                <div class="detail-item">
                  <i class="pi pi-cog"></i>
                  <span class="detail-label">{{ t('home.pid') }}:</span>
                  <span class="detail-value">{{ terminal.pid }}</span>
                </div>
                <div class="detail-item">
                  <i class="pi pi-cog"></i>
                  <span class="detail-label">{{ t('home.shell') }}:</span>
                  <span class="detail-value">{{ terminal.shell || t('home.default') }}</span>
                </div>
                <div class="detail-item">
                  <i class="pi pi-folder"></i>
                  <span class="detail-label">{{ t('home.directory') }}:</span>
                  <span class="detail-value truncate" :title="terminal.cwd">
                    {{ terminal.cwd || t('home.default') }}
                  </span>
                </div>
                <div class="detail-item">
                  <i class="pi pi-clock"></i>
                  <span class="detail-label">{{ t('home.created') }}:</span>
                  <span class="detail-value">{{ formatDate(terminal.created) }}</span>
                </div>
              </div>
              
              <div class="terminal-controls-compact">
                <Button
                  icon="pi pi-trash"
                  v-tooltip="t('terminal.clear')"
                  severity="secondary"
                  size="small"
                  class="control-btn-compact"
                  @click="clearTerminal(terminal.id)"
                />
                <Button
                  icon="pi pi-refresh"
                  v-tooltip="t('terminal.reconnect')"
                  severity="secondary"
                  size="small"
                  class="control-btn-compact"
                  @click="reconnectTerminal(terminal.id)"
                />
                <Button
                  icon="pi pi-times"
                  v-tooltip="t('home.terminate')"
                  severity="danger"
                  size="small"
                  class="control-btn-compact terminate-btn"
                  @click="deleteTerminal(terminal.id)"
                />
              </div>
            </div>
            
            <!-- 右侧终端内容 -->
            <div class="terminal-content-panel">
              <div
                :id="`terminal-${terminal.id}`"
                class="terminal-output-compact"
                @click="activateTerminal(terminal.id)"
              ></div>
            </div>
          </div>
        </template>
      </VirtualScroller>
    </section>

    <!-- 空状态 -->
    <section v-else class="empty-state">
      <div class="empty-content">
        <div class="empty-icon">
          <i class="pi pi-inbox"></i>
        </div>
        <h3 class="empty-title">{{ t('home.noTerminals') }}</h3>
        <p class="empty-description">
          {{ t('home.createFirstTerminal') }}
        </p>
        <!-- 移除创建新终端按钮 -->
      </div>
    </section>

    <!-- 创建终端模态框 - 使用原生HTML模态框 -->
    <div
      v-if="showCreateModal"
      class="native-modal-overlay"
      @click.self="handleCancelModal"
    >
      <div class="native-modal">
        <div class="native-modal-header">
          <h3 class="native-modal-title">{{ t('home.createNewTerminal') }}</h3>
          <button
            class="native-modal-close"
            @click="handleCancelModal"
            :aria-label="t('common.close')"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="native-modal-content">
          <div class="form-group">
            <label for="shell" class="form-label">
              <i class="pi pi-terminal"></i>
              {{ t('home.shellType') }}
            </label>
            <InputText
              id="shell"
              v-model="newTerminalShell"
              :placeholder="t('home.shellPlaceholder')"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="cwd" class="form-label">
              <i class="pi pi-folder"></i>
              {{ t('home.workingDirectory') }}
            </label>
            <InputText
              id="cwd"
              v-model="newTerminalCwd"
              :placeholder="t('home.directoryPlaceholder')"
              class="form-input"
            />
          </div>
        </div>
        <div class="native-modal-footer">
          <Button
            :label="t('common.cancel')"
            severity="secondary"
            class="modal-btn-secondary"
            @click="handleCancelModal"
          />
          <Button
            :label="t('home.create')"
            severity="primary"
            class="modal-btn-primary"
            @click="createTerminal"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 仪表板容器 */
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  animation: fadeIn var(--transition-slow) ease-out;
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  font-size: var(--text-4xl);
  color: var(--primary-500);
  margin-bottom: var(--spacing);
}

.loading-text {
  color: var(--text-secondary);
  font-size: var(--text-lg);
}

/* 终端列表区域 - 虚拟列表 */
.terminals-section {
  margin-bottom: var(--spacing-xl);
  height: calc(100vh - 200px);
}

.terminal-virtual-list {
  height: 100%;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
}

.terminal-row {
  display: flex;
  height: 200px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-primary);
  transition: all var(--transition-fast);
  animation: slideIn var(--transition-normal) ease-out;
  animation-fill-mode: both;
}

.terminal-row:hover {
  background: var(--bg-secondary);
}

.terminal-row:last-child {
  border-bottom: none;
}

/* 左侧信息面板 */
.terminal-info-panel {
  width: 300px;
  background: #1a1a1a;
  border-right: 1px solid var(--border-light);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.terminal-header-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.terminal-id-compact {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.terminal-id-compact .id-label {
  font-size: var(--text-xs);
  color: #888;
  font-weight: 500;
  text-transform: uppercase;
}

.terminal-id-compact .id-value {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  color: #fff;
  background: #333;
  padding: 2px 6px;
  border-radius: 3px;
}

.status-badge-compact {
  font-size: var(--text-xs);
  font-weight: 600;
}

.terminal-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--text-xs);
  color: #ccc;
}

.detail-item i {
  font-size: var(--text-xs);
  color: #666;
  width: 12px;
}

.detail-label {
  color: #888;
  font-weight: 500;
  min-width: 40px;
}

.detail-value {
  color: #fff;
  font-weight: 400;
  flex: 1;
}

.detail-value.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.terminal-controls-compact {
  display: flex;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

.control-btn-compact {
  background: #333 !important;
  border: 1px solid #555 !important;
  color: #ccc !important;
  width: 28px !important;
  height: 28px !important;
  font-size: var(--text-xs) !important;
  transition: all var(--transition-fast);
}

.control-btn-compact:hover {
  background: #444 !important;
  color: #fff !important;
}

.control-btn-compact.terminate-btn {
  background: #dc3545 !important;
  border-color: #dc3545 !important;
  color: #fff !important;
}

.control-btn-compact.terminate-btn:hover {
  background: #c82333 !important;
}

/* 右侧终端内容面板 */
.terminal-content-panel {
  flex: 1;
  background: #000000;
  position: relative;
  overflow: hidden;
}

.terminal-output-compact {
  width: 100%;
  height: 100%;
  cursor: text;
  font-size: 11px;
}

/* xterm.js样式覆盖 */
:deep(.xterm) {
  height: 100% !important;
  background: #000000 !important;
  border-radius: 0 !important;
}

:deep(.xterm-viewport) {
  background: #000000 !important;
}

:deep(.xterm-screen) {
  background: #000000 !important;
}

/* 隐藏xterm.js的辅助元素 */
:deep(.xterm-helper-textarea) {
  position: absolute !important;
  left: -9999px !important;
  top: -9999px !important;
  width: 0 !important;
  height: 0 !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

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
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  background: var(--bg-primary);
  border: 2px dashed var(--border-medium);
  border-radius: var(--radius-2xl);
  margin-bottom: var(--spacing-xl);
}

.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  font-size: var(--text-6xl);
  color: var(--text-tertiary);
  margin-bottom: var(--spacing-lg);
}

.empty-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing) 0;
}

.empty-description {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xl) 0;
  line-height: var(--leading-relaxed);
}

/* 原生模态框样式 */
.native-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.native-modal {
  background: white;
  border-radius: var(--radius-xl);
  width: 500px;
  max-width: 90%;
  max-height: 90%;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.native-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
}

.native-modal-title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.native-modal-close {
  background: none;
  border: none;
  font-size: var(--text-lg);
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--radius);
  transition: all var(--transition-fast);
}

.native-modal-close:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.native-modal-content {
  padding: var(--spacing-lg);
}

.native-modal-footer {
  display: flex;
  gap: var(--spacing);
  justify-content: flex-end;
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-light);
}

/* 保留原有的模态框样式以备后用 */
.create-modal {
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.modal-content {
  padding: var(--spacing) 0;
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.form-label i {
  color: var(--primary-500);
}

.form-input {
  width: 100%;
  font-size: var(--text-sm);
}

.modal-footer {
  display: flex;
  gap: var(--spacing);
  justify-content: flex-end;
}

.modal-btn-secondary,
.modal-btn-primary {
  min-width: 100px;
}

/* 按钮样式增强 */
.modern-btn-primary,
.modern-btn-secondary {
  padding: var(--spacing-sm) var(--spacing-lg);
  font-weight: 600;
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.modern-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.modern-btn-secondary:hover {
  transform: translateY(-1px);
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

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-container {
    padding: var(--spacing);
  }

  .terminal-info-panel {
    width: 250px;
  }

  .detail-item {
    font-size: 10px;
  }

  .control-btn-compact {
    width: 24px !important;
    height: 24px !important;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .empty-state {
    background: var(--bg-dark-secondary);
    border-color: var(--border-medium);
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  .dashboard-container,
  .terminal-row {
    animation: none;
    transition: none;
  }

  .modern-btn-primary,
  .modern-btn-secondary,
  .control-btn-compact {
    transition: none;
  }
}
</style>