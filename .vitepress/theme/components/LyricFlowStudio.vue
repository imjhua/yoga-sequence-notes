<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useData } from 'vitepress'
import LyricLineEditor from './LyricLineEditor.vue'
import LyricFlowVerse from './LyricFlowVerse.vue'
import LyricFlowYoutube from './LyricFlowYoutube.vue'
import {
  type LyricFlowData,
  type TimeSignature,
  anchorGlobalOffset,
  applyPlaybackLocal,
  clearDraft,
  loadDraft,
  normalizeData,
  persistPlaybackFromMeta,
  insertLineAt,
  removeLineAt,
  reflowLinesByBreath,
  saveDraft,
  saveClearedDraft,
  vinyasaJsonUrl,
} from '../lyricFlow'
import { DEFAULT_BEAT_MS, useBeatCounter } from '../useBeatCounter'
import { provideLyricBeatContext } from '../useLyricBeatContext'
import { useYoutubeBpmSync } from '../useYoutubeBpmSync'
import {
  type VinyasaManifest,
  fetchManifest,
  saveFlowToServer,
} from '../saveFlow'

const { site } = useData()

const manifest = ref<VinyasaManifest>({ activeId: null, sequences: [] })
const activeId = ref('')
const data = ref<LyricFlowData>({ meta: { theme: '빈야사' }, lines: [] })
const savedHint = ref(false)
const showPreview = ref(false)
const loading = ref(true)
const saving = ref(false)
const saveFlowMessage = ref('')

let saveTimer: ReturnType<typeof setTimeout> | undefined
let skipPersist = false

const activeEntry = computed(() =>
  manifest.value.sequences.find((s) => s.id === activeId.value),
)

const isLocallyCleared = computed(() =>
  !!data.value.meta?.draftClearedAt && !data.value.lines.length,
)

const pageTitle = computed(() => {
  if (!activeId.value || isLocallyCleared.value) return '빈야사 시퀀스 생성'
  const song = data.value.meta?.song?.trim()
  if (song) return song
  if (data.value.lines.length && activeEntry.value?.title) return activeEntry.value.title
  return '빈야사 시퀀스 생성'
})

const pageArtist = computed(() => {
  if (!data.value.lines.length) return ''
  return data.value.meta?.artist?.trim() ?? ''
})

const showIntro = computed(() =>
  !loading.value && !manifest.value.sequences.length,
)

function setYoutubeUrl(url: string) {
  const trimmed = url.trim()
  data.value.meta = {
    ...data.value.meta,
    youtubeUrl: trimmed || undefined,
    ...(trimmed
      ? {}
      : {
          bpm: undefined,
          beatMs: undefined,
          bpmSource: undefined,
          bpmAnalyzedAt: undefined,
        }),
  }
  if (activeId.value) persistPlaybackFromMeta(activeId.value, data.value.meta)
}

function setTimeSignature(ts: TimeSignature | '') {
  data.value.meta = {
    ...data.value.meta,
    timeSignature: ts || undefined,
  }
}

const timeSignatureRef = computed({
  get: () => data.value.meta.timeSignature ?? '',
  set: (ts: TimeSignature | '') => setTimeSignature(ts),
})

const beatMsRef = computed({
  get: () => data.value.meta.beatMs ?? DEFAULT_BEAT_MS,
  set: (ms: number) => {
    data.value.meta = { ...data.value.meta, beatMs: ms }
  },
})

const beatCounter = useBeatCounter(timeSignatureRef, beatMsRef)

provideLyricBeatContext({
  activeBeatIndex: beatCounter.activeBeatIndex,
  beatRunning: beatCounter.beatRunning,
  beatTotal: beatCounter.beatTotal,
  beatSequence: beatCounter.beatSequence,
  toggleBeatRun: beatCounter.toggleBeatRun,
  resetBeatTimer: beatCounter.resetBeatTimer,
  pauseBeatTimer: beatCounter.pauseBeatTimer,
  startBeatTimer: beatCounter.startBeatTimer,
  beatMs: beatMsRef,
  timeSignature: timeSignatureRef,
})

function persist() {
  if (skipPersist || !activeId.value) return
  persistPlaybackFromMeta(activeId.value, data.value.meta)
  saveDraft(activeId.value, data.value)
  savedHint.value = true
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    savedHint.value = false
  }, 1500)
}

function onLineChange() {
  reflowLinesByBreath(data.value)
}

function onLineRawChange() {
}

function insertLineAfter(afterIndex: number, raw = '') {
  insertLineAt(data.value, afterIndex, raw)
  if (raw.trim()) reflowLinesByBreath(data.value)
}

function removeLine(index: number) {
  removeLineAt(data.value, index)
  reflowLinesByBreath(data.value)
}

const { bpmAnalyzing, bpmError } = useYoutubeBpmSync(activeId, data, { onPersist: persist })

function finalizeLoadedData(id: string, next: LyricFlowData): LyricFlowData {
  return applyPlaybackLocal(id, normalizeData(next))
}

