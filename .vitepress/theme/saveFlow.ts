import type { LyricFlowData } from './lyricFlow'

export interface VinyasaSequenceEntry {
  id: string
  title: string
  song?: string
  artist?: string
  updatedAt?: string
}

export interface VinyasaManifest {
  activeId: string | null
  sequences: VinyasaSequenceEntry[]
}

export interface SequenceListItem {
  kind: 'md' | 'vinyasa'
  id: string
  title: string
  focus: string
  link: string
  updated: string
}

export const MANIFEST_URL = '/vinyasa/manifest.json'

export function vinyasaManifestUrl(): string {
  return MANIFEST_URL
}

export async function fetchManifest(): Promise<VinyasaManifest> {
  try {
    const res = await fetch(MANIFEST_URL)
    if (!res.ok) return { activeId: null, sequences: [] }
    return (await res.json()) as VinyasaManifest
  } catch {
    return { activeId: null, sequences: [] }
  }
}

export async function saveFlowToServer(
  id: string,
  data: LyricFlowData,
): Promise<{ id: string; jsonPath: string; title: string }> {
  const res = await fetch('/api/vinyasa/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, data }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Save failed')
  return json
}

export function downloadTextFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function fetchSequenceList(): Promise<SequenceListItem[]> {
  const res = await fetch('/api/sequences/list')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'List failed')
  return json.items as SequenceListItem[]
}

export async function deleteVinyasaFromServer(
  id: string,
): Promise<{ activeId: string | null; remaining: number }> {
  const res = await fetch('/api/vinyasa/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Delete failed')
  return json
}

export async function deleteMdFromServer(
  slug: string,
): Promise<{ title: string; redirect: string }> {
  const res = await fetch('/api/sequence/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Delete failed')
  return json
}
