/**
 * Vinyasa sequence library manifest (sequences/vinyasa/manifest.json)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
export const vinyasaDir = path.join(root, 'sequences', 'vinyasa')
export const publicDir = path.join(root, 'public', 'vinyasa')
export const MANIFEST_FILE = 'manifest.json'

export function sequenceTitle(data, id) {
  const song = data?.meta?.song?.trim()
  if (song) return song
  return id
}

export function readManifest() {
  const manifestPath = path.join(vinyasaDir, MANIFEST_FILE)
  if (!fs.existsSync(manifestPath)) {
    return { activeId: null, sequences: [] }
  }
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  } catch {
    return { activeId: null, sequences: [] }
  }
}

export function writeManifest(manifest) {
  fs.mkdirSync(vinyasaDir, { recursive: true })
  fs.mkdirSync(publicDir, { recursive: true })
  const content = `${JSON.stringify(manifest, null, 2)}\n`
  fs.writeFileSync(path.join(vinyasaDir, MANIFEST_FILE), content)
  fs.writeFileSync(path.join(publicDir, MANIFEST_FILE), content)
}

/** Register or update a sequence in manifest */
export function upsertManifestEntry(id, data, { setActive = false } = {}) {
  const manifest = readManifest()
  const title = sequenceTitle(data, id)
  const entry = {
    id,
    title,
    song: data?.meta?.song || undefined,
    artist: data?.meta?.artist || undefined,
    updatedAt: data?.meta?.savedAt || data?.meta?.seededAt || new Date().toISOString(),
  }

  const idx = manifest.sequences.findIndex((s) => s.id === id)
  if (idx >= 0) manifest.sequences[idx] = entry
  else manifest.sequences.push(entry)

  manifest.sequences.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))

  if (setActive || !manifest.activeId) {
    manifest.activeId = id
  }

  writeManifest(manifest)
  return manifest
}

/** Remove a sequence from manifest (does not delete JSON files) */
export function removeFromManifest(id) {
  const manifest = readManifest()
  manifest.sequences = manifest.sequences.filter((s) => s.id !== id)
  if (manifest.activeId === id) {
    manifest.activeId = manifest.sequences[0]?.id ?? null
  }
  writeManifest(manifest)
  return manifest
}

export function syncSequenceJson(id, data) {
  fs.mkdirSync(vinyasaDir, { recursive: true })
  fs.mkdirSync(publicDir, { recursive: true })
  const jsonPath = path.join(vinyasaDir, `${id}.json`)
  fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`)
  fs.copyFileSync(jsonPath, path.join(publicDir, `${id}.json`))
}
