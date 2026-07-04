import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Yoga Sequences',
  description: '요가 수업 시퀀스 노트',
  lang: 'ko-KR',
  themeConfig: {
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
