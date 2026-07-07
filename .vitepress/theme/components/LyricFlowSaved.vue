<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import LyricFlowVerse from './LyricFlowVerse.vue'
import LyricFlowYoutube from './LyricFlowYoutube.vue'
import {
  type LyricFlowData,
  anchorGlobalOffset,
  applyPlaybackLocal,
  DEFAULT_BEAT_MS,
  normalizeData,
  vinyasaJsonUrl,
} from '../lyricFlow'
import { useYoutubeBpmSync } from '../useYoutubeBpmSync'

const props = defineProps<{ flow?: string }>()

const { frontmatter } = useData()
const data = ref<LyricFlowData | null>(null)
const loading = ref(false)

const flowName = computed(() => props.flow || (frontmatter.value?.flow as string) || '')

function mergePlayback(source: LyricFlowData): LyricFlowData {
  if (!flowName.value) return source
  return applyPlaybackLocal(flowName.value, source)
}

function readEmbedded(): LyricFlowData | null {
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
}

async function loadJson() {
  const embedded = readEmbedded()
  if (embedded) {
    data.value = mergePlayback(embedded)
    return
  }

  if (!flowName.value) {
    data.value = null
    return
  }

  loading.value = true
  try {
    const res = await fetch(vinyasaJsonUrl(flowName.value))
    if (res.ok) {
      data.value = mergePlayback(normalizeData(await res.json()))
    } else {
      data.value = null
    }
  } catch {
    data.value = null
  } finally {
    loading.value = false
  }
}

const flowId = computed(() => flowName.value)

const { bpmAnalyzing, bpmError } = useYoutubeBpmSync(flowId, data)

const editHref = computed(() =>
  flowName.value ? `/sequences/vinyasa/?id=${flowName.value}` : '',
)

onMounted(loadJson)
watch(flowName, loadJson)
</script>

<template>
  <div class="lyric-flow lyric-flow-saved">
    <div v-if="editHref" class="vinyasa-saved-top">
      <LyricFlowYoutube
        v-if="data?.meta?.youtubeUrl"
        mode="embed"
        compact
        corner
        :url="data.meta.youtubeUrl"
        :time-signature="data.meta.timeSignature ?? ''"
        :beat-ms="data.meta.beatMs ?? DEFAULT_BEAT_MS"
        :bpm="data.meta.bpm"
        :bpm-analyzing="bpmAnalyzing"
        :bpm-error="bpmError"
      />
      <a :href="editHref" class="vinyasa-edit-link">편집하기 →</a>
    </div>
    <p v-if="loading" class="lyric-flow-empty">불러오는 중…</p>
    <p v-else-if="!data?.lines?.length" class="lyric-flow-empty">
      저장된 수업 플로우가 없습니다.
    </p>
    <template v-else>
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
