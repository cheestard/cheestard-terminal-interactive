<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const terminalId = route.params.id as string
const terminal = ref<any>(null)
const commandInput = ref('')
const terminalOutput = ref<string[]>([])
const isLoading = ref(true)
const isConnected = ref(false)

let ws: WebSocket | null = null

// Toast notification system
const toast = (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
  const toastId = `toast-${Date.now()}`
  const toastElement = document.createElement('div')
  toastElement.id = toastId
  toastElement.className = `toast toast-top toast-end z-50`
  
  const alertClass = options.variant === 'destructive' ? 'alert-error' : 'alert-success'
  toastElement.innerHTML = `
    <div class="alert ${alertClass} shadow-lg">
      <div>
        <span class="font-bold">${options.title}</span>
        ${options.description ? `<div class="text-xs">${options.description}</div>` : ''}
      </div>
    </div>
  `
  
  document.body.appendChild(toastElement)
  
  setTimeout(() => {
    if (document.getElementById(toastId)) {
      document.getElementById(toastId)?.remove()
    }
  }, 3000)
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
    toast({
      title: t('common.error'),
      description: t('messages.fetchTerminalDetailsError'),
      variant: 'destructive',
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
    toast({
      title: t('terminal.connected'),
      description: t('terminal.connectedTo', { id: terminalId.substring(0, 8) }),
    })
  }

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (message.type === 'output') {
      terminalOutput.value.push(message.data)
      // Auto-scroll to bottom
      setTimeout(() => {
        const outputElement = document.getElementById('terminal-output')
        if (outputElement) {
          outputElement.scrollTop = outputElement.scrollHeight
        }
      }, 100)
    }
  }

  ws.onerror = (error) => {
    console.error('Terminal WebSocket error:', error)
    isConnected.value = false
    toast({
      title: t('terminal.connectionError'),
      description: t('terminal.terminalConnectionError'),
      variant: 'destructive',
    })
  }

  ws.onclose = () => {
    console.log('Terminal WebSocket disconnected')
    isConnected.value = false
    toast({
      title: t('terminal.connectionLost'),
      description: t('terminal.terminalConnectionLost'),
      variant: 'destructive',
    })
  }
}

const sendCommand = () => {
  if (!commandInput.value.trim() || !isConnected.value || !ws) return

  const command = commandInput.value
  commandInput.value = ''
  
  // Add command to output for better UX
  terminalOutput.value.push(`$ ${command}`)
  
  ws.send(JSON.stringify({
    type: 'command',
    data: command
  }))
}

const clearOutput = () => {
  terminalOutput.value = []
}

const reconnect = () => {
  if (ws) {
    ws.close()
  }
  connectWebSocket()
}

onMounted(() => {
  fetchTerminalDetails()
  connectWebSocket()
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-base-200 to-base-300">
    <!-- Header -->
    <div class="navbar bg-base-100/80 backdrop-blur-lg border-b border-base-300/50">
      <div class="flex-1">
        <button class="btn btn-ghost normal-case text-xl hover:bg-primary/10 transition-all duration-200" @click="$router.push('/')">
          ← {{ t('terminal.backToList') }}
        </button>
      </div>
      <div class="flex-none gap-2">
        <div class="badge" :class="isConnected ? 'badge-success' : 'badge-error'">
          {{ isConnected ? t('terminal.connected') : t('terminal.disconnected') }}
        </div>
        <button class="btn btn-ghost btn-sm hover:bg-primary/10 transition-all duration-200" @click="clearOutput">
          🗑️ {{ t('terminal.clear') }}
        </button>
        <button class="btn btn-ghost btn-sm hover:bg-primary/10 transition-all duration-200" @click="reconnect" :disabled="isConnected">
          🔄 {{ t('terminal.reconnect') }}
        </button>
        <LanguageSwitcher />
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto p-4">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center h-64">
        <div class="loading loading-spinner loading-lg"></div>
      </div>

      <!-- Terminal Interface -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <!-- Terminal Info Panel -->
        <div class="lg:col-span-1">
          <div class="card bg-base-100/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border border-base-300/50">
            <div class="card-body">
              <h2 class="card-title bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{{ t('terminal.terminalInfo') }}</h2>
              
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-base-content/70">ID:</span>
                  <span class="font-mono">{{ terminal?.id?.substring(0, 8) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/70">{{ t('home.pid') }}:</span>
                  <span class="font-mono">{{ terminal?.pid }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/70">{{ t('home.shell') }}:</span>
                  <span class="font-mono">{{ terminal?.shell || t('home.default') }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/70">{{ t('home.directory') }}:</span>
                  <span class="font-mono text-xs">{{ terminal?.cwd || t('home.defaultDirectory') }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/70">{{ t('common.status') }}:</span>
                  <div :class="`badge ${terminal?.status === 'active' ? 'badge-success' : 'badge-error'}`">
                    {{ terminal?.status === 'active' ? t('terminal.running') : t('terminal.stopped') }}
                  </div>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/70">{{ t('terminal.createdAt') }}:</span>
                  <span class="text-xs">{{ new Date(terminal?.created).toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Terminal Output -->
        <div class="lg:col-span-3">
          <div class="card bg-base-100/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border border-base-300/50 h-full">
            <div class="card-body p-0">
              <!-- Terminal Header -->
              <div class="bg-base-300/80 backdrop-blur-sm px-4 py-2 flex items-center justify-between border-b border-base-300/50">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-red-500 rounded-full hover:scale-110 transition-transform cursor-pointer"></div>
                  <div class="w-3 h-3 bg-yellow-500 rounded-full hover:scale-110 transition-transform cursor-pointer"></div>
                  <div class="w-3 h-3 bg-green-500 rounded-full hover:scale-110 transition-transform cursor-pointer"></div>
                  <span class="ml-2 text-sm font-mono">{{ t('common.terminal') }} {{ terminal?.id?.substring(0, 8) }}</span>
                </div>
                <div class="badge" :class="isConnected ? 'badge-success' : 'badge-error'">
                  {{ isConnected ? '●' : '○' }}
                </div>
              </div>

              <!-- Terminal Output Area -->
              <div
                id="terminal-output"
                class="bg-black/90 backdrop-blur-sm text-green-400 p-4 h-96 overflow-y-auto font-mono text-sm border border-base-300/30"
                style="min-height: 400px;"
              >
                <div v-if="terminalOutput.length === 0" class="text-gray-500 animate-pulse">
                  {{ t('terminal.waitingForOutput') }}
                </div>
                <div v-for="(line, index) in terminalOutput" :key="index" class="mb-1">
                  {{ line }}
                </div>
              </div>

              <!-- Command Input -->
              <div class="bg-base-300/80 backdrop-blur-sm p-4 border-t border-base-300/50">
                <div class="flex gap-2">
                  <input
                    v-model="commandInput"
                    @keyup.enter="sendCommand"
                    type="text"
                    :placeholder="t('terminal.commandPlaceholder')"
                    class="input input-bordered flex-1 font-mono focus:border-primary transition-all duration-200 bg-base-100/50"
                    :disabled="!isConnected"
                  />
                  <button
                    @click="sendCommand"
                    class="btn btn-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    :disabled="!isConnected || !commandInput.trim()"
                  >
                    {{ t('terminal.send') }}
                  </button>
                </div>
                <div class="mt-2 text-xs text-base-content/70">
                  {{ t('terminal.commandHint') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>