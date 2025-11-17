<script setup lang="ts">
import LanguageSwitcher from './components/LanguageSwitcher.vue'
</script>

<template>
  <div class="min-h-screen bg-white">
    <div class="fixed top-4 right-4 z-50">
      <LanguageSwitcher />
    </div>
    <router-view />
  </div>
</template>

<style>
/* Global styles */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom scrollbar for terminal output */
#terminal-output::-webkit-scrollbar {
  width: 8px;
}

#terminal-output::-webkit-scrollbar-track {
  background: #1a1a1a;
}

#terminal-output::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}

#terminal-output::-webkit-scrollbar-thumb:hover {
  background: #5a5a5a;
}
</style>