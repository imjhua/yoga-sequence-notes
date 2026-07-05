/**
 * List all sequences (vinyasa JSON + MD pages) for the catalog UI
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { readManifest } from './vinyasa-manifest-lib.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const sequencesDir = path.join(root, 'sequences')
const configPath = path.join(root, '.vitepress', 'config.ts')

function readMdMeta(slug) {
  const mdPath = path.join(sequencesDir, `${slug}.md`)
  if (!fs.existsSync(mdPath)) return { focus: '', updated: '' }

  const fm = fs.readFileSync(mdPath, 'utf-8').match(/^---\n([\s\S]*?)\n---/)
  if (!fm) return { focus: '', updated: '' }

  const focusMatch = fm[1].match(/^focus:\s*(.+)$/m)
  const updatedMatch = fm[1].match(/^updated:\s*(.+)$/m)
  return {
    focus: focusMatch?.[1]?.trim() ?? '',
    updated: updatedMatch?.[1]?.trim() ?? '',
  }
}

export function listMdSequences() {
  const content = fs.readFileSync(configPath, 'utf-8')
  const items = []
  const re = /\{\s*text:\s*'([^']*)',\s*link:\s*'\/sequences\/([^']+)'\s*\}/g
  let match = re.exec(content)

  while (match) {
    const title = match[1]
    const linkPath = match[2].replace(/\/$/, '')
    if (linkPath === 'vinyasa') {
      match = re.exec(content)
      continue
    }

    const meta = readMdMeta(linkPath)
    items.push({
      kind: 'md',
      id: linkPath,
      title,
      focus: meta.focus,
      link: `/sequences/${linkPath}`,
      updated: meta.updated,
    })
    match = re.exec(content)
  }

  return items
}

export function listSequences() {
  const manifest = readManifest()
  const vinyasa = manifest.sequences.map((s) => ({
    kind: 'vinyasa',
    id: s.id,
    title: s.title,
    focus: '팝송 가사 플로우',
    link: '/sequences/vinyasa/',
    updated: s.updatedAt?.slice(0, 10) ?? '',
  }))
  const md = listMdSequences()

  return [...vinyasa, ...md].sort((a, b) =>
    (b.updated || '').localeCompare(a.updated || ''),
  )
}
