import { beatMsFromBpm, parseYoutubeVideoId } from './lyricFlow'

export interface BpmLookupResult {
  bpm: number
  beatMs: number
  source: string
  trackTitle?: string
  artistName?: string
}

export async function lookupBpmForYoutube(
  youtubeUrl: string,
  hints: { song?: string; artist?: string } = {},
): Promise<BpmLookupResult | null> {
  if (!parseYoutubeVideoId(youtubeUrl)) return null

  const params = new URLSearchParams()
  if (hints.song?.trim()) params.set('song', hints.song.trim())
  if (hints.artist?.trim()) params.set('artist', hints.artist.trim())
  params.set('youtubeUrl', youtubeUrl)

  try {
    const res = await fetch(`/api/bpm-lookup?${params.toString()}`)
    if (res.ok) return (await res.json()) as BpmLookupResult
    if (res.status === 404) return null
  } catch {
    return null
  }

  return null
}

export { beatMsFromBpm }
