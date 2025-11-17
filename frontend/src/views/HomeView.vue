<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const router = useRouter()
const { t } = useI18n()

interface Terminal {
  id: string;
  pid: number;
  shell: string;
  cwd: string;
  created: string;
  status: 'active' | 'inactive' | 'terminated';
}

const totalTerminals = ref(0)
const activeTerminals = ref(0)
const terminalList = ref<Terminal[]>([])
const createModalOpen = ref(false)
const newTerminalShell = ref('')
const newTerminalCwd = ref('')

let ws: WebSocket | null = null
let refreshInterval: number | null = null

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

const fetchTerminals = async () => {
  try {
    const response = await fetch('/api/terminals')
    if (!response.ok) {
      throw new Error('Failed to fetch terminals')
    }
    const data = await response.json()
    terminalList.value = data.terminals
    totalTerminals.value = data.terminals.length
    activeTerminals.value = data.terminals.filter((t: Terminal) => t.status === 'active').length
  } catch (error) {
    console.error('Error fetching terminals:', error)
    toast({
      title: t('common.error'),
      description: t('messages.fetchTerminalsError'),
      variant: 'destructive',
    })
  }
}

const createTerminal = async () => {
  try {
    const response = await fetch('/api/terminals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shell: newTerminalShell.value || undefined,
        cwd: newTerminalCwd.value || undefined,
      }),
    })
    if (!response.ok) {
      throw new Error('Failed to create terminal')
    }
    const newTerminal = await response.json()
    terminalList.value.push(newTerminal)
    totalTerminals.value++
    activeTerminals.value++
    createModalOpen.value = false
    newTerminalShell.value = ''
    newTerminalCwd.value = ''
    toast({
      title: t('common.success'),
      description: t('messages.terminalCreated', { id: newTerminal.id.substring(0, 8) }),
    })
    fetchTerminals()
    
    // 询问是否立即打开新终端
    if (confirm(t('home.terminalCreated'))) {
      router.push(`/terminal/${newTerminal.id}`)
    }
  } catch (error) {
    console.error('Error creating terminal:', error)
    toast({
      title: t('common.error'),
      description: t('messages.createTerminalError'),
      variant: 'destructive',
    })
  }
}

const killTerminal = async (id: string) => {
  if (!confirm(t('home.confirmTerminate', { id: id.substring(0, 8) }))) {
    return
  }
  try {
    const response = await fetch(`/api/terminals/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to kill terminal')
    }
    toast({
      title: t('common.success'),
      description: t('messages.terminalTerminated', { id: id.substring(0, 8) }),
    })
    fetchTerminals()
  } catch (error) {
    console.error('Error killing terminal:', error)
    toast({
      title: t('common.error'),
      description: t('messages.terminateTerminalError'),
      variant: 'destructive',
    })
  }
}

const getStatusBadgeClass = (status: Terminal['status']) => {
  switch (status) {
    case 'active':
      return 'badge-success'
    case 'inactive':
      return 'badge-warning'
    case 'terminated':
      return 'badge-error'
    default:
      return 'badge-neutral'
  }
}

const getStatusText = (status: Terminal['status']) => {
  switch (status) {
    case 'active':
      return t('status.active')
    case 'inactive':
      return t('status.inactive')
    case 'terminated':
      return t('status.terminated')
    default:
      return t('status.unknown')
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast({
      title: t('common.success'),
      description: t('messages.terminalIdCopied'),
    })
  } catch (error) {
    console.error('Failed to copy:', error)
    toast({
      title: t('common.error'),
      description: t('messages.copyError'),
      variant: 'destructive',
    })
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return t('time.justNow')
  if (diff < 3600000) return t('time.minutesAgo', { count: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('time.hoursAgo', { count: Math.floor(diff / 3600000) })
  return date.toLocaleDateString()
}

const connectWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}`

  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    console.log('WebSocket connected')
  }

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (message.type === 'statusUpdate') {
      const index = terminalList.value.findIndex(t => t.id === message.terminalId)
      if (index !== -1) {
        terminalList.value[index].status = message.status
        activeTerminals.value = terminalList.value.filter(t => t.status === 'active').length
      }
    }
  }

  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  ws.onclose = () => {
    console.log('WebSocket disconnected, reconnecting...')
    setTimeout(connectWebSocket, 2000)
  }
}

