<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Button from 'primevue/button'
import { useRouter, useRoute } from 'vue-router'
import { useTerminalStore } from './stores/terminal'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const isLoaded = ref(false)
const terminalStore = useTerminalStore()

// 统计数据 - 从store获取或直接计算
const stats = computed(() => terminalStore.stats || {
  total: 0,
  active: 0,
  inactive: 0,
  terminated: 0
})

const createNewTerminal = () => {
  terminalStore.createNewTerminal()
}

// 导航到设置页面
const navigateToSettings = () => {
  router.push('/settings')
}

onMounted(() => {
  // 页面加载完成后添加动画
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<template>
  <div class="app-container bg-gradient-dark text-text-primary" :class="{ 'app-loaded': isLoaded }">
    <!-- 背景装饰元素 -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-0 right-0 w-96 h-96 bg-neon-blue opacity-20 rounded-full filter blur-3xl animate-float"></div>
      <div class="absolute bottom-0 left-0 w-80 h-80 bg-neon-purple opacity-20 rounded-full filter blur-3xl animate-float" style="animation-delay: 2s;"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-green opacity-10 rounded-full filter blur-3xl animate-float" style="animation-delay: 4s;"></div>
      <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
    </div>

    <!-- 主内容区域 -->
    <div class="relative z-10 h-screen flex flex-col">
      <!-- 顶部导航栏 - 只在首页显示 -->
      <header v-if="route.name === 'home'" class="glass-effect border-b border-border-dark sticky top-0 z-50 animate-slide-up">
        <div class="w-full h-16 flex items-center justify-between px-4">
          <!-- 左侧：Logo和标题 -->
          <div class="flex items-center space-x-4 flex-shrink-0">
            <div class="w-10 h-10 bg-gradient-neon rounded-lg flex items-center justify-center text-white shadow-neon-blue hover:scale-105 transition-transform duration-200">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4h16v16H4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M4 9h16M9 4v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1 class="text-xl font-bold bg-gradient-neon bg-clip-text text-transparent">Cheestard Terminal Interactive</h1>
          </div>
          
          <!-- 右侧：统计信息和设置按钮 -->
          <div class="flex items-center space-x-6 flex-shrink-0">
            <div class="hidden md:flex items-center space-x-6">
              <span class="flex items-center space-x-2 text-sm text-text-secondary">
                <i class="pi pi-server text-neon-blue"></i>
                <span>{{ stats.total }} {{ t('app.totalTerminals') }}</span>
              </span>
              <span class="flex items-center space-x-2 text-sm text-text-secondary">
                <i class="pi pi-play-circle text-green-500"></i>
                <span>{{ stats.active }} {{ t('app.active') }}</span>
              </span>
              <span class="flex items-center space-x-2 text-sm text-text-secondary">
                <i class="pi pi-pause-circle text-yellow-500"></i>
                <span>{{ stats.inactive }} {{ t('app.inactive') }}</span>
              </span>
              <span class="flex items-center space-x-2 text-sm text-text-secondary">
                <i class="pi pi-stop-circle text-red-500"></i>
                <span>{{ stats.terminated }} {{ t('app.terminated') }}</span>
              </span>
            </div>
            
            <Button
              icon="pi pi-cog"
              v-tooltip="t('settings.title')"
              severity="secondary"
              text
              rounded
              class="w-10 h-10 text-text-secondary hover:text-neon-blue hover:bg-bg-glass-hover transition-all duration-200 hover:rotate-90"
              @click="navigateToSettings"
            />
          </div>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="flex-1 overflow-hidden">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 应用容器 */
.app-container {
  height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%);
  position: relative;
}

/* 应用容器动画 */
  .app-container {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.5s ease-out;
  }
  
  .app-loaded {
    opacity: 1;
    transform: translateY(0);
  }
  
  /* 背景网格图案 */
  .bg-grid-pattern {
    background-image:
      linear-gradient(rgba(71, 85, 105, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(71, 85, 105, 0.1) 1px, transparent 1px);
    background-size: 50px 50px;
  }
  
  /* 页面切换动画 */
  .page-enter-active,
  .page-leave-active {
    transition: all 0.3s ease;
  }
  
  .page-enter-from {
    opacity: 0;
    transform: translateX(20px);
  }
  
  .page-leave-to {
    opacity: 0;
    transform: translateX(-20px);
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .app-container h1 {
      font-size: 1.125rem;
    }
  }
  
  /* 高对比度模式支持 */
  @media (prefers-contrast: high) {
    .glass-effect {
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid #ffffff;
    }
  }
  
  /* 减少动画偏好支持 */
  @media (prefers-reduced-motion: reduce) {
    .app-container,
    .glass-effect {
      animation: none;
      transition: none;
    }
  
    .page-enter-active,
    .page-leave-active {
      transition: none;
    }
  }
  </style>
  
  <style>
  /* 全局样式重置和增强 */
  * {
    box-sizing: border-box;
  }
  
  html {
    scroll-behavior: smooth;
    height: 100%;
  }
  
  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #ffffff;
    background-color: #0a0a0a;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    height: 100%;
    overflow: hidden;
  }
  
  /* 自定义滚动条 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #1a1a1a;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 4px;
    transition: background 0.2s ease;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
  
  /* Firefox 滚动条 */
  * {
    scrollbar-width: thin;
    scrollbar-color: #334155 #1a1a1a;
  }
  
  /* 选择文本样式 */
  ::selection {
    background: #00d4ff;
    color: #0a0a0a;
  }
  
  ::-moz-selection {
    background: #00d4ff;
    color: #0a0a0a;
  }
  
  /* 焦点样式 */
  :focus-visible {
    outline: 2px solid #00d4ff;
    outline-offset: 2px;
  }
  
  /* 终端输出自定义滚动条 */
  #terminal-output::-webkit-scrollbar {
    width: 8px;
  }
  
  #terminal-output::-webkit-scrollbar-track {
    background: #1a1a1a;
    border-radius: 4px;
  }
  
  #terminal-output::-webkit-scrollbar-thumb {
    background: #64748b;
    border-radius: 4px;
  }
  
  #terminal-output::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  </style>