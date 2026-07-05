<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{ name: string }>()

const svg = ref('')

async function load() {
  const res = await fetch(`/mindmaps/${props.name}-mindmap.svg`)
  if (!res.ok) return
  svg.value = await res.text()
}

onMounted(load)
watch(() => props.name, load)
</script>

<template>
  <div
    class="mindmap-wrap"
    v-html="svg"
    role="img"
    aria-label="시퀀스 마인드맵"
  />
</template>
