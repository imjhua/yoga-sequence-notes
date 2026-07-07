<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import LyricFlowVerse from './LyricFlowVerse.vue'
import {
  type LyricFlowData,
  anchorGlobalOffset,
  loadDraft,
  normalizeData,
  vinyasaJsonUrl,
} from '../lyricFlow'

const props = defineProps<{ name: string }>()

const data = ref<LyricFlowData | null>(null)
const source = ref<'draft' | 'file' | null>(null)

async function load() {
  const draft = loadDraft(props.name)
  if (draft?.lines?.length) {
    data.value = draft
    source.value = 'draft'
    return
  }

  try {
    const res = await fetch(vinyasaJsonUrl(props.name))
    if (res.ok) {
      const json = await res.json()
      if (json.lines?.length) {
        data.value = normalizeData(json)
        source.value = 'file'
        return
      }
    }
  } catch {
    /* empty */
  }

  data.value = null
  source.value = null
}

onMounted(load)
watch(() => props.name, load)
</script>

<template>
  <div class="lyric-flow">
    <p v-if="!data?.lines?.length" class="lyric-flow-empty">
      아직 저장된 플로우가 없습니다. 위 「가사 플로우 만들기」에서 직접 만드세요.
    </p>
    <template v-else>
      <p v-if="source === 'draft'" class="lyric-flow-source">브라우저에 저장된 작업 중 초안</p>
      <header v-if="data.meta.song" class="lyric-flow-header">
        <span class="lyric-flow-song">{{ data.meta.song }}</span>
        <span v-if="data.meta.artist" class="lyric-flow-artist">{{ data.meta.artist }}</span>
      </header>
      <LyricFlowVerse
        v-for="(line, li) in data.lines"
        :key="line.id"
        :line="line"
        :measure="data.measures?.[li]"
        :global-anchor-offset="anchorGlobalOffset(data.measures ?? [], li)"
      />
    </template>
  </div>
</template>
