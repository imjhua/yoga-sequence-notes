/**
 * Shared EN→KO translation via MyMemory (free tier).
 */
export async function fetchTranslation(text) {
  const trimmed = String(text).trim()
  if (!trimmed) return ''

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=en|ko`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Translation HTTP ${res.status}`)

  const data = await res.json()
  const translated = data?.responseData?.translatedText?.trim()

  if (!translated) {
    throw new Error(data?.responseDetails || 'Empty translation')
  }

  if (translated.startsWith('MYMEMORY WARNING')) {
    throw new Error('Translation quota exceeded — try again later')
  }

  return translated
}
