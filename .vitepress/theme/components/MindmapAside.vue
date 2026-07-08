<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{ name: string }>()

const svg = ref('')
const { frontmatter } = useData()

async function load() {
  const res = await fetch(`/mindmaps/${props.name}-mindmap.svg`)
  if (!res.ok) return
  svg.value = await res.text()
}

onMounted(load)
watch(() => props.name, load)
</script>

<template>
  <aside v-if="svg" class="aside-mindmap-wrapper">
    <div class="aside-mindmap-sticky">
      <div class="aside-mindmap-header">
        <h4>시퀀스 흐름</h4>
      </div>
      <div
        class="aside-mindmap-content"
        v-html="svg"
        role="img"
        :aria-label="`${frontmatter.title || 'Sequence'} mindmap`"
      />
    </div>
  </aside>
</template>

<style scoped>
.aside-mindmap-wrapper {
  display: none;
}

/* Desktop — 오른쪽 aside에 표시 */
@media (min-width: 960px) {
  .aside-mindmap-wrapper {
    display: block;
    --vp-aside-width: 280px;
  }

  .aside-mindmap-sticky {
    position: sticky;
    top: 3.5rem;
    padding: 1rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    background: var(--vp-c-bg-soft);
  }

  .aside-mindmap-header {
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--vp-c-divider);
  }

  .aside-mindmap-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--vp-c-text-2);
    letter-spacing: 0.03em;
  }

  .aside-mindmap-content {
    display: block;
    width: 100%;
    max-width: 100%;
  }

  .aside-mindmap-content :deep(.sequence-mindmap) {
    display: block;
    width: 100%;
    height: auto;
    max-width: 100%;
  }
}

/* Tablet 이상에서도 보이도록 조정 */
@media (min-width: 768px) and (max-width: 959px) {
  .aside-mindmap-wrapper {
    display: none;
  }
}
</style>