onMounted(() => {
  fetchTerminals()
  connectWebSocket()
  refreshInterval = setInterval(fetchTerminals, 5000) as unknown as number
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-base-200 to-base-300">
    <!-- Header -->
    <!-- Header -->
    <div class="navbar bg-base-100/80 backdrop-blur-lg border-b border-base-300/50">
      <div class="flex-1">
        <a class="btn btn-ghost normal-case text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          🖥️ {{ t('home.title') }}
        </a>
      </div>
      <div class="flex-none gap-2 items-center flex-nowrap min-w-0">
        <button class="btn btn-xs bg-sky-500 hover:bg-sky-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 whitespace-nowrap" @click="fetchTerminals">
          🔄 {{ t('common.refresh') }}
        </button>
        <button class="btn btn-xs bg-sky-500 hover:bg-sky-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 whitespace-nowrap" @click="createModalOpen = true">
          ➕ {{ t('home.newTerminal') }}
        </button>
        <div class="border-l border-base-300 h-4 mx-2 flex-shrink-0"></div>
        <div class="flex-shrink-0">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
    <!-- Main Content -->
    <div class="container mx-auto p-4">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="stat bg-base-100/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300/50 relative z-10">
          <div class="stat-figure text-primary">
            📊
          </div>
          <div class="stat-title">{{ t('home.totalTerminals') }}</div>
          <div class="stat-value text-primary">{{ totalTerminals }}</div>
        </div>
        
        <div class="stat bg-base-100/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300/50 relative z-10">
          <div class="stat-figure text-success">
            ⚡
          </div>
          <div class="stat-title">{{ t('home.activeTerminals') }}</div>
          <div class="stat-value text-success">{{ activeTerminals }}</div>
        </div>
        
        <div class="stat bg-base-100/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300/50 relative z-10">
          <div class="stat-figure text-warning">
            ⏸️
          </div>
          <div class="stat-title">{{ t('home.idleTerminals') }}</div>
          <div class="stat-value text-warning">{{ totalTerminals - activeTerminals }}</div>
        </div>
        
        <div class="stat bg-base-100/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300/50 relative z-10">
          <div class="stat-figure text-success">
            ✅
          </div>
          <div class="stat-title">{{ t('home.systemStatus') }}</div>
          <div class="stat-value text-success">{{ t('home.normal') }}</div>
        </div>
      </div>
      <!-- Terminal List -->
      <div v-if="terminalList.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="terminal in terminalList" :key="terminal.id" class="card bg-base-100/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border border-base-300/50 hover:scale-105">
          <div class="card-body">
            <div class="flex items-center justify-between mb-2">
              <h2 class="card-title text-lg">
                <span @click="copyToClipboard(terminal.id)" class="cursor-pointer hover:text-primary transition-colors" :title="t('home.copyTerminalId')">
                  💻 {{ t('common.terminal') }} {{ terminal.id.substring(0, 8) }}
                </span>
              </h2>
              <div :class="`badge ${getStatusBadgeClass(terminal.status)}`">
                {{ getStatusText(terminal.status) }}
              </div>
            </div>
            
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-base-content/70">{{ t('home.pid') }}:</span>
                <span class="font-mono">{{ terminal.pid }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">{{ t('home.shell') }}:</span>
                <span class="font-mono">{{ terminal.shell || t('home.default') }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">{{ t('home.directory') }}:</span>
                <span class="font-mono truncate" :title="terminal.cwd">{{ terminal.cwd || t('home.defaultDirectory') }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">{{ t('home.created') }}:</span>
                <span>{{ formatDate(terminal.created) }}</span>
              </div>
            </div>
            
            <div class="card-actions justify-end mt-4 gap-2">
              <button class="btn btn-ghost btn-sm hover:bg-primary/10 transition-all duration-200" @click="$router.push(`/terminal/${terminal.id}`)">
                👁️ {{ t('home.viewTerminal') }}
              </button>
              <button class="btn btn-error btn-sm hover:bg-red-600 transition-all duration-200" @click="killTerminal(terminal.id)">
                ⏹️ {{ t('home.terminate') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="hero bg-base-100/50 backdrop-blur-sm rounded-2xl border border-base-300/50">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <div class="text-6xl mb-4 animate-pulse">🖥️</div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{{ t('home.noTerminals') }}</h1>
            <p class="py-6">{{ t('home.noTerminalsDesc') }}</p>
            <button class="btn btn-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105" @click="createModalOpen = true">
              ➕ {{ t('home.createFirstTerminal') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Terminal Modal -->
    <input type="checkbox" id="create-modal" class="modal-toggle" v-model="createModalOpen" />
    <div class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{{ t('home.createNewTerminal') }}</h3>
        
        <div class="form-control w-full mb-4">
          <label class="label">
            <span class="label-text">🐚 {{ t('home.shellType') }}</span>
          </label>
          <input
            type="text"
            v-model="newTerminalShell"
            :placeholder="t('home.shellPlaceholder')"
            class="input input-bordered w-full focus:border-primary transition-all duration-200"
          />
          <label class="label">
            <span class="label-text-alt">{{ t('home.shellHint') }}</span>
          </label>
        </div>
        
        <div class="form-control w-full mb-6">
          <label class="label">
            <span class="label-text">📁 {{ t('home.workingDirectory') }}</span>
          </label>
          <input
            type="text"
            v-model="newTerminalCwd"
            :placeholder="t('home.directoryPlaceholder')"
            class="input input-bordered w-full focus:border-primary transition-all duration-200"
          />
          <label class="label">
            <span class="label-text-alt">{{ t('home.directoryHint') }}</span>
          </label>
        </div>
        
        <div class="modal-action">
          <button class="btn btn-ghost hover:bg-base-200 transition-all duration-200" @click="createModalOpen = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105" @click="createTerminal">
            🚀 {{ t('home.createTerminalBtn') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>