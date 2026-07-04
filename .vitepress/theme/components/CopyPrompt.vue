<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  text: string
  label?: string
}>()

const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    /* fallback for older browsers */
    const ta = document.createElement('textarea')
    ta.value = props.text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}
</script>

<template>
  <div class="copy-prompt">
    <div class="copy-prompt-header">
      <span class="copy-prompt-label">{{ label ?? '초기 프롬프트' }}</span>
      <button type="button" class="copy-prompt-btn" @click="copy">
        {{ copied ? '복사됨 ✓' : '복사하기' }}
      </button>
    </div>
    <pre class="copy-prompt-body">{{ text }}</pre>
  </div>
</template>
