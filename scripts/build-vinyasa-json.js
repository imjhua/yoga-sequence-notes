#!/usr/bin/env node
/**
 * Build sequences/vinyasa/{id}.json + update manifest.
 *
 * Usage:
 *   node scripts/build-vinyasa-json.js sign-of-the-times \
 *     --song "Sign of the Times" --artist "Harry Styles" \
 *     --prompt sign-of-the-times.prompt.txt
 *
 * Korean: pass --ko lines, or add sequences/prompts/{id}.ko.txt (one line per verse).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { upsertManifestEntry, syncSequenceJson, vinyasaDir } from './vinyasa-manifest-lib.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const promptsDir = path.join(root, 'sequences', 'prompts')

function splitRawToTokens(raw) {
  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => ({ text, breathAfter: null, emphasis: false }))
}

function readPromptLines(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function splitLyricsTextToRaws(text) {
  const collapsed = text.replace(/\s+/g, ' ').trim()
  if (!collapsed) return []
  const parts = collapsed
    .split(/(?<=\.)\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
  return parts.length ? parts : [collapsed]
}

function parseArgs(argv) {
  const id = argv[0]
  if (!id) {
    console.error(
      'Usage: node scripts/build-vinyasa-json.js <id> [--song ...] [--artist ...] [--prompt file] [--en ...] [--ko ...] [--active]',
    )
    process.exit(1)
  }

  const opts = { id, song: '', artist: '', en: [], ko: [], prompt: '', active: false }
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--song') opts.song = argv[++i] ?? ''
    else if (arg === '--artist') opts.artist = argv[++i] ?? ''
    else if (arg === '--prompt') opts.prompt = argv[++i] ?? ''
    else if (arg === '--active') opts.active = true
    else if (arg === '--en') {
      while (argv[i + 1] && !argv[i + 1].startsWith('--')) opts.en.push(argv[++i])
    } else if (arg === '--ko') {
      while (argv[i + 1] && !argv[i + 1].startsWith('--')) opts.ko.push(argv[++i])
    }
  }
  return opts
}

function readEnglishLines(opts) {
  if (opts.en.length > 1) return opts.en.map((s) => s.trim()).filter(Boolean)
  if (opts.en.length === 1) return splitLyricsTextToRaws(opts.en[0])

  if (opts.prompt) {
    const promptPath = path.isAbsolute(opts.prompt)
      ? opts.prompt
      : path.join(promptsDir, opts.prompt)
    if (!fs.existsSync(promptPath)) {
      console.error(`Prompt not found: ${promptPath}`)
      process.exit(1)
    }
    return readPromptLines(fs.readFileSync(promptPath, 'utf-8'))
  }

  console.error('Provide --en lines or --prompt file')
  process.exit(1)
}

function readKoreanLines(opts, enCount) {
  if (opts.ko.length) {
    if (opts.ko.length !== enCount) {
      console.error(`Line count mismatch: ${enCount} EN vs ${opts.ko.length} KO (--ko)`)
      process.exit(1)
    }
    return opts.ko
  }

  const koPath = path.join(promptsDir, `${opts.id}.ko.txt`)
  if (fs.existsSync(koPath)) {
    const lines = readPromptLines(fs.readFileSync(koPath, 'utf-8'))
    if (lines.length !== enCount) {
      console.error(`Line count mismatch: ${enCount} EN vs ${lines.length} KO (${koPath})`)
      process.exit(1)
    }
    return lines
  }

  return Array(enCount).fill('')
}

function loadExistingMeta(id) {
  const jsonPath = path.join(vinyasaDir, `${id}.json`)
  if (!fs.existsSync(jsonPath)) return {}
  try {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf-8')).meta ?? {}
  } catch {
    return {}
  }
}

const opts = parseArgs(process.argv.slice(2))
const enLines = readEnglishLines(opts)
const koLines = readKoreanLines(opts, enLines.length)
const existingMeta = loadExistingMeta(opts.id)

const data = {
  meta: {
    ...existingMeta,
    theme: '빈야사',
    song: opts.song || existingMeta.song || undefined,
    artist: opts.artist || existingMeta.artist || undefined,
    seededAt: new Date().toISOString(),
    savedAt: undefined,
  },
  lines: enLines.map((raw, i) => ({
    id: i + 1,
    raw,
    translation: koLines[i].trim(),
    pose: '',
    tokens: splitRawToTokens(raw),
  })),
  measures: [],
}

fs.mkdirSync(vinyasaDir, { recursive: true })
syncSequenceJson(opts.id, data)
upsertManifestEntry(opts.id, data, { setActive: opts.active })

console.log(`Wrote sequences/vinyasa/${opts.id}.json (${data.lines.length} lines)`)
