import { listSequences } from '../scripts/list-sequences-lib.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    res.status(200).json({ items: listSequences() })
  } catch (e) {
    res.status(500).json({ error: e.message || 'List failed' })
  }
}
