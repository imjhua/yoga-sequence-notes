import { fetchTranslation } from '../scripts/translate-lib.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  const text = req.query?.text
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Missing text query parameter' })
    return
  }

  try {
    const translation = await fetchTranslation(text)
    res.status(200).json({ translation })
  } catch (e) {
    res.status(502).json({ error: e.message || 'Translation failed' })
  }
}
