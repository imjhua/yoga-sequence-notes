/**
 * BPM lookup — Deezer · SongBPM · curated knowledge (SongBPM / Tunebat class sources)
 */

const KNOWLEDGE = [
  { artists: ['shaed'], songs: ['trampoline'], bpm: 127, source: 'songbpm' },
  { artists: ['gibran alcocer'], songs: ['idea 22'], bpm: 104, source: 'songbpm' },
  { artists: ['harry styles'], songs: ['sign of the times'], bpm: 120, source: 'songbpm' },
]

function normalize(text = '') {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(text = '') {
  return normalize(text).replace(/\s+/g, '-').replace(/^-|-$/g, '')
}

function primaryArtist(artist = '') {
  return normalize(artist.split(/[·,/]| feat\.? /i)[0])
}

export function beatMsFromBpm(bpm) {
  if (!Number.isFinite(bpm) || bpm <= 0) return 630
  const BEAT_COUNT_SPEED = 0.5
  const ms = Math.round(60000 / (bpm * BEAT_COUNT_SPEED))
  return Math.min(2500, Math.max(350, ms))
}

function matchKnowledge(song, artist) {
  const s = normalize(song)
  const a = primaryArtist(artist)
  if (!s) return null

  for (const entry of KNOWLEDGE) {
    const songHit = entry.songs.some((candidate) => s.includes(candidate) || candidate.includes(s))
    if (!songHit) continue
    if (!entry.artists.length) return entry
    const artistHit = entry.artists.some(
      (candidate) => a.includes(candidate) || candidate.includes(a),
    )
    if (artistHit) return entry
  }
  return null
}

async function fetchDeezerTrackBpm(trackId) {
  const res = await fetch(`https://api.deezer.com/track/${trackId}`)
  if (!res.ok) return null
  const data = await res.json()
  const bpm = data.bpm ?? 0
  return bpm > 0 ? bpm : null
}

async function lookupDeezer(song, artist) {
  const queries = []
  if (song && artist) queries.push(`${artist} ${song}`)
  if (song) queries.push(song)

  const seen = new Set()
  for (const query of queries) {
    const q = normalize(query)
    if (!q || seen.has(q)) continue
    seen.add(q)

    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=5`)
    if (!res.ok) continue
    const json = await res.json()
    const hits = [...(json.data ?? [])].sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))

    for (const hit of hits) {
      const bpm = await fetchDeezerTrackBpm(hit.id)
      if (!bpm) continue
      return {
        bpm,
        beatMs: beatMsFromBpm(bpm),
        source: 'deezer',
        trackTitle: hit.title,
        artistName: hit.artist?.name,
      }
    }
  }
  return null
}

function parseSongBpmFromHtml(html, expectedSong = '') {
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (titleMatch) {
    const pageTitle = normalize(titleMatch[1])
    const want = normalize(expectedSong)
    if (want && pageTitle && !pageTitle.includes(want) && !want.includes(pageTitle)) {
      return null
    }
    const slice = html.slice(titleMatch.index ?? 0, (titleMatch.index ?? 0) + 500)
    const near = slice.match(/(\d+(?:\.\d+)?)\s*BPM/i)
    if (near) return parseFloat(near[1])
  }

  const metric = html.match(/Tempo \(BPM\)\s*(\d+(?:\.\d+)?)/i)
  if (metric) return parseFloat(metric[1])

  return null
}

async function fetchSongBpmPage(path, expectedSong = '') {
  const res = await fetch(`https://songbpm.com${path}`)
  if (!res.ok) return null
  const html = await res.text()
  const bpm = parseSongBpmFromHtml(html, expectedSong)
  if (!bpm || bpm <= 0) return null
  return bpm
}

async function lookupSongBpm(song, artist) {
  const artistSlug = slugify(primaryArtist(artist) || artist)
  const songSlug = slugify(song)
  if (!songSlug) return null

  const directPaths = [`/@${artistSlug}/${songSlug}`]
  for (const path of directPaths) {
    const bpm = await fetchSongBpmPage(path, song)
    if (bpm) {
      return {
        bpm,
        beatMs: beatMsFromBpm(bpm),
        source: 'songbpm',
        trackTitle: song,
        artistName: artist,
      }
    }
  }

  if (!artistSlug) return null

  try {
    const res = await fetch(`https://songbpm.com/@${artistSlug}`)
    if (!res.ok) return null
    const html = await res.text()
    const escaped = songSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const links = [
      ...html.matchAll(new RegExp(`href=\"(/@${artistSlug}/[^\"]*${escaped}[^\"]*)\"`, 'gi')),
    ]
    const seen = new Set()
    for (const match of links) {
      const path = match[1]
      if (seen.has(path)) continue
      seen.add(path)
      const bpm = await fetchSongBpmPage(path, song)
      if (bpm) {
        return {
          bpm,
          beatMs: beatMsFromBpm(bpm),
          source: 'songbpm',
          trackTitle: song,
          artistName: artist,
        }
      }
    }
  } catch {
    return null
  }

  return null
}

function lookupKnowledge(song, artist) {
  const hit = matchKnowledge(song, artist)
  if (!hit) return null
  return {
    bpm: hit.bpm,
    beatMs: beatMsFromBpm(hit.bpm),
    source: hit.source,
    trackTitle: song,
    artistName: artist,
  }
}

async function fetchYoutubeOembed(youtubeUrl) {
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(youtubeUrl)}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function parseOembedTitle(title, author) {
  const clean = title.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()
  const dash = clean.match(/^(.+?)\s[-–—|]\s(.+?)$/)
  if (dash) {
    return {
      artist: dash[1].trim(),
      song: dash[2].replace(/\s(official|lyrics?|video|audio).*$/i, '').trim(),
    }
  }
  if (author) {
    return {
      artist: author.trim(),
      song: clean.replace(/\s(official|lyrics?|video|audio).*$/i, '').trim(),
    }
  }
  return { song: clean, artist: '' }
}

/**
 * @param {{ song?: string, artist?: string, youtubeUrl?: string }} input
 */
export async function lookupBpm(input = {}) {
  const song = input.song?.trim() ?? ''
  const artist = input.artist?.trim() ?? ''
  let resolvedSong = song
  let resolvedArtist = artist

  if (input.youtubeUrl) {
    const oembed = await fetchYoutubeOembed(input.youtubeUrl)
    if (oembed?.title) {
      const parsed = parseOembedTitle(oembed.title, oembed.author_name)
      if (!resolvedSong) resolvedSong = parsed.song
      if (!resolvedArtist) resolvedArtist = parsed.artist
    }
  }

  const deezer = await lookupDeezer(resolvedSong, resolvedArtist)
  if (deezer) return deezer

  const knowledge = lookupKnowledge(resolvedSong, resolvedArtist)
  if (knowledge) return knowledge

  const songbpm = await lookupSongBpm(resolvedSong, resolvedArtist)
  if (songbpm) return songbpm

  return null
}
