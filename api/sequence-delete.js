import { deleteMdSequence } from '../scripts/delete-sequence-lib.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      res.status(400).json({ error: 'Invalid JSON body' })
      return
    }
  }

  const { slug } = body ?? {}
  if (!slug) {
    res.status(400).json({ error: 'Missing slug' })
    return
  }

  try {
    const result = deleteMdSequence(slug)
    res.status(200).json(result)
  } catch (e) {
    res.status(400).json({ error: e.message || 'Delete failed' })
  }
}
