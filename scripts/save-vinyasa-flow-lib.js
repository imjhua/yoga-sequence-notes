/**
 * Save vinyasa sequence JSON + update manifest (no separate MD page)
 */
import {
  upsertManifestEntry,
  syncSequenceJson,
  sequenceTitle,
} from './vinyasa-manifest-lib.js'

export function saveVinyasaFlow(id, data) {
  if (!id || typeof id !== 'string') {
    throw new Error('Missing sequence id')
  }
  if (!data?.lines?.length) {
    throw new Error('No lines to save')
  }

  const payload = {
    ...data,
    meta: {
      ...data.meta,
      theme: data.meta?.theme || '빈야사',
      savedAt: new Date().toISOString(),
    },
  }

  syncSequenceJson(id, payload)
  upsertManifestEntry(id, payload)

  return {
    id,
    jsonPath: `sequences/vinyasa/${id}.json`,
    title: sequenceTitle(payload, id),
  }
}
