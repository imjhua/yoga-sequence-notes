import { lookupBpm } from '../../scripts/bpm-lookup-lib.js'

/** Vite dev server: same /api/bpm-lookup as Vercel production */
export function bpmDevApiPlugin() {
  return {
    name: 'bpm-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/bpm-lookup')) return next()

        const url = new URL(req.url, 'http://localhost')
        const song = url.searchParams.get('song') ?? ''
        const artist = url.searchParams.get('artist') ?? ''
        const youtubeUrl = url.searchParams.get('youtubeUrl') ?? ''

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')

        if (!song && !artist && !youtubeUrl) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Provide song, artist, or youtubeUrl' }))
          return
        }

        try {
          const result = await lookupBpm({ song, artist, youtubeUrl })
          if (!result) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'BPM not found' }))
            return
          }
          res.statusCode = 200
          res.end(JSON.stringify(result))
        } catch (e) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: e.message || 'BPM lookup failed' }))
        }
      })
    },
  }
}
