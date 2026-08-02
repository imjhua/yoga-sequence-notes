/**
 * List all sequences (vinyasa JSON + MD pages) for the catalog UI
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { readManifest, vinyasaDir } from './vinyasa-manifest-lib.js'

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
  const blockMatch = content.match(/export const mdSidebarItems = \[([\s\S]*?)\]/)
  if (!blockMatch) return []

  const items = []
  const re = /\{\s*text:\s*'([^']*)',\s*link:\s*'([^']*)'\s*\}/g
  let match = re.exec(blockMatch[1])

  while (match) {
    const title = match[1]
    const link = match[2]
    const linkPath = link.replace(/^\/sequences\//, '').replace(/\/$/, '')
    const meta = readMdMeta(linkPath)
    items.push({
      kind: 'md',
      id: linkPath,
      title,
      focus: meta.focus,
      link,
      updated: meta.updated,
    })
    match = re.exec(blockMatch[1])
  }

  return items
}

export function vinyasaSavedPages() {
  const manifest = readManifest()
  return manifest.sequences
    .filter((s) => fs.existsSync(path.join(vinyasaDir, `${s.id}.md`)))
    .map((s) => ({
      text: `빈야사-${s.title}`,
      link: `/sequences/vinyasa/${s.id}`,
    }))
}

export function listSequences() {
  const vinyasa = vinyasaSavedPages().map(({ text, link }) => {
    const id = link.replace(/^\/sequences\/vinyasa\//, '')
    const saved = readManifest().sequences.find((s) => s.id === id)
    return {
      kind: 'vinyasa',
      id,
      title: text,
      focus: '팝송 가사 플로우',
      link,
      updated: saved?.updatedAt?.slice(0, 10) ?? '',
    }
  })
  const md = listMdSequences()

  return [...vinyasa, ...md]
}
