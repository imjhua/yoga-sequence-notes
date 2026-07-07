import { ref, watch, type Ref } from 'vue'
import { lookupBpmForYoutube } from './bpmLookup'
import {
  type LyricFlowData,
  beatMsFromBpm,
  parseYoutubeVideoId,
  persistPlaybackFromMeta,
} from './lyricFlow'

export function useYoutubeBpmSync(
  sequenceId: Ref<string>,
  data: Ref<LyricFlowData | null>,
  options: { onPersist?: () => void } = {},
) {
  const bpmAnalyzing = ref(false)
  const bpmError = ref('')
  let syncToken = 0

  async function syncBpmForCurrentUrl(force = false) {
    const id = sequenceId.value
    const current = data.value
    const url = current?.meta.youtubeUrl?.trim()
    const videoId = url ? parseYoutubeVideoId(url) : null

    bpmError.value = ''
    if (!id || !current || !url || !videoId) {
      if (id && current) persistPlaybackFromMeta(id, current.meta)
      return
    }

    const currentVideoId = parseYoutubeVideoId(current.meta.youtubeUrl ?? '')
    if (
      !force &&
      current.meta.bpm &&
      current.meta.bpmAnalyzedAt &&
      currentVideoId === videoId
    ) {
      const nextBeatMs = beatMsFromBpm(current.meta.bpm)
      if (data.value.meta.beatMs !== nextBeatMs) {
        data.value.meta = { ...data.value.meta, beatMs: nextBeatMs }
      }
      persistPlaybackFromMeta(id, data.value.meta)
      return
    }

    const token = ++syncToken
    bpmAnalyzing.value = true

    try {
      const result = await lookupBpmForYoutube(url, {
        song: current.meta.song,
        artist: current.meta.artist,
      })

      if (token !== syncToken || !data.value) return

      if (!result) {
        bpmError.value = 'BPM을 찾지 못했습니다.'
        persistPlaybackFromMeta(id, {
          ...data.value.meta,
          youtubeUrl: url,
        })
        return
      }

      data.value.meta = {
        ...data.value.meta,
        youtubeUrl: url,
        bpm: Math.round(result.bpm * 100) / 100,
        beatMs: result.beatMs,
        bpmSource: result.source,
        bpmAnalyzedAt: new Date().toISOString(),
      }
      persistPlaybackFromMeta(id, data.value.meta)
      options.onPersist?.()
    } catch {
      if (token !== syncToken) return
      bpmError.value = 'BPM 분석에 실패했습니다.'
    } finally {
      if (token === syncToken) bpmAnalyzing.value = false
    }
  }

  watch(
    () => [sequenceId.value, data.value?.meta.youtubeUrl] as const,
    ([id, url]) => {
      if (!id || !data.value) return
      if (url?.trim()) void syncBpmForCurrentUrl()
      else {
        bpmError.value = ''
        persistPlaybackFromMeta(id, data.value.meta)
      }
    },
    { immediate: true },
  )

  return { bpmAnalyzing, bpmError, syncBpmForCurrentUrl }
}
