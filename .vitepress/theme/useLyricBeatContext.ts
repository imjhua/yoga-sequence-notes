import { inject, provide, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import type { TimeSignature } from './lyricFlow'

export interface LyricBeatContext {
  activeBeatIndex: Ref<number>
  beatRunning: Ref<boolean>
  beatTotal: ComputedRef<number>
  beatSequence: ComputedRef<number[]>
  toggleBeatRun: () => void
  resetBeatTimer: () => void
  pauseBeatTimer: () => void
  startBeatTimer: () => void
  beatMs: Ref<number>
  timeSignature: Ref<TimeSignature | ''>
}

export const LyricBeatContextKey: InjectionKey<LyricBeatContext> = Symbol('LyricBeatContext')

export function provideLyricBeatContext(ctx: LyricBeatContext): void {
  provide(LyricBeatContextKey, ctx)
}

export function useLyricBeatContext(): LyricBeatContext | null {
  return inject(LyricBeatContextKey, null)
}
