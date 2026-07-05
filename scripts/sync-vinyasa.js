#!/usr/bin/env node
/**
 * Mirror sequences/vinyasa/*.json → public/vinyasa/ (remove stale copies).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const srcDir = path.join(root, 'sequences', 'vinyasa')
const destDir = path.join(root, 'public', 'vinyasa')

if (!fs.existsSync(srcDir)) {
  process.exit(0)
}

fs.mkdirSync(destDir, { recursive: true })

const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.json'))
const srcSet = new Set(files)

for (const file of files) {
  fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file))
}

for (const file of fs.readdirSync(destDir).filter((f) => f.endsWith('.json'))) {
  if (!srcSet.has(file)) {
    fs.unlinkSync(path.join(destDir, file))
  }
}

if (files.length > 0) {
  console.log(`sync-vinyasa: ${files.length} file(s) → public/vinyasa/`)
}
