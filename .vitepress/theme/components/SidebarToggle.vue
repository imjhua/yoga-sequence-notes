<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useSidebar } from 'vitepress/theme'
import { isSidebarHidden, loadSidebarHiddenPref, toggleSidebarHidden } from '../sidebarHide'

const { hasSidebar } = useSidebar()
const hidden = ref(false)
const isDesktop = ref(false)

const mq = typeof window !== 'undefined'
  ? window.matchMedia('(min-width: 960px)')
  : null

function syncDesktop() {
  isDesktop.value = mq?.matches ?? false
}

function onToggle(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  hidden.value = toggleSidebarHidden()
}

onMounted(() => {
  loadSidebarHiddenPref()
  hidden.value = isSidebarHidden()
  syncDesktop()
  mq?.addEventListener('change', syncDesktop)
})

onUnmounted(() => {
  mq?.removeEventListener('change', syncDesktop)
})
</script>

<template>
  <button
    v-if="hasSidebar && isDesktop"
    type="button"
    class="vp-sidebar-toggle"
    :aria-label="hidden ? '시퀀스 목록 보기' : '시퀀스 목록 숨기'"
    :title="hidden ? '시퀀스 목록 보기' : '시퀀스 목록 숨기'"
    @click="onToggle"
  >
    <span class="vp-sidebar-toggle-icon" aria-hidden="true">{{ hidden ? '☰' : '◀' }}</span>
    <span class="vp-sidebar-toggle-label">{{ hidden ? '목록' : '숨기기' }}</span>
  </button>
</template>
