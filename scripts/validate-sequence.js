#!/usr/bin/env node
/**
 * Validate sequence MD files: frontmatter + embedded image paths exist.
 * Usage: node scripts/validate-sequence.js [path/to/seq0.md]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const seqDir = path.join(root, 'sequences');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) fm[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return fm;
}

function findImageRefs(content) {
  return [...content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
}

function validateFile(filePath) {
  const rel = path.relative(root, filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const errors = [];
  const fm = parseFrontmatter(content);

  if (!fm.title) errors.push('Missing frontmatter: title');
  if (!fm.peak_pose) errors.push('Missing frontmatter: peak_pose');

  const images = findImageRefs(content);
  if (images.length === 0) errors.push('No embedded image found (![...](/sequences/assets/...))');

  for (const img of images) {
    let resolved;
    if (img.startsWith('/')) {
      resolved = path.join(root, 'public', img);
    } else {
      resolved = path.resolve(path.dirname(filePath), img);
    }
    if (!fs.existsSync(resolved)) {
      errors.push(`Image not found: ${img} (checked ${path.relative(root, resolved)})`);
    }
  }

  return { ok: errors.length === 0, file: rel, errors };
}

const target = process.argv[2];
const files = target
  ? [path.resolve(target)]
  : fs.readdirSync(seqDir)
      .filter((f) => f.startsWith('seq') && f.endsWith('.md'))
      .map((f) => path.join(seqDir, f))
      .sort();

let failed = 0;
for (const file of files) {
  const result = validateFile(file);
  if (result.ok) console.log(`✓ ${result.file}`);
  else {
    failed++;
    console.error(`✗ ${result.file}`);
    result.errors.forEach((e) => console.error(`  - ${e}`));
  }
}

if (files.length === 0) {
  console.error('No sequence MD files found in sequences/');
  process.exit(1);
}

process.exit(failed > 0 ? 1 : 0);
