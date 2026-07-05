#!/usr/bin/env node
/**
 * Validate vinyasa lyric flow JSON files.
 * Usage: node scripts/validate-vinyasa.js [path/to/seq3.json]
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const vinyasaDir = path.join(root, 'sequences', 'vinyasa')
const BREATH = new Set(['inhale', 'exhale'])

function validateFile(filePath) {
  const rel = path.relative(root, filePath)
  let data
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch (e) {
    return { ok: false, file: rel, errors: [`Invalid JSON: ${e.message}`] }
  }

  const errors = []
  const warnings = []

  if (!data.meta) errors.push('Missing meta object')
  if (!Array.isArray(data.lines) || data.lines.length === 0) {
    errors.push('Missing or empty lines array')
    return { ok: false, file: rel, errors, warnings }
  }

  for (const line of data.lines) {
    const label = `line ${line.id ?? '?'}`
    if (!line.raw?.trim()) errors.push(`${label}: missing raw`)
    if (!line.translation?.trim()) errors.push(`${label}: missing translation`)
    const tokens = line.tokens?.length ? line.tokens : line.raw?.trim().split(/\s+/).map((text) => ({ text }))
    const hasBreath = tokens?.some((t) => {
      const b = t.breathAfter ?? t.breath
      return b === 'inhale' || b === 'exhale'
    })
    if (!hasBreath && !BREATH.has(line.breath)) {
      errors.push(`${label}: no inhale/exhale on any word`)
    }
    if (!line.pose?.trim()) warnings.push(`${label}: missing pose`)
  }

  return { ok: errors.length === 0, file: rel, errors, warnings }
}

const target = process.argv[2]
const files = target
  ? [path.resolve(target)]
  : fs.existsSync(vinyasaDir)
    ? fs
        .readdirSync(vinyasaDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => path.join(vinyasaDir, f))
        .sort()
    : []

if (files.length === 0) {
  console.log('No vinyasa JSON files found.')
  process.exit(0)
}

let failed = 0
for (const file of files) {
  const result = validateFile(file)
  if (result.ok) {
    console.log(`✓ ${result.file}`)
    result.warnings.forEach((w) => console.warn(`  ⚠ ${w}`))
  } else {
    failed++
    console.error(`✗ ${result.file}`)
    result.errors.forEach((e) => console.error(`  - ${e}`))
    result.warnings.forEach((w) => console.warn(`  ⚠ ${w}`))
  }
}

process.exit(failed > 0 ? 1 : 0)
