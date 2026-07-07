<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import SidebarToggle from './components/SidebarToggle.vue'

const Layout = DefaultTheme.Layout
</script>

<template>
  <Layout>
    <template #nav-bar-title-after>
      <SidebarToggle />
    </template>
  </Layout>
</template>
