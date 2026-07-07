<script setup lang="ts">
import { computed } from 'vue'
import {
  anchorAtToken,
  anchorGlobalOffset,
  breathForGlobalIndex,
  clearMeasureAnchorByToken,
  lineTokens,
  setMeasureAnchor,
  updateLineRaw,
  type LyricLine,
  type LyricMeasure,
} from '../lyricFlow'
import { useLyricBeatContext } from '../useLyricBeatContext'

const props = defineProps<{
  line: LyricLine
  measure: LyricMeasure
  lineIndex: number
  allMeasures: LyricMeasure[]
}>()

const emit = defineEmits<{ change: []; 'raw-change': []; delete: [] }>()

const beatCtx = useLyricBeatContext()

const tokens = computed(() => lineTokens(props.line))
const globalOffset = computed(() => anchorGlobalOffset(props.allMeasures, props.lineIndex))
const beatTotal = computed(() => beatCtx?.beatTotal.value ?? 0)
const hasAnchor = computed(() => props.measure.anchors.length > 0)

const firstBreathTokenIndex = computed(() => {
  for (let ti = 0; ti < tokens.value.length; ti++) {
    if (tokenBreathLabel(ti)) return ti
  }
  return -1
})

const effectiveBeat = computed(() => {
  if (beatCtx?.beatRunning.value && beatCtx.activeBeatIndex.value >= 0) {
    return beatCtx.activeBeatIndex.value
  }
  return null
})

function tokenBreathLabel(tokenIndex: number): string | null {
  const anchor = anchorAtToken(props.measure, tokenIndex)
  if (!anchor) return null
  const anchorsBefore = props.measure.anchors
    .filter((a) => a.beatIndex < anchor.beatIndex)
    .length
  const globalIndex = globalOffset.value + anchorsBefore
  const breath = breathForGlobalIndex(globalIndex)
  return breath === 'inhale' ? 'INHALE' : 'EXHALE'
}

function onWordClick(tokenIndex: number) {
  const existing = anchorAtToken(props.measure, tokenIndex)
  if (existing) {
    clearMeasureAnchorByToken(props.measure, props.line, tokenIndex)
    emit('change')
    return
  }

  const beatIndex = effectiveBeat.value
  if (beatIndex === null || beatIndex < 0) {
    setMeasureAnchor(props.measure, props.line, 0, tokenIndex)
    emit('change')
    return
  }

  setMeasureAnchor(props.measure, props.line, beatIndex, tokenIndex)
  emit('change')
}

function onPoseInput(e: Event) {
  props.line.pose = (e.target as HTMLInputElement).value
  emit('raw-change')
}

function onRawInput(e: Event) {
  updateLineRaw(props.line, props.measure, (e.target as HTMLInputElement).value)
  emit('raw-change')
}

function onRawBlur() {
  emit('change')
}

function isCountActive(beatIndex: number): boolean {
  return !!(
    beatCtx?.beatRunning.value &&
    beatCtx.activeBeatIndex.value === beatIndex
  )
}
</script>

<template>
  <section
    class="line-card"
    :class="hasAnchor ? 'line-card-action' : 'line-card-wait'"
    :aria-label="`구절 ${line.id} 편집`"
  >
    <div class="line-card-header">
      <input
        :value="line.raw"
        type="text"
        class="line-raw-input"
        placeholder="가사 입력 (예: la-la)"
        :aria-label="`구절 ${line.id} 가사`"
        @input="onRawInput"
        @blur="onRawBlur"
      >
      <button
        type="button"
        class="line-delete-btn"
        :aria-label="`구절 ${line.id} 삭제`"
        title="삭제"
        @click="emit('delete')"
      >
        ×
      </button>
    </div>

    <div v-if="hasAnchor && beatTotal" class="line-beat-row" aria-live="polite">
      <span
        v-for="n in beatTotal"
        :key="n"
        class="line-beat-num"
        :class="{ active: isCountActive(n - 1) }"
      >
        {{ n }}
      </span>
    </div>

    <div class="line-en-row">
      <span v-for="(token, ti) in tokens" :key="ti" class="line-chunk">
        <button
          type="button"
          class="line-word"
          :class="{ bold: token.emphasis }"
          @click="onWordClick(ti)"
        >
          {{ token.text }}
        </button>
        <span
          v-if="tokenBreathLabel(ti)"
          class="line-breath-cue"
          :class="tokenBreathLabel(ti) === 'INHALE' ? 'inhale' : 'exhale'"
        >
          {{ tokenBreathLabel(ti) }}
        </span>
        <input
          v-if="hasAnchor && firstBreathTokenIndex === ti"
          :value="line.pose"
          type="text"
          class="line-pose"
          placeholder="자세"
          aria-label="자세"
          @input="onPoseInput"
        >
      </span>
    </div>

    <p v-if="line.translation" class="line-ko">{{ line.translation }}</p>
  </section>
</template>
