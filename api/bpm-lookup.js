import { lookupBpm } from '../scripts/bpm-lookup-lib.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  const song = typeof req.query?.song === 'string' ? req.query.song : ''
  const artist = typeof req.query?.artist === 'string' ? req.query.artist : ''
  const youtubeUrl = typeof req.query?.youtubeUrl === 'string' ? req.query.youtubeUrl : ''

  if (!song && !artist && !youtubeUrl) {
    res.status(400).json({ error: 'Provide song, artist, or youtubeUrl' })
    return
  }

  try {
    const result = await lookupBpm({ song, artist, youtubeUrl })
    if (!result) {
      res.status(404).json({ error: 'BPM not found' })
      return
    }
    res.status(200).json(result)
  } catch (e) {
    res.status(502).json({ error: e.message || 'BPM lookup failed' })
  }
}
