import { defineConfig } from 'vitepress'
import { translateDevApiPlugin } from './plugins/translate-dev-api.js'
import { vinyasaSaveDevApiPlugin } from './plugins/vinyasa-save-dev-api.js'
import { sequenceDeleteDevApiPlugin } from './plugins/sequence-delete-dev-api.js'

export default defineConfig({
  title: 'Yoga Sequences',
  description: '요가 수업 시퀀스 노트',
  lang: 'ko-KR',
  srcExclude: ['**/skills/**', 'README.md'],
  vite: {
    plugins: [translateDevApiPlugin(), vinyasaSaveDevApiPlugin(), sequenceDeleteDevApiPlugin()],
  },
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
            { text: '빈야사', link: '/sequences/vinyasa/' },
            { text: '힐링-우파비스타코나사나', link: '/sequences/seq2-upavistha-konasana' },
            { text: '힐링-우르드바 다누라사나', link: '/sequences/seq0-urdhva-dhanurasana' },
          ],
        },
      ],
    },
  },
})
