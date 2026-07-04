import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Yoga Sequences',
  description: '요가 수업 시퀀스 노트',
  lang: 'ko-KR',
  themeConfig: {
    // 모바일: 햄버거 → 시퀀스 목록 (VitePress 기본)
    sidebarMenuLabel: '시퀀스',
    returnToTopLabel: '맨 위로',
    nav: [
      { text: '시퀀스', link: '/sequences/' },
    ],
    sidebar: {
      '/sequences/': [
        {
          text: '시퀀스 목록',
          items: [
            { text: '우르드바 다누라사나', link: '/sequences/seq0-urdhva-dhanurasana' },
            { text: '사마코나사나', link: '/sequences/seq1-samakonasana' },
          ],
        },
      ],
    },
  },
})
