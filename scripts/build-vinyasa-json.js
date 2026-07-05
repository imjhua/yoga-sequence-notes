#!/usr/bin/env node
/**
 * Build sequences/vinyasa/{id}.json + update manifest.
 *
 * Usage:
 *   node scripts/build-vinyasa-json.js sign-of-the-times \
 *     --song "Sign of the Times" --artist "Harry Styles" \
 *     --prompt sign-of-the-times.prompt.txt \
 *     --ko "번역1" "번역2"
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

function parseArgs(argv) {
  const id = argv[0]
  if (!id) {
    console.error('Usage: node scripts/build-vinyasa-json.js <id> [--song ...] [--artist ...] [--prompt file] [--en ...] [--ko ...] [--active]')
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
  if (opts.en.length) return opts.en.map((l) => l.trim()).filter(Boolean)

  if (opts.prompt) {
    const promptPath = path.isAbsolute(opts.prompt)
      ? opts.prompt
      : path.join(promptsDir, opts.prompt)
    if (!fs.existsSync(promptPath)) {
      console.error(`Prompt not found: ${promptPath}`)
      process.exit(1)
    }
    return fs
      .readFileSync(promptPath, 'utf-8')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  }

  console.error('Provide --en lines or --prompt file')
  process.exit(1)
}

const opts = parseArgs(process.argv.slice(2))
const enLines = readEnglishLines(opts)

if (opts.ko.length !== enLines.length) {
  console.error(`Line count mismatch: ${enLines.length} EN vs ${opts.ko.length} KO`)
  process.exit(1)
}

const data = {
  meta: {
    theme: '빈야사',
    song: opts.song || undefined,
    artist: opts.artist || undefined,
    seededAt: new Date().toISOString(),
  },
  lines: enLines.map((raw, i) => ({
    id: i + 1,
    raw,
    translation: opts.ko[i].trim(),
    pose: '',
    tokens: splitRawToTokens(raw),
  })),
}

fs.mkdirSync(vinyasaDir, { recursive: true })
syncSequenceJson(opts.id, data)
upsertManifestEntry(opts.id, data, { setActive: opts.active })

console.log(`Wrote sequences/vinyasa/${opts.id}.json (${data.lines.length} lines)`)
