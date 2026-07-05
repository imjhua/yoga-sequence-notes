import {
  deleteMdSequence,
  deleteVinyasaSequence,
} from '../../scripts/delete-sequence-lib.js'
import { listSequences } from '../../scripts/list-sequences-lib.js'

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.end(JSON.stringify(body))
}

async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'))
}

/** Vite dev: list / delete vinyasa JSON or MD sequence files */
export function sequenceDeleteDevApiPlugin() {
  return {
    name: 'sequence-delete-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const isList = req.url === '/api/sequences/list'
        const isVinyasa = req.url === '/api/vinyasa/delete'
        const isMd = req.url === '/api/sequence/delete'
        if (!isList && !isVinyasa && !isMd) return next()

        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          res.statusCode = 204
          res.end()
          return
        }

        if (isList) {
          if (req.method !== 'GET') {
            sendJson(res, 405, { error: 'Method not allowed' })
            return
          }
          try {
            sendJson(res, 200, { items: listSequences() })
          } catch (e) {
            sendJson(res, 500, { error: e.message || 'List failed' })
          }
          return
        }

        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }

        try {
          const body = await readJsonBody(req)
          const result = isVinyasa
            ? deleteVinyasaSequence(body.id)
            : deleteMdSequence(body.slug)
          sendJson(res, 200, result)
        } catch (e) {
          sendJson(res, 400, { error: e.message || 'Delete failed' })
        }
      })
    },
  }
}
