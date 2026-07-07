import { computed, onBeforeUnmount, ref, shallowRef, watch, type ComputedRef, type Ref } from 'vue'
import { DEFAULT_BEAT_MS, type TimeSignature } from './lyricFlow'
import { useBeatCounter } from './useBeatCounter'
import { useLyricBeatContext } from './useLyricBeatContext'

declare global {
  interface Window {
    YT?: typeof YT
    onYouTubeIframeAPIReady?: () => void
  }
}

declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface OnStateChangeEvent {
    data: number
  }

  interface PlayerEventHandlers {
    onStateChange?: (event: OnStateChangeEvent) => void
  }

  interface Player {
    destroy(): void
  }

  interface PlayerOptions {
    height?: string
    width?: string
    videoId?: string
    playerVars?: Record<string, string | number>
    events?: PlayerEventHandlers
  }

  interface PlayerConstructor {
    new (element: HTMLElement | string, options: PlayerOptions): Player
  }

  const Player: PlayerConstructor
}

let apiPromise: Promise<void> | null = null

function loadYoutubeIframeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()

  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        resolve()
      }
      if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return

      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    })
  }

  return apiPromise
}

export function useYoutubeBeatPlayer(
  host: Ref<HTMLElement | null>,
  videoId: Ref<string | null>,
  timeSignature: Ref<TimeSignature | '' | undefined>,
  beatMs: Ref<number> = ref(DEFAULT_BEAT_MS),
) {
  const player = shallowRef<YT.Player | null>(null)
  const shared = useLyricBeatContext()
  const resumeBeatOnPlay = ref(false)

  const beatMsForCounter = shared?.beatMs ?? beatMs
  const localBeat = useBeatCounter(timeSignature, beatMsForCounter)

  const beatRunning = shared?.beatRunning ?? localBeat.beatRunning
  const activeBeatIndex = shared?.activeBeatIndex ?? localBeat.activeBeatIndex
  const beatSequence: ComputedRef<number[]> = shared?.beatSequence ?? localBeat.beatSequence
  const beatTotal: ComputedRef<number> = shared?.beatTotal ?? localBeat.beatTotal
  const toggleBeatRun = shared?.toggleBeatRun ?? localBeat.toggleBeatRun
  const resetBeatTimer = shared?.resetBeatTimer ?? localBeat.resetBeatTimer
  const pauseBeatTimer = shared?.pauseBeatTimer ?? localBeat.pauseBeatTimer
  const startBeatTimer = shared?.startBeatTimer ?? localBeat.startBeatTimer

  function onYoutubeStateChange(event: YT.OnStateChangeEvent) {
    const state = window.YT?.PlayerState
    if (!state) return

    if (event.data === state.PLAYING) {
      if (resumeBeatOnPlay.value) {
        startBeatTimer()
        resumeBeatOnPlay.value = false
      }
      return
    }

    if (
      event.data === state.PAUSED ||
      event.data === state.ENDED ||
      event.data === state.BUFFERING
    ) {
      if (beatRunning.value) {
        resumeBeatOnPlay.value = true
        pauseBeatTimer()
      }
    }
  }

  async function mountPlayer(id: string) {
    await loadYoutubeIframeApi()
    if (!host.value || !window.YT?.Player) return

    resetBeatTimer()
    resumeBeatOnPlay.value = false

    player.value?.destroy()
    player.value = null
    host.value.innerHTML = ''

    player.value = new window.YT.Player(host.value, {
      width: '100%',
      height: '100%',
      videoId: id,
      playerVars: {
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onStateChange: onYoutubeStateChange,
      },
    })
  }

  function destroyPlayer() {
    resetBeatTimer()
    resumeBeatOnPlay.value = false
    player.value?.destroy()
    player.value = null
    if (host.value) host.value.innerHTML = ''
  }

  watch(
    [host, videoId],
    ([el, id]) => {
      if (!el || !id) {
        destroyPlayer()
        return
      }
      void mountPlayer(id)
    },
    { immediate: true },
  )

  watch(timeSignature, () => {
    resetBeatTimer()
  })

  onBeforeUnmount(destroyPlayer)

  return { beatRunning, activeBeatIndex, beatSequence, beatTotal, toggleBeatRun, resetBeatTimer }
}
