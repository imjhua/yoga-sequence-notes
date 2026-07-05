import { saveVinyasaFlow } from '../../scripts/save-vinyasa-flow-lib.js'

/** Vite dev: POST /api/vinyasa/save → JSON + .flow.md on disk */
export function vinyasaSaveDevApiPlugin() {
  return {
    name: 'vinyasa-save-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/vinyasa/save' || req.method === 'OPTIONS') {
          if (req.url === '/api/vinyasa/save' && req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            res.statusCode = 204
            res.end()
            return
          }
          return next()
        }

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')

        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const body = JSON.parse(Buffer.concat(chunks).toString('utf-8'))
          const result = saveVinyasaFlow(body.id, body.data)
          res.statusCode = 200
          res.end(JSON.stringify(result))
        } catch (e) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: e.message || 'Save failed' }))
        }
      })
    },
  }
}
