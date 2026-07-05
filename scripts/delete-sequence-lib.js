/**
 * Delete vinyasa JSON sequences or MD sequence pages (+ sidebar/index updates)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  publicDir,
  removeFromManifest,
  vinyasaDir,
} from './vinyasa-manifest-lib.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const sequencesDir = path.join(root, 'sequences')
const promptsDir = path.join(sequencesDir, 'prompts')
const mindmapsDir = path.join(root, 'public', 'mindmaps')
const configPath = path.join(root, '.vitepress', 'config.ts')
const indexPath = path.join(sequencesDir, 'index.md')

function safeUnlink(filePath) {
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

function parseMdMeta(mdPath) {
  const content = fs.readFileSync(mdPath, 'utf-8')
  const fm = content.match(/^---\n([\s\S]*?)\n---/)
  let title = path.basename(mdPath, '.md')
  let sourcePrompt = null
  let mindmapName = null

  if (fm) {
    const titleMatch = fm[1].match(/^title:\s*(.+)$/m)
    if (titleMatch) title = titleMatch[1].trim()
    const promptMatch = fm[1].match(/^source_prompt:\s*(.+)$/m)
    if (promptMatch) sourcePrompt = promptMatch[1].trim()
  }

  const mindmapMatch = content.match(/<Mindmap name="([^"]+)"/)
  if (mindmapMatch) mindmapName = mindmapMatch[1]

  return { title, sourcePrompt, mindmapName }
}

function removeSidebarItem(slug) {
  const link = `/sequences/${slug}`
  let content = fs.readFileSync(configPath, 'utf-8')
  const escaped = link.replace(/\//g, '\\/')
  const re = new RegExp(`\\s*\\{ text: '[^']*', link: '${escaped}' \\},?\\r?\\n`, 'g')
  const next = content.replace(re, '')
  if (next === content) {
    throw new Error(`Sidebar item not found for ${slug}`)
  }
  fs.writeFileSync(configPath, next)
}

function removeIndexRow(slug) {
  let content = fs.readFileSync(indexPath, 'utf-8')
  const re = new RegExp(`\\| \\[[^\\]]*\\]\\(\\./${slug}\\) \\|[^\\n]*\\r?\\n`, 'g')
  const next = content.replace(re, '')
  if (next !== content) {
    fs.writeFileSync(indexPath, next)
  }
}

export function deleteVinyasaSequence(id) {
  if (!id || typeof id !== 'string') {
    throw new Error('Missing sequence id')
  }
  if (id === 'manifest' || id === 'index') {
    throw new Error('Cannot delete reserved id')
  }

  const manifest = removeFromManifest(id)
  safeUnlink(path.join(vinyasaDir, `${id}.json`))
  safeUnlink(path.join(publicDir, `${id}.json`))
  safeUnlink(path.join(promptsDir, `${id}.prompt.txt`))

  return {
    type: 'vinyasa',
    id,
    activeId: manifest.activeId,
    remaining: manifest.sequences.length,
  }
}

export function deleteMdSequence(slug) {
  if (!slug || typeof slug !== 'string') {
    throw new Error('Missing sequence slug')
  }
  if (slug === 'index' || slug === 'vinyasa') {
    throw new Error('Cannot delete reserved sequence')
  }
  if (slug.includes('/') || slug.includes('..')) {
    throw new Error('Invalid sequence slug')
  }

  const mdPath = path.join(sequencesDir, `${slug}.md`)
  if (!fs.existsSync(mdPath)) {
    throw new Error(`Sequence file not found: ${slug}.md`)
  }

  const { title, sourcePrompt, mindmapName } = parseMdMeta(mdPath)

  fs.unlinkSync(mdPath)
  removeIndexRow(slug)
  removeSidebarItem(slug)

  if (sourcePrompt) {
    const promptPath = path.isAbsolute(sourcePrompt)
      ? sourcePrompt
      : path.join(root, sourcePrompt)
    safeUnlink(promptPath)
  } else {
    safeUnlink(path.join(promptsDir, `${slug}.prompt.txt`))
  }

  if (mindmapName) {
    safeUnlink(path.join(mindmapsDir, `${mindmapName}-mindmap.svg`))
  }

  return {
    type: 'md',
    slug,
    title,
    redirect: '/sequences/',
  }
}
