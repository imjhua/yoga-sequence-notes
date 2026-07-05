<script setup lang="ts">
import { computed } from 'vue'
import {
  type Breath,
  type LyricLine,
  lineTokens,
  setBreathAfter,
  toggleEmphasis,
  tokenBreath,
} from '../lyricFlow'

const props = defineProps<{ line: LyricLine }>()
const emit = defineEmits<{ change: [] }>()

const tokens = computed(() => lineTokens(props.line))

function onBreathChange(tokenIndex: number, e: Event) {
  const value = (e.target as HTMLSelectElement).value
  const breath: Breath | null =
    value === 'inhale' || value === 'exhale' ? value : null
  setBreathAfter(props.line, tokenIndex, breath)
  emit('change')
}

function onWordClick(index: number) {
  toggleEmphasis(props.line, index)
  emit('change')
}

function onTranslationInput(e: Event) {
  props.line.translation = (e.target as HTMLInputElement).value
  emit('change')
}

function onPoseInput(e: Event) {
  props.line.pose = (e.target as HTMLInputElement).value
  emit('change')
}
</script>

<template>
  <section class="line-card">
    <div class="line-row line-row-1">
      <div class="line-en-group" role="group" :aria-label="`구절 ${line.id} 편집`">
        <template v-for="(token, ti) in tokens" :key="ti">
          <button
            type="button"
            class="line-word"
            :class="{ bold: token.emphasis }"
            @click="onWordClick(ti)"
          >
            {{ token.text }}
          </button>
          <select
            class="line-breath-select"
            :class="{
              inhale: tokenBreath(token) === 'inhale',
              exhale: tokenBreath(token) === 'exhale',
            }"
            :value="tokenBreath(token) ?? ''"
            :aria-label="`${token.text} 뒤 호흡`"
            @change="onBreathChange(ti, $event)"
          >
            <option value="">—</option>
            <option value="inhale">INHALE</option>
            <option value="exhale">EXHALE</option>
          </select>
        </template>
      </div>
      <input
        :value="line.pose"
        type="text"
        class="line-pose"
        placeholder="자세"
        aria-label="자세"
        @input="onPoseInput"
      >
    </div>

    <input
      :value="line.translation"
      type="text"
      class="line-ko"
      placeholder="한국어 번역"
      aria-label="한국어 번역"
      @input="onTranslationInput"
    >
  </section>
</template>
