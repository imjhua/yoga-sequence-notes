import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Yoga Sequences',
  description: '요가 수업 시퀀스 노트',
  lang: 'ko-KR',
  srcExclude: ['**/skills/**', 'README.md'],
  themeConfig: {
    logoLink: '/sequences/',
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
            { text: '힐링-우파비스타코나사나', link: '/sequences/seq2-upavistha-konasana' },
            { text: '힐링-사마코나사나', link: '/sequences/seq1-samakonasana' },
            { text: '힐링-우르드바 다누라사나', link: '/sequences/seq0-urdhva-dhanurasana' },
          ],
        },
      ],
    },
  },
})
