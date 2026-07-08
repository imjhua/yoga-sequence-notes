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
  try {
    const res = await fetch('/api/sequences/list')
    if (!res.ok) throw new Error('API not available')
    const json = await res.json()
    return json.items as SequenceListItem[]
  } catch {
    // 프로덕션 폴백: 정적 목록 반환
    return [
      {
        kind: 'md',
        id: 'seq6-hatha-urdhva-danurasana',
        title: '하타-우르드바다누라사나',
        focus: '백밴드 강화 · 역굴곡 · 가슴 열기',
        link: '/sequences/seq6-hatha-urdhva-danurasana',
        updated: '2026-07-08',
      },
      {
        kind: 'md',
        id: 'seq4-ardha-chandrasana',
        title: '빈야사-아르다찬드라사나',
        focus: '균형 · 옆구리 열기',
        link: '/sequences/seq4-ardha-chandrasana',
        updated: '2026-07-07',
      },
      {
        kind: 'md',
        id: 'seq2-upavistha-konasana',
        title: '힐링-우파비스타코나사나',
        focus: '고관절·햄스트링 열기',
        link: '/sequences/seq2-upavistha-konasana',
        updated: '2026-07-05',
      },
      {
        kind: 'md',
        id: 'seq0-urdhva-dhanurasana',
        title: '힐링-우르드바 다누라사나',
        focus: '몸 앞면 깨우기',
        link: '/sequences/seq0-urdhva-dhanurasana',
        updated: '2026-07-04',
      },
    ]
  }
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
