<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { clearDraft } from '../lyricFlow'
import {
  deleteMdFromServer,
  deleteVinyasaFromServer,
  fetchSequenceList,
  type SequenceListItem,
} from '../saveFlow'

const items = ref<SequenceListItem[]>([])
const loading = ref(true)
const deletingId = ref('')
const message = ref('')

async function load() {
  loading.value = true
  message.value = ''
  try {
    items.value = await fetchSequenceList()
  } catch (e) {
    message.value = e instanceof Error ? e.message : '목록을 불러오지 못했습니다'
    items.value = []
  } finally {
    loading.value = false
  }
}

async function removeItem(item: SequenceListItem) {
  if (deletingId.value) return

  const label = item.kind === 'vinyasa' ? `${item.title} (빈야사)` : item.title
  const detail = item.kind === 'vinyasa'
    ? `· ${item.id}.json\n· manifest · prompt (있으면)`
    : `· ${item.id}.md\n· sidebar · prompt · mindmap (있으면)`

  if (!confirm(`「${label}」 항목을 삭제할까요?\n\n${detail}`)) return

  deletingId.value = item.id
  message.value = ''

  try {
    if (item.kind === 'vinyasa') {
      await deleteVinyasaFromServer(item.id)
      clearDraft(item.id)
    } else {
      await deleteMdFromServer(item.id)
    }
    message.value = `삭제됨 · ${label} (sidebar 반영: 페이지 새로고침)`
    await load()
  } catch (e) {
    message.value = e instanceof Error ? e.message : '삭제 실패 (로컬 dev에서만 가능)'
  } finally {
    deletingId.value = ''
  }
}

onMounted(load)
</script>

<template>
  <div class="sequence-list">
    <p v-if="loading" class="sequence-list-empty">불러오는 중…</p>
    <p v-else-if="!items.length" class="sequence-list-empty">
      아직 시퀀스가 없습니다.
    </p>
    <table v-else class="sequence-list-table">
      <thead>
        <tr>
          <th scope="col">수업</th>
          <th scope="col">포커스</th>
          <th scope="col">날짜</th>
          <th scope="col" class="sequence-list-actions-col">삭제</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="`${item.kind}-${item.id}`">
          <td>
            <a :href="item.link">{{ item.title }}</a>
            <span v-if="item.kind === 'vinyasa'" class="sequence-list-badge">빈야사</span>
          </td>
          <td>{{ item.focus || '—' }}</td>
          <td>{{ item.updated || '—' }}</td>
          <td class="sequence-list-actions-col">
            <button
              type="button"
              class="sequence-list-delete"
              :disabled="deletingId === item.id"
              :aria-label="`${item.title} 삭제`"
              @click="removeItem(item)"
            >
              {{ deletingId === item.id ? '…' : '삭제' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="message" class="sequence-list-msg">{{ message }}</p>
  </div>
</template>
