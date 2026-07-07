import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { countTotalForTimeSignature, DEFAULT_BEAT_MS, type TimeSignature } from './lyricFlow'

export { DEFAULT_BEAT_MS }

export function useBeatCounter(
  timeSignature: Ref<TimeSignature | '' | undefined>,
  beatMs: Ref<number> = ref(DEFAULT_BEAT_MS),
) {
  const beatRunning = ref(false)
  const activeBeatIndex = ref(-1)
  let beatTimer: ReturnType<typeof setInterval> | undefined

  const beatTotal = computed(() => {
    const ts = timeSignature.value
    return ts ? countTotalForTimeSignature(ts) : 0
  })

  const beatSequence = computed(() => {
    const total = beatTotal.value
    if (!total) return []
    return Array.from({ length: total }, (_, i) => i + 1)
  })

  function pauseBeatTimer() {
    if (beatTimer) {
      clearInterval(beatTimer)
      beatTimer = undefined
    }
    beatRunning.value = false
  }

  function resetBeatTimer() {
    pauseBeatTimer()
    activeBeatIndex.value = -1
  }

  function startBeatTimer() {
    const total = beatTotal.value
    if (!total) return

    if (beatTimer) {
      clearInterval(beatTimer)
      beatTimer = undefined
    }

    beatRunning.value = true
    if (activeBeatIndex.value < 0) activeBeatIndex.value = 0

    beatTimer = setInterval(() => {
      activeBeatIndex.value = (activeBeatIndex.value + 1) % total
    }, beatMs.value)
  }

  function toggleBeatRun() {
    if (beatRunning.value) pauseBeatTimer()
    else startBeatTimer()
  }

  watch(timeSignature, resetBeatTimer)

  watch(beatMs, () => {
    if (beatRunning.value) {
      pauseBeatTimer()
      startBeatTimer()
    }
  })

  onBeforeUnmount(pauseBeatTimer)

  return {
    beatRunning,
    activeBeatIndex,
    beatSequence,
    beatTotal,
    toggleBeatRun,
    resetBeatTimer,
    pauseBeatTimer,
    startBeatTimer,
  }
}
