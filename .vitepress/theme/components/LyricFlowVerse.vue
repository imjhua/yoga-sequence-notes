<script setup lang="ts">
import { computed } from 'vue'
import {
  type Breath,
  type LyricLine,
  lineBreathSummary,
  lineTokens,
  tokenBreath,
} from '../lyricFlow'

defineProps<{ line: LyricLine }>()
</script>

<template>
  <article class="lyric-verse">
    <span
      v-if="lineBreathSummary(line) === 'inhale'"
      class="breath-badge inhale"
    >INHALE</span>
    <span
      v-else-if="lineBreathSummary(line) === 'exhale'"
      class="breath-badge exhale"
    >EXHALE</span>
    <span
      v-else-if="lineBreathSummary(line) === 'mixed'"
      class="breath-badge mixed"
    >INHALE · EXHALE</span>
    <span v-else class="breath-badge unset">호흡 미설정</span>

    <p class="verse-en">{{ line.raw }}</p>
    <p v-if="line.translation" class="verse-ko">{{ line.translation }}</p>
    <p v-else class="verse-ko verse-ko-empty">한국어 번역</p>

    <p class="verse-cue">
      <template v-for="(token, ti) in lineTokens(line)" :key="ti">
        <span
          class="cue-word"
          :class="{ emphasis: token.emphasis }"
        >
          <strong v-if="token.emphasis">{{ token.text }}</strong><template v-else>{{ token.text }}</template>
        </span>
        <span
          v-if="tokenBreath(token)"
          class="cue-breath"
          :class="tokenBreath(token)!"
        >{{ tokenBreath(token) === 'inhale' ? 'INHALE' : 'EXHALE' }}</span>
      </template>
      <span v-if="line.pose" class="verse-pose">{{ line.pose }}</span>
    </p>
  </article>
</template>
