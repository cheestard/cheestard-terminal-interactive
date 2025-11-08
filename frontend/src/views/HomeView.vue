<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast/use-toast'

const { toast } = useToast()

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
      title: '错误',
      description: '无法获取终端列表。',
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
      title: '成功',
      description: `终端 ${newTerminal.id.substring(0, 8)} 已创建。`,
    })
    fetchTerminals() // Refresh list to get updated status
  } catch (error) {
    console.error('Error creating terminal:', error)
    toast({
      title: '错误',
      description: '无法创建终端。',
      variant: 'destructive',
    })
  }
}

const killTerminal = async (id: string) => {
  if (!confirm(`确定要终止终端 ${id.substring(0, 8)} 吗？`)) {
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
      title: '成功',
      description: `终端 ${id.substring(0, 8)} 已终止。`,
    })
    fetchTerminals() // Refresh list to get updated status
  } catch (error) {
    console.error('Error killing terminal:', error)
    toast({
      title: '错误',
      description: '无法终止终端。',
      variant: 'destructive',
    })
  }
}

const getStatusBadgeClass = (status: Terminal['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-500 text-white'
    case 'inactive':
      return 'bg-gray-500 text-white'
    case 'terminated':
      return 'bg-red-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
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
  refreshInterval = setInterval(fetchTerminals, 5000) as unknown as number // Refresh every 5 seconds
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
  <div class="min-h-screen bg-background p-4">
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center pb-5 border-b-2 border-border">
        <h1 class="text-3xl font-bold text-foreground">🖥️ 终端管理器</h1>
        <div class="flex gap-2">
          <Button variant="outline" @click="fetchTerminals">🔄 刷新</Button>
          <Button @click="createModalOpen = true">+ 新建终端</Button>
        </div>
      </div>

      <!-- Stats -->
      <div class="flex gap-8 p-4 bg-card rounded-lg shadow">
        <div class="flex flex-col">
          <span class="text-sm text-muted-foreground uppercase">总终端数:</span>
          <span class="text-2xl font-bold text-primary">{{ totalTerminals }}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-sm text-muted-foreground uppercase">活跃:</span>
          <span class="text-2xl font-bold text-primary">{{ activeTerminals }}</span>
        </div>
      </div>

      <!-- Terminal List -->
      <div v-if="terminalList.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card v-for="terminal in terminalList" :key="terminal.id" class="hover:border-primary transition-all">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium text-primary cursor-pointer" @click="$router.push(`/terminal/${terminal.id}`)">
              终端 {{ terminal.id.substring(0, 8) }}
            </CardTitle>
            <span :class="['px-2 py-1 rounded-md text-xs font-semibold', getStatusBadgeClass(terminal.status)]">
              {{ terminal.status }}
            </span>
          </CardHeader>
          <CardContent class="space-y-2 text-sm text-muted-foreground">
            <p><strong>PID:</strong> {{ terminal.pid }}</p>
            <p><strong>Shell:</strong> {{ terminal.shell }}</p>
            <p><strong>CWD:</strong> {{ terminal.cwd }}</p>
            <p><strong>创建时间:</strong> {{ new Date(terminal.created).toLocaleString() }}</p>
          </CardContent>
          <div class="p-4 pt-0 flex gap-2 border-t border-border mt-4">
            <Button variant="secondary" size="sm" @click="$router.push(`/terminal/${terminal.id}`)">查看</Button>
            <Button variant="destructive" size="sm" @click="killTerminal(terminal.id)">终止</Button>
          </div>
        </Card>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center p-10 text-muted-foreground">
        <p>暂无终端。创建新终端开始使用！</p>
      </div>

      <!-- Create Terminal Modal -->
      <Dialog v-model:open="createModalOpen">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新终端</DialogTitle>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="shell" class="text-right">Shell (可选):</Label>
              <Input id="shell" v-model="newTerminalShell" placeholder="例如: /bin/bash" class="col-span-3" />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="cwd" class="text-right">工作目录 (可选):</Label>
              <Input id="cwd" v-model="newTerminalCwd" placeholder="例如: /home/user" class="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="createModalOpen = false">取消</Button>
            <Button @click="createTerminal">创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>