<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useData } from 'vitepress'
import LyricLineEditor from './LyricLineEditor.vue'
import LyricFlowVerse from './LyricFlowVerse.vue'
import {
  type LyricFlowData,
  clearDraft,
  loadDraft,
  normalizeData,
  renderExportLine,
  saveDraft,
  saveClearedDraft,
  vinyasaJsonUrl,
} from '../lyricFlow'
import {
  type VinyasaManifest,
  fetchManifest,
  saveFlowToServer,
  downloadTextFile,
} from '../saveFlow'

const { site } = useData()

const manifest = ref<VinyasaManifest>({ activeId: null, sequences: [] })
const activeId = ref('')
const data = ref<LyricFlowData>({ meta: { theme: '빈야사' }, lines: [] })
const savedHint = ref(false)
const showPreview = ref(false)
const copied = ref(false)
const loading = ref(true)
const saving = ref(false)
const saveFlowMessage = ref('')

let saveTimer: ReturnType<typeof setTimeout> | undefined
let skipPersist = false

const hasLocalDraft = computed(() => data.value.lines.length > 0)

const activeEntry = computed(() =>
  manifest.value.sequences.find((s) => s.id === activeId.value),
)

const isLocallyCleared = computed(() =>
  !!data.value.meta?.draftClearedAt && !data.value.lines.length,
)

const pageTitle = computed(() => {
  if (!activeId.value || isLocallyCleared.value) return '빈야사'
  const song = data.value.meta?.song?.trim()
  if (song) return song
  if (data.value.lines.length && activeEntry.value?.title) return activeEntry.value.title
  return '빈야사'
})

const pageArtist = computed(() => {
  if (!data.value.lines.length) return ''
  return data.value.meta?.artist?.trim() ?? ''
})

const showIntro = computed(() =>
  !loading.value && !manifest.value.sequences.length,
)

function persist() {
  if (skipPersist || !activeId.value) return
  saveDraft(activeId.value, data.value)
  savedHint.value = true
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    savedHint.value = false
  }, 1500)
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
  { persistDraft = true, deselectIfCleared = false } = {},
) {
  if (!id) {
    data.value = { meta: { theme: '빈야사' }, lines: [] }
    return
  }

  loading.value = true
  const draft = loadDraft(id)
  const fileData = await fetchSequenceFile(id)

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

  const fileHasLines = (fileData?.lines?.length ?? 0) > 0
  const fileReady = fileHasLines && (fileData?.meta?.seededAt || fileData?.meta?.savedAt)

  if (fileReady) {
    const fileSeed = fileData!.meta?.seededAt
    const draftSeed = draft?.meta?.seededAt
    if (!draft?.lines?.length || (fileSeed && fileSeed !== draftSeed)) {
      data.value = fileData!
      if (persistDraft) saveDraft(id, fileData!)
    } else {
      data.value = draft!
    }
  } else if (draft?.lines?.length) {
    data.value = draft
  } else {
    clearDraft(id)
    data.value = fileData ?? { meta: { theme: '빈야사' }, lines: [] }
  }

  loading.value = false
}

