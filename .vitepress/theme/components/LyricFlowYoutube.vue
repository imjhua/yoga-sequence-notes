<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import {
  TIME_SIGNATURES,
  beatMsProgress,
  countTotalForTimeSignature,
  DEFAULT_BEAT_MS,
  formatBeatMs,
  isTimeSignature,
  parseYoutubeVideoId,
  type TimeSignature,
} from '../lyricFlow'
import { useLyricBeatContext } from '../useLyricBeatContext'
import { useYoutubeBeatPlayer } from '../useYoutubeBeatPlayer'

const props = withDefaults(
  defineProps<{
    url?: string
    timeSignature?: TimeSignature | ''
    beatMs?: number
    bpm?: number
    bpmAnalyzing?: boolean
    bpmError?: string
    mode?: 'embed' | 'input' | 'both'
    compact?: boolean
    corner?: boolean
    showMeter?: boolean
  }>(),
  {
    mode: 'both',
    compact: false,
    corner: false,
    showMeter: true,
    timeSignature: '',
    beatMs: DEFAULT_BEAT_MS,
    bpmAnalyzing: false,
    bpmError: '',
  },
)

const emit = defineEmits<{
  'update:url': [value: string]
  'update:timeSignature': [value: TimeSignature | '']
}>()

const beatCtx = useLyricBeatContext()
const standaloneBeatMs = ref(props.beatMs ?? DEFAULT_BEAT_MS)

watch(
  () => props.beatMs,
  (value) => {
    if (value != null) standaloneBeatMs.value = value
  },
)

const effectiveBeatMs = computed(() => beatCtx?.beatMs.value ?? standaloneBeatMs.value)

const speedProgress = computed(() => {
  if (props.bpmAnalyzing) return 40
  if (props.bpm) return beatMsProgress(effectiveBeatMs.value)
  return 0
})

const speedBarStyle = computed(() => ({
  '--speed-progress': `${speedProgress.value}%`,
}))

const inputValue = computed({
  get: () => props.url ?? '',
  set: (value: string) => emit('update:url', value),
})

const videoId = computed(() => parseYoutubeVideoId(props.url ?? ''))
const showInvalidHint = computed(() => !!props.url?.trim() && !videoId.value)
const showEmbed = computed(() => (props.mode === 'embed' || props.mode === 'both') && !!videoId.value)
const showInput = computed(() => props.mode === 'input' || props.mode === 'both')
const showMeterUi = computed(() => props.showMeter && showEmbed.value)

const playerHost = ref<HTMLElement | null>(null)
const localTimeSignature = ref<TimeSignature | ''>(props.timeSignature || '')

watch(
  () => props.timeSignature,
  (value) => {
    localTimeSignature.value = value || ''
  },
)

const timeSignatureRef = computed({
  get: () => localTimeSignature.value,
  set: (value: TimeSignature | '') => {
    localTimeSignature.value = value
    emit('update:timeSignature', value)
  },
})

const beatMsRef = computed(() => effectiveBeatMs.value)

const { beatRunning, activeBeatIndex, beatSequence, beatTotal, toggleBeatRun, resetBeatTimer } = useYoutubeBeatPlayer(
  playerHost,
  videoId,
  toRef(() => localTimeSignature.value),
  beatMsRef,
)

function onTimeSignatureChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  timeSignatureRef.value = isTimeSignature(value) ? value : ''
}
</script>

<template>
  <section
    v-if="showEmbed || showInput"
    class="lyric-youtube"
    :class="{
      'lyric-youtube-compact': compact,
      'lyric-youtube-corner': corner,
      'lyric-youtube-input-only': showInput && !showEmbed,
    }"
  >
    <div v-if="showInput" class="lyric-youtube-row">
      <label class="lyric-youtube-label" for="lyric-youtube-url">YouTube</label>
      <input
        id="lyric-youtube-url"
        v-model="inputValue"
        class="lyric-youtube-input"
        type="url"
        inputmode="url"
        placeholder="https://www.youtube.com/watch?v=..."
        spellcheck="false"
      >
      <p v-if="showInvalidHint" class="lyric-youtube-hint">YouTube URL을 확인해 주세요.</p>
    </div>

    <div v-if="showEmbed" class="lyric-youtube-media" :class="{ 'lyric-youtube-media-corner': corner }">
      <div class="lyric-youtube-side">
        <div v-if="showMeterUi" class="lyric-youtube-meter">
          <label class="lyric-youtube-label" for="lyric-time-signature">박자</label>
          <select
            id="lyric-time-signature"
            class="lyric-youtube-meter-select"
            :value="localTimeSignature"
            @change="onTimeSignatureChange"
          >
            <option value="">—</option>
            <option v-for="ts in TIME_SIGNATURES" :key="ts" :value="ts">
              {{ ts }} · {{ countTotalForTimeSignature(ts) }}카운트
            </option>
          </select>
        </div>

        <div v-if="beatTotal" class="lyric-youtube-beats" aria-live="polite">
          <div class="lyric-youtube-beat-row">
            <span
              v-for="(num, i) in beatSequence"
              :key="i"
              class="lyric-youtube-beat-num"
              :class="{ active: activeBeatIndex === i }"
            >
              {{ num }}
            </span>
          </div>

          <div
            class="lyric-youtube-speed lyric-youtube-speed-auto"
            :class="{ analyzing: bpmAnalyzing, error: !!bpmError && !bpmAnalyzing }"
          >
            <div class="lyric-youtube-speed-head">
              <span class="lyric-youtube-label">속도</span>
              <span class="lyric-youtube-speed-value">
                <template v-if="bpmAnalyzing">BPM 분석 중…</template>
                <template v-else-if="bpm">
                  BPM {{ Math.round(bpm) }} · {{ formatBeatMs(effectiveBeatMs) }}/박
                </template>
                <template v-else-if="bpmError">{{ bpmError }}</template>
                <template v-else>BPM 대기</template>
              </span>
            </div>
            <div
              class="lyric-youtube-speed-bar"
              :style="speedBarStyle"
              role="progressbar"
              :aria-valuenow="Math.round(speedProgress)"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="bpm ? `BPM ${Math.round(bpm)}` : 'BPM 분석'"
            />
          </div>

          <div class="lyric-youtube-beat-actions">
            <button
              type="button"
              class="lyric-youtube-start"
              :disabled="!localTimeSignature || bpmAnalyzing"
              @click="toggleBeatRun"
            >
              {{ beatRunning ? '일시 중지' : '시작' }}
            </button>
            <button
              type="button"
              class="lyric-youtube-reset"
              :disabled="!localTimeSignature"
              @click="resetBeatTimer"
            >
              초기화
            </button>
          </div>
        </div>
      </div>

      <div class="lyric-youtube-embed">
        <div ref="playerHost" class="lyric-youtube-player-host" />
      </div>
    </div>
  </section>
</template>
