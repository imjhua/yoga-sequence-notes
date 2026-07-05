<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import LyricFlowVerse from './LyricFlowVerse.vue'
import {
  type LyricFlowData,
  normalizeData,
  vinyasaJsonUrl,
} from '../lyricFlow'

const props = defineProps<{ flow?: string }>()

const { frontmatter } = useData()
const fetched = ref<LyricFlowData | null>(null)
const loading = ref(false)

const embedded = computed((): LyricFlowData | null => {
  const fm = frontmatter.value
  const raw = fm?.lyricFlow
  if (raw) {
    if (typeof raw === 'string') {
      try {
        return normalizeData(JSON.parse(raw) as LyricFlowData)
      } catch {
        /* fall through */
      }
    } else if (typeof raw === 'object' && (raw as LyricFlowData).lines?.length) {
      return normalizeData(raw as LyricFlowData)
    }
  }
  if (typeof fm?.lyricFlowJson === 'string') {
    try {
      return normalizeData(JSON.parse(fm.lyricFlowJson) as LyricFlowData)
    } catch {
      return null
    }
  }
  return null
})

const flowName = computed(() => props.flow || (frontmatter.value?.flow as string) || '')

async function loadJson() {
  if (embedded.value || !flowName.value) return
  loading.value = true
  try {
    const res = await fetch(vinyasaJsonUrl(flowName.value))
    if (res.ok) {
      fetched.value = normalizeData(await res.json())
    }
  } catch {
    fetched.value = null
  } finally {
    loading.value = false
  }
}

const data = computed(() => embedded.value ?? fetched.value)

onMounted(loadJson)
watch(flowName, loadJson)
</script>

<template>
  <div class="lyric-flow lyric-flow-saved">
    <p v-if="loading" class="lyric-flow-empty">불러오는 중…</p>
    <p v-else-if="!data?.lines?.length" class="lyric-flow-empty">
      저장된 수업 플로우가 없습니다.
    </p>
    <template v-else>
      <header v-if="data.meta.song" class="lyric-flow-header">
        <span class="lyric-flow-song">{{ data.meta.song }}</span>
        <span v-if="data.meta.artist" class="lyric-flow-artist">{{ data.meta.artist }}</span>
      </header>
      <LyricFlowVerse
        v-for="line in data.lines"
        :key="line.id"
        :line="line"
      />
    </template>
  </div>
</template>
