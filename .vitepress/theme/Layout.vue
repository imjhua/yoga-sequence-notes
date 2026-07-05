<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import SidebarToggle from './components/SidebarToggle.vue'

const Layout = DefaultTheme.Layout
</script>

<template>
  <Layout>
    <template #layout-top>
      <SidebarToggle />
    </template>
  </Layout>
</template>
