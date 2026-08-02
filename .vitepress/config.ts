import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import vinyasaManifest from '../sequences/vinyasa/manifest.json'
import { translateDevApiPlugin } from './plugins/translate-dev-api.js'
import { bpmDevApiPlugin } from './plugins/bpm-dev-api.js'
import { vinyasaSaveDevApiPlugin } from './plugins/vinyasa-save-dev-api.js'
import { sequenceDeleteDevApiPlugin } from './plugins/sequence-delete-dev-api.js'
import { vinyasaSavedPages } from '../scripts/list-sequences-lib.js'

export const mdSidebarItems = [
  { text: '힐링-프리야빈야사버전', link: '/sequences/seq1-priya-vinyasa' },
  { text: '힐링-우파비스타코나사나', link: '/sequences/seq2-upavistha-konasana' },
  { text: '힐링-마리챠아사나ABCD', link: '/sequences/seq3-marichyasana' },
  { text: '빈야사-아르다찬드라사나', link: '/sequences/seq4-ardha-chandrasana' },
  { text: '힐링-몸활짝 열기', link: '/sequences/seq5-block-leg' },
  { text: '하타-우르드바다누라사나', link: '/sequences/seq6-hatha-urdhva-danurasana' },
]

const vinyasaPages = vinyasaSavedPages()

export default defineConfig({
  title: 'Yoga Sequences',
  description: '요가 수업 시퀀스 노트',
  lang: 'ko-KR',
  srcExclude: ['**/skills/**', 'README.md'],
  vite: {
    plugins: [translateDevApiPlugin(), bpmDevApiPlugin(), vinyasaSaveDevApiPlugin(), sequenceDeleteDevApiPlugin()],
  },
  themeConfig: {
    logoLink: '/sequences/',
    sidebarMenuLabel: '시퀀스',
    returnToTopLabel: '맨 위로',
    nav: [
      { text: '시퀀스', link: '/sequences/' },
      { text: '빈야사 생성', link: '/sequences/vinyasa/' },
      ...[...mdSidebarItems].reverse(),
      ...[...vinyasaPages].reverse(),
    ],
    sidebar: {
      '/sequences/': [
        {
          text: '시퀀스 목록',
          items: [
            { text: '빈야사 시퀀스 생성', link: '/sequences/vinyasa/' },
            ...vinyasaPages,
            { text: '---', collapsed: false },
            ...mdSidebarItems,
          ],
        },
      ],
    },
  },
})
