import { fetchTranslation } from '../../scripts/translate-lib.js'

/** Vite dev server: same /api/translate as Vercel production */
export function translateDevApiPlugin() {
  return {
    name: 'translate-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/translate')) return next()

        const url = new URL(req.url, 'http://localhost')
        const text = url.searchParams.get('text')

        res.setHeader('Content-Type', 'application/json')

        if (!text) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Missing text' }))
          return
        }

        try {
          const translation = await fetchTranslation(text)
          res.statusCode = 200
          res.end(JSON.stringify({ translation }))
        } catch (e) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: e.message || 'Translation failed' }))
        }
      })
    },
  }
}