async function fetchSequenceFile(id: string): Promise<LyricFlowData | null> {
  try {
    const res = await fetch(vinyasaJsonUrl(id))
    if (!res.ok) return null
    return normalizeData(await res.json())
  } catch {
    return null
  }
}

async function loadSequence(
  id: string,
  { persistDraft = true, deselectIfCleared = false, forceFromFile = false } = {},
) {
  if (!id) {
    data.value = { meta: { theme: '빈야사' }, lines: [] }
    return
  }

  loading.value = true
  const draft = loadDraft(id)
  const fileData = await fetchSequenceFile(id)
  const fileHasLines = (fileData?.lines?.length ?? 0) > 0
  const fileReady = fileHasLines && (fileData?.meta?.seededAt || fileData?.meta?.savedAt)

  if (forceFromFile && fileReady) {
    clearDraft(id)
    data.value = finalizeLoadedData(id, fileData!)
    if (persistDraft) saveDraft(id, data.value)
    loading.value = false
    return
  }

  if (draft?.meta?.draftClearedAt && !draft.lines?.length) {
    const fileStamp = fileData?.meta?.savedAt || fileData?.meta?.seededAt
    if (!fileStamp || fileStamp <= draft.meta.draftClearedAt) {
      if (deselectIfCleared) {
        activeId.value = ''
        data.value = { meta: { theme: '빈야사' }, lines: [] }
      } else {
        data.value = draft
      }
      loading.value = false
      return
    }
    clearDraft(id)
  }

  if (fileReady) {
    const fileSeed = fileData!.meta?.seededAt
    const draftSeed = draft?.meta?.seededAt
    if (!draft?.lines?.length || (fileSeed && fileSeed !== draftSeed)) {
      data.value = finalizeLoadedData(id, fileData!)
      if (persistDraft) saveDraft(id, data.value)
    } else {
      data.value = finalizeLoadedData(id, draft!)
    }
  } else if (draft?.lines?.length) {
    data.value = finalizeLoadedData(id, draft)
  } else {
    clearDraft(id)
    data.value = fileData
      ? finalizeLoadedData(id, fileData)
      : { meta: { theme: '빈야사' }, lines: [] }
  }

  loading.value = false
}

function querySequenceId(): string {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('id')?.trim() ?? ''
}

async function init() {
  loading.value = true
  manifest.value = await fetchManifest()

  const ids = manifest.value.sequences.map((s) => s.id)
  const queryId = querySequenceId()
  let id = queryId && ids.includes(queryId) ? queryId : manifest.value.activeId
  if (!id || !ids.includes(id)) {
    id = manifest.value.sequences[0]?.id ?? ''
  }
  activeId.value = id

  if (id) {
    await loadSequence(id, {
      deselectIfCleared: !queryId,
      forceFromFile: !!queryId,
    })
  } else {
    data.value = { meta: { theme: '빈야사' }, lines: [] }
    loading.value = false
  }
}

async function onSelectSequence(e: Event) {
  const nextId = (e.target as HTMLSelectElement).value
  if (nextId === activeId.value) return

  if (activeId.value) saveDraft(activeId.value, data.value)
  activeId.value = nextId
  showPreview.value = false
  await loadSequence(nextId, { forceFromFile: true })
}

async function startFresh() {
  if (!activeId.value && !data.value.lines.length) return
  if (!confirm('새 시퀀스를 추가할까요?\n\n화면이 비워집니다. 에이전트에게 영어 가사를 알려주세요.')) {
    return
  }

  const id = activeId.value
  skipPersist = true
  savedHint.value = false
  showPreview.value = false
  if (id) saveClearedDraft(id)
  activeId.value = ''
  data.value = { meta: { theme: '빈야사' }, lines: [] }
  saveFlowMessage.value = '새 시퀀스 · 가사를 알려주세요'
  skipPersist = false
  setTimeout(() => { saveFlowMessage.value = '' }, 3000)
}

async function saveFlow() {
  if (!activeId.value || !data.value.lines.length || saving.value) return

  saving.value = true
  saveFlowMessage.value = ''

  try {
    const result = await saveFlowToServer(activeId.value, data.value)
    data.value.meta.savedAt = new Date().toISOString()
    saveDraft(activeId.value, data.value)
    manifest.value = await fetchManifest()
    saveFlowMessage.value = `저장됨 · ${result.title}`
  } catch {
    saveFlowMessage.value = '저장 실패 (로컬 dev에서만 파일 저장)'
  } finally {
    saving.value = false
    setTimeout(() => { saveFlowMessage.value = '' }, 5000)
  }
}

watch(data, persist, { deep: true })
watch(pageTitle, (title) => {
  if (typeof document === 'undefined') return
  document.title = `${title} | ${site.value.title}`
}, { immediate: true })
onMounted(init)
</script>