async function init() {
  loading.value = true
  manifest.value = await fetchManifest()

  const ids = manifest.value.sequences.map((s) => s.id)
  let id = manifest.value.activeId
  if (!id || !ids.includes(id)) {
    id = manifest.value.sequences[0]?.id ?? ''
  }
  activeId.value = id

  if (id) await loadSequence(id, { deselectIfCleared: true })
  else {
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
  await loadSequence(nextId)
}

async function clearLocalDraft() {
  if (!activeId.value || !data.value.lines.length) return
  if (!confirm('브라우저 편집 초안을 삭제할까요?\n\n화면에서 가사·제목이 사라집니다. JSON 파일은 변경되지 않습니다.')) {
    return
  }

  const id = activeId.value
  skipPersist = true
  savedHint.value = false
  showPreview.value = false
  saveClearedDraft(id)
  activeId.value = ''
  data.value = { meta: { theme: '빈야사' }, lines: [] }
  saveFlowMessage.value = '로컬 초안 삭제됨'
  skipPersist = false
  setTimeout(() => { saveFlowMessage.value = '' }, 3000)
}

const exportJson = computed(() => JSON.stringify(data.value, null, 2))
const exportText = computed(() =>
  data.value.lines.map((l) => renderExportLine(l)).join('\n'),
)

async function copyJson() {
  await navigator.clipboard.writeText(exportJson.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function downloadJson() {
  downloadTextFile(`${activeId.value || 'sequence'}.json`, exportJson.value)
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
    downloadJson()
    saveFlowMessage.value = 'JSON 다운로드됨 (로컬 dev에서만 파일 저장)'
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
      <h1>{{ pageTitle }}</h1>
      <p v-if="pageArtist" class="studio-page-meta">{{ pageArtist }}</p>
      <p v-else-if="showIntro" class="studio-page-meta">
        에이전트에게 <strong>영어 가사</strong>를 알려주면 시퀀스가 추가됩니다.
        아래에서 <strong>선택 · 편집 · 미리보기 · 저장</strong>을 한 번에 할 수 있습니다.
      </p>
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
    </div>

    <div v-if="loading" class="studio-empty">불러오는 중…</div>

    <div v-else-if="!manifest.sequences.length" class="studio-empty">
      아직 시퀀스가 없습니다.<br>
      에이전트에게 영어 가사를 알려주세요.
    </div>

    <div v-else-if="!data.lines.length" class="studio-empty">
      <p v-if="saveFlowMessage" class="studio-status ok studio-empty-msg">{{ saveFlowMessage }}</p>
      <template v-if="!activeId || isLocallyCleared">
        가사가 없습니다.<br>
        에이전트에게 영어 가사를 알려주세요.
      </template>
      <template v-else>
        「{{ activeEntry?.title || activeId }}」에 가사가 없습니다.<br>
        에이전트에게 영어 가사를 알려주세요.
      </template>
    </div>

    <template v-else>
      <section class="studio-section studio-section-compact">
        <div class="studio-bar">
          <span class="studio-bar-hint">단어 클릭 → 굵게 · 셀렉트 → IN/EX</span>
          <div class="studio-bar-right">
            <span v-if="savedHint" class="studio-status ok">초안</span>
            <span v-if="saveFlowMessage" class="studio-status ok">{{ saveFlowMessage }}</span>
            <button
              v-if="hasLocalDraft"
              type="button"
              class="studio-btn danger"
              @click="clearLocalDraft"
            >
              로컬 초안 삭제
            </button>
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
          <header v-if="data.meta.song" class="lyric-flow-header">
            <span class="lyric-flow-song">{{ data.meta.song }}</span>
            <span v-if="data.meta.artist" class="lyric-flow-artist">{{ data.meta.artist }}</span>
          </header>
          <LyricFlowVerse
            v-for="line in data.lines"
            :key="line.id"
            :line="line"
          />
        </div>

        <div v-else class="studio-lines">
          <LyricLineEditor
            v-for="line in data.lines"
            :key="line.id"
            :line="line"
            @change="persist"
          />
        </div>
      </section>

      <details class="studio-export">
        <summary>JSON 내보내기</summary>
        <div class="studio-export-body">
          <p class="studio-export-path">
            <code>sequences/vinyasa/{{ activeId }}.json</code>
          </p>
          <div class="studio-export-btns">
            <button type="button" class="studio-btn" @click="copyJson">
              {{ copied ? '복사됨 ✓' : 'JSON 복사' }}
            </button>
            <button type="button" class="studio-btn" @click="downloadJson">다운로드</button>
          </div>
          <pre class="studio-export-pre">{{ exportText }}</pre>
        </div>
      </details>
    </template>
    </div>
  </div>
</template>
