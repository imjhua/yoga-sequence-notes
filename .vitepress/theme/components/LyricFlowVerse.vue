<script setup lang="ts">
import { computed } from 'vue'
import {
  anchorAtToken,
  breathForGlobalIndex,
  lineTokens,
  type LyricLine,
  type LyricMeasure,
} from '../lyricFlow'

const props = defineProps<{
  line: LyricLine
  measure?: LyricMeasure
  globalAnchorOffset?: number
}>()

const tokens = computed(() => lineTokens(props.line))
const hasAnchor = computed(() => (props.measure?.anchors.length ?? 0) > 0)

function breathForToken(tokenIndex: number): 'inhale' | 'exhale' | null {
  if (!props.measure) return null
  const anchor = anchorAtToken(props.measure, tokenIndex)
  if (!anchor) return null
  const before = props.measure.anchors.filter((a) => a.beatIndex < anchor.beatIndex).length
  return breathForGlobalIndex((props.globalAnchorOffset ?? 0) + before)
}
</script>

<template>
  <div class="lyric-verse">
    <div
      class="verse-card"
      :class="hasAnchor ? 'verse-card-action' : 'verse-card-wait'"
    >
      <p class="verse-en">
        <span
          v-for="(token, ti) in tokens"
          :key="ti"
          class="verse-chunk"
        >
          <span class="verse-word" :class="{ emphasis: token.emphasis }">{{ token.text }}</span>
          <span
            v-if="breathForToken(ti)"
            class="cue-breath"
            :class="breathForToken(ti)!"
          >
            {{ breathForToken(ti) === 'inhale' ? 'INHALE' : 'EXHALE' }}
          </span>
          <span
            v-if="measure && anchorAtToken(measure, ti)?.pose?.trim()"
            class="verse-pose verse-pose-inline"
          >
            {{ anchorAtToken(measure, ti)!.pose }}
          </span>
        </span>
        <span v-if="line.pose && hasAnchor" class="verse-pose verse-pose-inline">{{ line.pose }}</span>
      </p>
      <p v-if="line.translation" class="verse-ko">{{ line.translation }}</p>
    </div>
  </div>
</template>