<template>
  <div class="studio-page">
    <header class="studio-page-header">
      <div class="studio-page-header-text">
        <h1>{{ pageTitle }}</h1>
        <p v-if="pageArtist" class="studio-page-meta">{{ pageArtist }}</p>
        <p v-else-if="showIntro" class="studio-page-meta">
          에이전트에게 <strong>영어 가사</strong>를 알려주면 시퀀스가 추가됩니다.
          아래에서 <strong>선택 · 편집 · 미리보기 · 저장</strong>을 한 번에 할 수 있습니다.
        </p>
      </div>
      <LyricFlowYoutube
        v-if="activeId && !loading && data.meta.youtubeUrl"
        mode="embed"
        compact
        corner
        :url="data.meta.youtubeUrl"
        :time-signature="data.meta.timeSignature ?? ''"
        :beat-ms="data.meta.beatMs ?? DEFAULT_BEAT_MS"
        :bpm="data.meta.bpm"
        :bpm-analyzing="bpmAnalyzing"
        :bpm-error="bpmError"
        @update:time-signature="setTimeSignature"
      />
    </header>

    <div class="lyric-flow-studio">
    <div class="studio-picker">
      <label class="studio-picker-label" for="vinyasa-sequence-select">시퀀스</label>
      <select
        id="vinyasa-sequence-select"
        class="studio-picker-select"
        :value="activeId"
        :disabled="!manifest.sequences.length"
        @change="onSelectSequence"
      >
        <option value="">—</option>
        <option
          v-for="seq in manifest.sequences"
          :key="seq.id"
          :value="seq.id"
        >
          {{ seq.title }}
        </option>
      </select>
      <span v-if="activeEntry?.updatedAt" class="studio-picker-meta">
        {{ activeEntry.updatedAt.slice(0, 10) }}
      </span>
      <button
        v-if="manifest.sequences.length && !loading"
        type="button"
        class="studio-btn studio-picker-add"
        @click="startFresh"
      >
        새로 추가하기
      </button>
    </div>

    <LyricFlowYoutube
      v-if="activeId && !loading"
      mode="input"
      :url="data.meta.youtubeUrl"
      :time-signature="data.meta.timeSignature ?? ''"
      :beat-ms="data.meta.beatMs ?? DEFAULT_BEAT_MS"
      @update:url="setYoutubeUrl"
      @update:time-signature="setTimeSignature"
    />

    <div v-if="loading" class="studio-empty">불러오는 중…</div>

    <div v-else-if="!manifest.sequences.length" class="studio-empty">
      아직 시퀀스가 없습니다.<br>
      에이전트에게 영어 가사를 알려주세요.
    </div>

    <div v-else-if="!data.lines.length" class="studio-empty">
      <p v-if="saveFlowMessage" class="studio-status ok studio-empty-msg">{{ saveFlowMessage }}</p>
      <template v-if="!activeId || isLocallyCleared">
        가사가 없습니다.<br>
        직접 추가하거나 에이전트에게 영어 가사를 알려주세요.
      </template>
      <template v-else>
        「{{ activeEntry?.title || activeId }}」에 가사가 없습니다.<br>
        아래에서 직접 추가하거나 에이전트에게 영어 가사를 알려주세요.
      </template>
      <button
        v-if="activeId"
        type="button"
        class="studio-btn studio-line-insert-start"
        @click="insertLineAfter(-1, '')"
      >
        + 첫 구절 추가
      </button>
    </div>

    <template v-else>
      <section class="studio-section studio-section-compact">
        <div class="studio-bar">
          <div class="studio-bar-right">
            <span v-if="savedHint" class="studio-status ok">초안</span>
            <span v-if="saveFlowMessage" class="studio-status ok">{{ saveFlowMessage }}</span>
            <button
              type="button"
              class="studio-btn"
              :class="{ active: showPreview }"
              @click="showPreview = !showPreview"
            >
              {{ showPreview ? '편집으로' : '미리보기' }}
            </button>
            <button
              type="button"
              class="studio-btn primary"
              :disabled="saving"
              @click="saveFlow"
            >
              {{ saving ? '저장 중…' : '저장' }}
            </button>
          </div>
        </div>

        <div v-if="showPreview" class="studio-preview">
          <LyricFlowVerse
            v-for="(line, li) in data.lines"
            :key="line.id"
            :line="line"
            :measure="data.measures?.[li]"
            :global-anchor-offset="anchorGlobalOffset(data.measures ?? [], li)"
          />
        </div>

        <div v-else class="studio-lines">
          <p v-if="data.meta.timeSignature" class="studio-beat-hint">
            가사를 직접 입력하고, 박자 시작 후 활성 박자에 단어를 클릭하세요. INHALE/EXHALE은 bold 순서로 자동입니다.
          </p>
          <template v-for="(line, li) in data.lines" :key="line.id">
            <LyricLineEditor
              :line="line"
              :measure="data.measures![li]"
              :line-index="li"
              :all-measures="data.measures!"
              @raw-change="onLineRawChange"
              @change="onLineChange"
              @delete="removeLine(li)"
            />
            <button
              type="button"
              class="studio-line-insert"
              :aria-label="`구절 ${li + 1} 뒤에 추가`"
              @click="insertLineAfter(li)"
            >
              +
            </button>
          </template>
        </div>
      </section>
    </template>
    </div>
  </div>
</template>
