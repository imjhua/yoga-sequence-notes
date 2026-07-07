#!/usr/bin/env node
/**
 * Mirror sequences/vinyasa/*.json → public/vinyasa/ + sync saved .md pages.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { syncVinyasaPages } from './vinyasa-manifest-lib.js'

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

syncVinyasaPages()
const pages = fs.readdirSync(srcDir).filter((f) => f.endsWith('.md') && f !== 'index.md')
if (pages.length > 0) {
  console.log(`sync-vinyasa: ${pages.length} page(s) in sequences/vinyasa/`)
}
