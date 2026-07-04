---
title: Yoga Sequences
head:
  - - meta
    - http-equiv: refresh
      content: 0; url=/sequences/
---

<script setup>
import { useRouter } from 'vitepress'
import { onMounted } from 'vue'

const router = useRouter()
onMounted(() => {
  router.go('/sequences/')
})
</script>

[시퀀스 목록으로 이동](/sequences/)
