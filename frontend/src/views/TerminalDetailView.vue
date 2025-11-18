<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const toast = useToast()

const terminalId = route.params.id as string
const terminal = ref<any>(null)
const commandInput = ref('')
const terminalOutput = ref<string[]>([])
const isLoading = ref(true)
const isConnected = ref(false)
const isFullscreen = ref(false)
const showCommandHistory = ref(false)
const commandHistory = ref<string[]>([])
const historyIndex = ref(-1)

let ws: WebSocket | null = null
let autoScrollTimer: number | null = null

// 计算属性
const connectionStatus = computed(() => ({
  text: isConnected.value ? t('terminal.connected') : t('terminal.disconnected'),
  severity: isConnected.value ? 'success' : 'danger',
  icon: isConnected.value ? 'pi-check-circle' : 'pi-times-circle'
}))

const terminalStats = computed(() => ({
  outputLines: terminalOutput.value.length,
  uptime: terminal.value ? calculateUptime(terminal.value.created) : '0m',
  lastActivity: terminalOutput.value.length > 0 ? '刚刚' : '无活动'
}))

const calculateUptime = (created: string) => {
  const now = new Date()
  const createdDate = new Date(created)
  const diffMs = now.getTime() - createdDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ${diffHours % 24}h`
}

const fetchTerminalDetails = async () => {
  try {
    const response = await fetch(`/api/terminals/${terminalId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch terminal details')
    }
    const data = await response.json()
    terminal.value = data
  } catch (error) {
    console.error('Error fetching terminal details:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('messages.fetchTerminalDetailsError'),
      life: 3000
    })
    router.push('/')
  } finally {
    isLoading.value = false
  }
}

const connectWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/ws/terminal/${terminalId}`

  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    console.log('Terminal WebSocket connected')
    isConnected.value = true
    toast.add({
      severity: 'success',
      summary: t('terminal.connected'),
      detail: t('terminal.connectedTo', { id: terminalId.substring(0, 8) }),
      life: 3000
    })
  }

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (message.type === 'output') {
      terminalOutput.value.push(message.data)
      // 智能滚动
      autoScrollToBottom()
    }
  }

  ws.onerror = (error) => {
    console.error('Terminal WebSocket error:', error)
    isConnected.value = false
    toast.add({
      severity: 'error',
      summary: t('terminal.connectionError'),
      detail: t('terminal.terminalConnectionError'),
      life: 3000
    })
  }

  ws.onclose = () => {
    console.log('Terminal WebSocket disconnected')
    isConnected.value = false
    toast.add({
      severity: 'warn',
      summary: t('terminal.connectionLost'),
      detail: t('terminal.terminalConnectionLost'),
      life: 3000
    })
  }
}

const sendCommand = () => {
  if (!commandInput.value.trim() || !isConnected.value || !ws) return

  const command = commandInput.value
  commandInput.value = ''
  
  // 添加到历史记录
  commandHistory.value.push(command)
  historyIndex.value = -1
  
  // 添加命令到输出以获得更好的用户体验
  terminalOutput.value.push(`$ ${command}`)
  
  ws.send(JSON.stringify({
    type: 'command',
    data: command
  }))
}

const clearOutput = () => {
  terminalOutput.value = []
  toast.add({
    severity: 'info',
    summary: '终端已清空',
    life: 2000
  })
}

const reconnect = () => {
  if (ws) {
    ws.close()
  }
  connectWebSocket()
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  nextTick(() => {
    autoScrollToBottom()
  })
}

const copyOutput = async () => {
  const outputText = terminalOutput.value.join('\n')
  try {
    await navigator.clipboard.writeText(outputText)
    toast.add({
      severity: 'success',
      summary: '已复制到剪贴板',
      life: 2000
    })
  } catch (error) {
    console.error('Failed to copy:', error)
    toast.add({
      severity: 'error',
      summary: '复制失败',
      life: 2000
    })
  }
}

const handleKeyNavigation = (event: KeyboardEvent) => {
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (historyIndex.value < commandHistory.value.length - 1) {
      historyIndex.value++
      commandInput.value = commandHistory.value[commandHistory.value.length - 1 - historyIndex.value]
    }
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (historyIndex.value > 0) {
      historyIndex.value--
      commandInput.value = commandHistory.value[commandHistory.value.length - 1 - historyIndex.value]
    } else if (historyIndex.value === 0) {
      historyIndex.value = -1
      commandInput.value = ''
    }
  }
}

const autoScrollToBottom = () => {
  if (autoScrollTimer) {
    clearTimeout(autoScrollTimer)
  }
  autoScrollTimer = setTimeout(() => {
    const outputElement = document.getElementById('terminal-output')
    if (outputElement) {
      outputElement.scrollTop = outputElement.scrollHeight
    }
  }, 50)
}

onMounted(() => {
  fetchTerminalDetails()
  connectWebSocket()
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyNavigation)
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
  if (autoScrollTimer) {
    clearTimeout(autoScrollTimer)
  }
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeyNavigation)
})

// 格式化输出行
const formatOutputLine = (line: string) => {
  if (line.startsWith('$')) {
    return `<span class="command-text">${line}</span>`
  }
  // 简单的语法高亮
  return line
    .replace(/\b(error|Error|ERROR)\b/g, '<span class="error-text">$1</span>')
    .replace(/\b(warning|Warning|WARNING)\b/g, '<span class="warning-text">$1</span>')
    .replace(/\b(success|Success|SUCCESS)\b/g, '<span class="success-text">$1</span>')
}
</script>

<template>
  <div class="terminal-container" :class="{ 'fullscreen': isFullscreen }">
    <Toast />
    
    <!-- 顶部控制栏 -->
    <header class="terminal-header">
      <div class="header-left">
        <Button 
          icon="pi pi-arrow-left" 
          :label="t('terminal.backToList')" 
          severity="secondary" 
          size="small"
          class="back-btn"
          @click="$router.push('/')"
        />
        <div class="terminal-title">
          <span class="terminal-icon">💻</span>
          <span class="terminal-name">Terminal {{ terminalId.substring(0, 8) }}</span>
          <Badge 
            :severity="connectionStatus.severity" 
            :value="connectionStatus.text"
            class="connection-badge"
          />
        </div>
      </div>
      
      <div class="header-right">
        <div class="terminal-stats">
          <span class="stat-item">
            <i class="pi pi-list"></i>
            {{ terminalStats.outputLines }} 行
          </span>
          <span class="stat-item">
            <i class="pi pi-clock"></i>
            {{ terminalStats.uptime }}
          </span>
        </div>
        
        <div class="control-buttons">
          <Button 
            icon="pi pi-copy" 
            v-tooltip="'复制输出'"
            severity="secondary" 
            size="small"
            class="control-btn"
            @click="copyOutput"
          />
          <Button 
            icon="pi pi-trash" 
            v-tooltip="'清空输出'"
            severity="secondary" 
            size="small"
            class="control-btn"
            @click="clearOutput"
          />
          <Button 
            icon="pi pi-refresh" 
            v-tooltip="'重新连接'"
            severity="secondary" 
            size="small"
            class="control-btn"
            @click="reconnect" 
            :disabled="isConnected"
          />
          <Button 
            :icon="isFullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'" 
            v-tooltip="isFullscreen ? '退出全屏' : '全屏'"
            severity="secondary" 
            size="small"
            class="control-btn"
            @click="toggleFullscreen"
          />
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="terminal-main">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-content">
          <div class="loading-spinner">
            <i class="pi pi-spin pi-spinner"></i>
          </div>
          <p class="loading-text">{{ t('common.loading') }}</p>
        </div>
      </div>

      <!-- 终端界面 -->
      <div v-else class="terminal-interface">
        <!-- 侧边信息面板 -->
        <aside class="info-panel" :class="{ 'collapsed': isFullscreen }">
          <Card class="info-card">
            <template #title>
              <div class="panel-title">
                <i class="pi pi-info-circle"></i>
                {{ t('terminal.terminalInfo') }}
              </div>
            </template>
            <template #content>
              <div class="info-content">
                <div class="info-item">
                  <span class="info-label">
                    <i class="pi pi-hashtag"></i>
                    ID
                  </span>
                  <span class="info-value">{{ terminal?.id?.substring(0, 8) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">
                    <i class="pi pi-cog"></i>
                    {{ t('home.pid') }}
                  </span>
                  <span class="info-value">{{ terminal?.pid }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">
                    <i class="pi pi-terminal"></i>
                    {{ t('home.shell') }}
                  </span>
                  <span class="info-value">{{ terminal?.shell || t('home.default') }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">
                    <i class="pi pi-folder"></i>
                    {{ t('home.directory') }}
                  </span>
                  <span class="info-value truncate" :title="terminal?.cwd">
                    {{ terminal?.cwd || t('home.defaultDirectory') }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">
                    <i class="pi pi-clock"></i>
                    {{ t('home.created') }}
                  </span>
                  <span class="info-value">{{ new Date(terminal?.created).toLocaleString() }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">
                    <i class="pi pi-check-circle"></i>
                    {{ t('home.status') }}
                  </span>
                  <Badge 
                    :severity="terminal?.status === 'active' ? 'success' : 'warning'" 
                    :value="terminal?.status" 
                  />
                </div>
              </div>
            </template>
          </Card>
        </aside>

        <!-- 终端输出区域 -->
        <section class="terminal-output-section">
          <div class="terminal-window">
            <!-- 终端标题栏 -->
            <div class="terminal-titlebar">
              <div class="window-controls">
                <span class="control control-close"></span>
                <span class="control control-minimize"></span>
                <span class="control control-maximize"></span>
              </div>
              <div class="window-title">
                <i :class="connectionStatus.icon"></i>
                {{ connectionStatus.text }} - {{ terminalId.substring(0, 8) }}
              </div>
              <div class="window-actions">
                <span class="action-item">{{ terminalStats.outputLines }} 行</span>
              </div>
            </div>

            <!-- 终端输出 -->
            <div 
              id="terminal-output"
              class="terminal-output"
              :class="{ 'empty': terminalOutput.length === 0 }"
            >
              <div v-if="terminalOutput.length === 0" class="empty-output">
                <i class="pi pi-inbox"></i>
                <p>{{ t('terminal.noOutput') }}</p>
                <small>输入命令开始与终端交互</small>
              </div>
              <div v-else class="output-content">
                <div 
                  v-for="(line, index) in terminalOutput" 
                  :key="index" 
                  class="output-line"
                  :class="{ 'command-line': line.startsWith('$') }"
                >
                  <span v-html="formatOutputLine(line)"></span>
                </div>
              </div>
            </div>

            <!-- 命令输入区域 -->
            <div class="terminal-input">
              <div class="input-prompt">
                <span class="prompt-symbol">$</span>
                <input
                  v-model="commandInput"
                  @keyup.enter="sendCommand"
                  :disabled="!isConnected"
                  :placeholder="isConnected ? t('terminal.commandPlaceholder') : t('terminal.disconnected')"
                  class="command-input"
                  autocomplete="off"
                  spellcheck="false"
                />
              </div>
              <div class="input-actions">
                <Button 
                  icon="pi pi-send" 
                  severity="primary" 
                  size="small"
                  class="send-btn"
                  @click="sendCommand"
                  :disabled="!isConnected || !commandInput.trim()"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>


<style scoped>
/* 终端容器 */
.terminal-container {
  min-height: 100vh;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  animation: fadeIn var(--transition-normal) ease-out;
}

.terminal-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: var(--bg-primary);
}

/* 顶部控制栏 */
.terminal-header {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  padding: var(--spacing) var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.back-btn {
  transition: all var(--transition-fast);
}

.back-btn:hover {
  transform: translateX(-2px);
}

.terminal-title {
  display: flex;
  align-items: center;
  gap: var(--spacing);
}

.terminal-icon {
  font-size: var(--text-xl);
  animation: pulse 2s ease-in-out infinite;
}

.terminal-name {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.connection-badge {
  font-size: var(--text-xs);
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
}

.terminal-stats {
  display: flex;
  gap: var(--spacing-lg);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.stat-item i {
  font-size: var(--text-sm);
  color: var(--primary-500);
}

.control-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.control-btn {
  transition: all var(--transition-fast);
}

.control-btn:hover {
  transform: translateY(-1px);
}

/* 主内容区域 */
.terminal-main {
  flex: 1;
  padding: var(--spacing-lg);
  overflow: hidden;
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
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

/* 终端界面 */
.terminal-interface {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--spacing-lg);
  height: calc(100vh - 140px);
}

.terminal-container.fullscreen .terminal-interface {
  height: calc(100vh - 80px);
}

/* 信息面板 */
.info-panel {
  transition: all var(--transition-normal);
}

.info-panel.collapsed {
  display: none;
}

.info-card {
  height: fit-content;
  box-shadow: var(--shadow-md);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
}

.panel-title i {
  color: var(--primary-500);
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-light);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.info-label i {
  font-size: var(--text-sm);
  color: var(--primary-500);
}

.info-value {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: 500;
  font-family: var(--font-mono);
  max-width: 150px;
}

.info-value.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 终端输出区域 */
.terminal-output-section {
  display: flex;
  flex-direction: column;
}

.terminal-window {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 终端标题栏 */
.terminal-titlebar {
  background: var(--bg-dark);
  color: var(--text-inverse);
  padding: var(--spacing-sm) var(--spacing);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
}

.window-controls {
  display: flex;
  gap: var(--spacing-xs);
}

.control {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.control:hover {
  opacity: 0.8;
}

.control-close {
  background: #ff5f56;
}

.control-minimize {
  background: #ffbd2e;
}

.control-maximize {
  background: #27c93f;
}

.window-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 500;
}

.window-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing);
}

.action-item {
  font-size: var(--text-xs);
  opacity: 0.8;
}

/* 终端输出 */
.terminal-output {
  flex: 1;
  background: var(--bg-dark);
  color: var(--text-inverse);
  padding: var(--spacing);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  overflow-y: auto;
  min-height: 300px;
  transition: all var(--transition-normal);
}

.terminal-output.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-output {
  text-align: center;
  color: var(--text-tertiary);
}

.empty-output i {
  font-size: var(--text-4xl);
  margin-bottom: var(--spacing);
  opacity: 0.5;
}

.empty-output p {
  font-size: var(--text-lg);
  margin: 0 0 var(--spacing-xs) 0;
}

.empty-output small {
  font-size: var(--text-sm);
  opacity: 0.7;
}

.output-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.output-line {
  margin-bottom: var(--spacing-xs);
  animation: slideIn var(--transition-fast) ease-out;
}

.command-line {
  color: var(--success-400);
  font-weight: 600;
}

/* 命令输入区域 */
.terminal-input {
  background: var(--bg-dark);
  border-top: 1px solid var(--border-dark);
  padding: var(--spacing);
  display: flex;
  gap: var(--spacing);
  align-items: center;
}

.input-prompt {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
}

.prompt-symbol {
  color: var(--success-400);
  font-weight: 600;
  font-size: var(--text-lg);
}

.command-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-inverse);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  padding: var(--spacing-xs) 0;
}

.command-input::placeholder {
  color: var(--text-tertiary);
}

.command-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  transition: all var(--transition-fast);
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

/* 语法高亮 */
:deep(.command-text) {
  color: var(--success-400);
  font-weight: 600;
}

:deep(.error-text) {
  color: var(--danger-400);
  font-weight: 600;
}

:deep(.warning-text) {
  color: var(--warning-400);
  font-weight: 600;
}

:deep(.success-text) {
  color: var(--success-400);
  font-weight: 600;
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
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .terminal-interface {
    grid-template-columns: 1fr;
    gap: var(--spacing);
  }

  .info-panel {
    order: 2;
  }

  .terminal-output-section {
    order: 1;
  }

  .terminal-stats {
    display: none;
  }
}

@media (max-width: 768px) {
  .terminal-main {
    padding: var(--spacing);
  }

  .terminal-header {
    padding: var(--spacing);
    flex-direction: column;
    gap: var(--spacing);
  }

  .header-left,
  .header-right {
    width: 100%;
    justify-content: center;
  }

  .terminal-title {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-xs);
  }

  .control-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }

  .terminal-window {
    height: calc(100vh - 200px);
  }
}

@media (max-width: 480px) {
  .terminal-header {
    padding: var(--spacing-sm);
  }

  .terminal-main {
    padding: var(--spacing-sm);
  }

  .terminal-titlebar {
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .terminal-output {
    padding: var(--spacing-sm);
    font-size: var(--text-xs);
  }

  .terminal-input {
    padding: var(--spacing-sm);
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .terminal-container {
    background: var(--bg-dark-secondary);
  }

  .terminal-header {
    background: var(--bg-dark-secondary);
    border-color: var(--border-light);
  }

  .info-card {
    background: var(--bg-dark-secondary);
    border-color: var(--border-light);
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  .terminal-container,
  .output-line,
  .terminal-icon,
  .back-btn,
  .control-btn,
  .send-btn {
    animation: none;
    transition: none;
  }
}
</style>