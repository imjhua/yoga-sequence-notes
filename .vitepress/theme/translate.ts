import type { LyricLine } from './lyricFlow'

const MYMEMORY = 'https://api.mymemory.translated.net/get'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function translateViaMyMemory(text: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return ''

  const url = `${MYMEMORY}?q=${encodeURIComponent(trimmed)}&langpair=en|ko`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`번역 서버 오류 (${res.status})`)

  const json = await res.json()
  const translated = json?.responseData?.translatedText?.trim()

  if (!translated) {
    throw new Error(json?.responseDetails || '번역 결과 없음')
  }
  if (translated.startsWith('MYMEMORY WARNING')) {
    throw new Error('번역 한도 초과 — 잠시 후 다시 시도')
  }

  return translated
}

export async function translateEnToKo(text: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return ''

  try {
    const res = await fetch(`/api/translate?text=${encodeURIComponent(trimmed)}`)
    const json = await res.json()
    if (res.ok && json.translation) return json.translation
  } catch {
    /* proxy unavailable — fall through */
  }

  return translateViaMyMemory(trimmed)
}

export async function translateLines(
  lines: LyricLine[],
  onProgress?: (current: number, total: number) => void,
): Promise<{ failed: number }> {
  let failed = 0
  const total = lines.length

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    onProgress?.(i + 1, total)

    if (!line.raw.trim()) {
      line.translation = ''
      continue
    }

    try {
      line.translation = await translateEnToKo(line.raw)
    } catch {
      line.translation = ''
      failed++
    }

    if (i < lines.length - 1) await delay(300)
  }

  return { failed }
}
