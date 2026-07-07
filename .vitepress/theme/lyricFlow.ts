export type Breath = 'inhale' | 'exhale'

export const DEFAULT_BEAT_MS = 630
export const BEAT_MS_MIN = 350
export const BEAT_MS_MAX = 2500
/** Count interval = song BPM at this ratio (0.5 → half speed, 2× longer per count) */
export const BEAT_COUNT_SPEED = 0.5

export function clampBeatMs(ms: number): number {
  return Math.min(BEAT_MS_MAX, Math.max(BEAT_MS_MIN, Math.round(ms)))
}

/** 0 = slowest · 100 = fastest (for progress bar fill) */
export function beatMsProgress(ms: number): number {
  const clamped = clampBeatMs(ms)
  return ((BEAT_MS_MAX - clamped) / (BEAT_MS_MAX - BEAT_MS_MIN)) * 100
}

export function beatMsFromBpm(bpm: number): number {
  if (!Number.isFinite(bpm) || bpm <= 0) return DEFAULT_BEAT_MS
  return clampBeatMs(Math.round(60000 / (bpm * BEAT_COUNT_SPEED)))
}

export function formatBeatMs(ms: number): string {
  const clamped = clampBeatMs(ms)
  if (clamped >= 1000) return `${(clamped / 1000).toFixed(1)}s`
  return `${(clamped / 1000).toFixed(2)}s`
}

export interface BeatAnchor {
  /** 0-based slot within the line measure */
  beatIndex: number
  tokenIndex: number
  pose?: string
}

export interface LyricMeasure {
  lineId: number
  anchors: BeatAnchor[]
}

export interface LyricToken {
  text: string
  /** @deprecated use breathAfter */
  breath?: Breath | null
  breathAfter?: Breath | null
  emphasis?: boolean
  /** @deprecated no longer used in editor */
  slashBefore?: boolean
}

export interface LyricLine {
  id: number
  raw: string
  translation: string
  /** @deprecated use token.breathAfter */
  breath?: Breath
  pose?: string
  tokens?: LyricToken[]
}

export const TIME_SIGNATURES = ['3/4', '4/4'] as const
export type TimeSignature = (typeof TIME_SIGNATURES)[number]

export function isTimeSignature(value: string): value is TimeSignature {
  return (TIME_SIGNATURES as readonly string[]).includes(value)
}

/** 3/4 → 3카운트 · 4/4 → 4카운트 (1마디) */
export function countTotalForTimeSignature(ts: TimeSignature): number {
  return Number(ts.split('/')[0])
}

export interface LyricFlowData {
  meta: {
    song?: string
    artist?: string
    theme?: string
    peak_pose?: string
    /** YouTube watch / share URL */
    youtubeUrl?: string
    /** 3/4 → 3카운트 · 4/4 → 4카운트 */
    timeSignature?: TimeSignature
    /** Beat interval in ms (default 630) */
    beatMs?: number
    /** Detected tempo (quarter-note BPM) */
    bpm?: number
    /** Where bpm came from — deezer | cache */
    bpmSource?: string
    /** ISO timestamp of last BPM analysis */
    bpmAnalyzedAt?: string
    /** Agent seed timestamp — newer seed replaces local draft */
    seededAt?: string
    /** Studio save timestamp */
    savedAt?: string
    /** Local draft cleared — ignore file until it updates after this time */
    draftClearedAt?: string
  }
  lines: LyricLine[]
  /** Per-line beat anchors — source of truth for bold + breath timing */
  measures?: LyricMeasure[]
}

export const DRAFT_SLUG = 'draft'
export const BREATH_DRAG_TYPE = 'application/x-vinyasa-breath'

export function splitRawToTokens(raw: string): LyricToken[] {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => ({ text, breathAfter: null, emphasis: false }))
}

/** Preserve trailing spaces while typing (trim only for token boundaries). */
export function splitRawToTokensForEdit(raw: string): LyricToken[] {
  const collapsed = raw.replace(/\s+/g, ' ')
  const withoutTrailing = collapsed.replace(/\s+$/, '')
  if (!withoutTrailing.trim()) return []
  return withoutTrailing
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => ({ text, breathAfter: null, emphasis: false }))
}

/** Ignore newlines; split only after `.` */
export function splitLyricsTextToRaws(text: string): string[] {
  const collapsed = text.replace(/\s+/g, ' ').trim()
  if (!collapsed) return []
  const parts = collapsed
    .split(/(?<=\.)\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
  return parts.length ? parts : [collapsed]
}

function tokenEndsWithPeriod(text: string): boolean {
  return /\.$/.test(text)
}

export function tokenBreath(token: LyricToken): Breath | null {
  return token.breathAfter ?? token.breath ?? null
}

export function normalizeToken(token: LyricToken): LyricToken {
  const breathAfter = token.breathAfter ?? token.breath ?? null
  return {
    text: token.text,
    breathAfter,
    emphasis: !!token.emphasis,
  }
}

export function normalizeLine(line: LyricLine): LyricLine {
  const raw = line.raw.replace(/\s+/g, ' ').trim()
  const tokens = (line.tokens?.length ? line.tokens : splitRawToTokens(raw)).map(normalizeToken)

  if (line.breath && tokens.every((t) => !tokenBreath(t))) {
    tokens.forEach((t) => {
      t.breathAfter = line.breath
    })
  }

  return { ...line, raw, tokens }
}

export function measureForLine(data: LyricFlowData, lineId: number): LyricMeasure | undefined {
  return data.measures?.find((m) => m.lineId === lineId)
}

export function syncLineTokensFromMeasure(line: LyricLine, measure: LyricMeasure): void {
  const tokens = lineTokens(line)
  if (!line.tokens) line.tokens = tokens
  for (const token of line.tokens) {
    token.emphasis = false
    token.breathAfter = null
  }
  for (const anchor of measure.anchors) {
    const token = line.tokens[anchor.tokenIndex]
    if (token) token.emphasis = true
  }
}

export function migrateLegacyMeasures(data: LyricFlowData): LyricMeasure[] {
  const ts = data.meta.timeSignature ?? '4/4'
  const beatCount = countTotalForTimeSignature(ts)

  return data.lines.map((line) => {
    const tokens = lineTokens(line)
    const emphasisIndices = tokens
      .map((t, i) => (t.emphasis ? i : -1))
      .filter((i) => i >= 0)

    const anchors: BeatAnchor[] = []
    let beatSlot = 0
    for (const tokenIndex of emphasisIndices) {
      if (beatSlot >= beatCount) break
      anchors.push({ beatIndex: beatSlot, tokenIndex })
      beatSlot += 1
    }

    return { lineId: line.id, anchors }
  })
}

export function ensureMeasures(data: LyricFlowData): LyricMeasure[] {
  const lines = data.lines.map(normalizeLine)
  data.lines = lines

  if (!data.measures?.length) {
    data.measures = migrateLegacyMeasures(data)
  }

  const byLineId = new Map(data.measures.map((m) => [m.lineId, m]))
  data.measures = lines.map((line) => {
    const existing = byLineId.get(line.id)
    return existing ?? { lineId: line.id, anchors: [] }
  })

  if (data.meta.timeSignature) {
    const beatCount = countTotalForTimeSignature(data.meta.timeSignature)
    for (const measure of data.measures) {
      measure.anchors = measure.anchors.filter((a) => a.beatIndex < beatCount)
    }
  }

  for (const line of lines) {
    const measure = data.measures.find((m) => m.lineId === line.id)!
    syncLineTokensFromMeasure(line, measure)
  }

  return data.measures
}

export function normalizeData(data: LyricFlowData): LyricFlowData {
  const normalized: LyricFlowData = {
    ...data,
    meta: {
      ...data.meta,
      beatMs: data.meta.beatMs ?? DEFAULT_BEAT_MS,
    },
    lines: data.lines.map(normalizeLine),
  }
  if (normalized.meta.bpm) {
    normalized.meta.beatMs = beatMsFromBpm(normalized.meta.bpm)
  }
  ensureMeasures(normalized)
  reflowLinesByBreath(normalized)
  return normalized
}

interface ReflowFlatItem {
  token: LyricToken
  anchor?: BeatAnchor
  pose: string
  translation: string
  sourceLineId: number
}

/** Merge lines, then split on `.` or breath anchors (bold beat slots). */
export function reflowLinesByBreath(data: LyricFlowData): void {
  if (!data.lines.length) {
    data.measures = []
    return
  }

  const measures = data.measures ?? []
  const flat: ReflowFlatItem[] = []

  for (let li = 0; li < data.lines.length; li++) {
    const line = normalizeLine(data.lines[li])
    const measure = measures[li] ?? { lineId: line.id, anchors: [] }

    for (let ti = 0; ti < lineTokens(line).length; ti++) {
      const token = line.tokens![ti]
      const anchor = measure.anchors.find((a) => a.tokenIndex === ti)
      flat.push({
        token: { ...token },
        anchor: anchor ? { ...anchor } : undefined,
        pose: line.pose ?? '',
        translation: line.translation ?? '',
        sourceLineId: line.id,
      })
    }
  }

  type Segment = {
    tokens: LyricToken[]
    anchors: BeatAnchor[]
    pose: string
    translation: string
    sourceLineIds: Set<number>
  }

  const segments: Segment[] = []
  let current: Segment = {
    tokens: [],
    anchors: [],
    pose: '',
    translation: '',
    sourceLineIds: new Set(),
  }

  function pushSegment() {
    if (!current.tokens.length) return
    segments.push(current)
    current = {
      tokens: [],
      anchors: [],
      pose: '',
      translation: '',
      sourceLineIds: new Set(),
    }
  }

  for (const item of flat) {
    if (item.anchor && current.tokens.length > 0) {
      pushSegment()
    }

    current.tokens.push(item.token)
    current.sourceLineIds.add(item.sourceLineId)

    if (item.anchor) {
      current.anchors.push({
        beatIndex: item.anchor.beatIndex,
        tokenIndex: current.tokens.length - 1,
        pose: item.anchor.pose,
      })
      if (item.pose) current.pose = item.pose
    } else {
      if (!current.pose && item.pose) current.pose = item.pose
      if (!current.translation && item.translation) current.translation = item.translation
    }

    if (tokenEndsWithPeriod(item.token.text)) pushSegment()
  }
  pushSegment()

  for (const segment of segments) {
    if (segment.sourceLineIds.size > 1) segment.translation = ''
  }

  data.lines = segments.map((segment, index) =>
    normalizeLine({
      id: index + 1,
      raw: segment.tokens.map((token) => token.text).join(' '),
      translation: segment.translation,
      pose: segment.pose,
      tokens: segment.tokens,
    }),
  )

  data.measures = segments.map((segment, index) => ({
    lineId: index + 1,
    anchors: segment.anchors.map((anchor) => ({ ...anchor })),
  }))

  for (let i = 0; i < data.lines.length; i++) {
    syncLineTokensFromMeasure(data.lines[i], data.measures[i])
  }
}

export function anchorGlobalOffset(measures: LyricMeasure[], lineIndex: number): number {
  let count = 0
  for (let i = 0; i < lineIndex; i++) {
    count += measures[i]?.anchors.length ?? 0
  }
  return count
}

export function breathForGlobalIndex(globalIndex: number): Breath {
  return globalIndex % 2 === 0 ? 'inhale' : 'exhale'
}

export function anchorAtBeat(measure: LyricMeasure, beatIndex: number): BeatAnchor | undefined {
  return measure.anchors.find((a) => a.beatIndex === beatIndex)
}

export function anchorAtToken(measure: LyricMeasure, tokenIndex: number): BeatAnchor | undefined {
  return measure.anchors.find((a) => a.tokenIndex === tokenIndex)
}

export function effectivePose(line: LyricLine, anchor?: BeatAnchor): string {
  return anchor?.pose?.trim() || line.pose?.trim() || ''
}

export function setMeasureAnchor(
  measure: LyricMeasure,
  line: LyricLine,
  beatIndex: number,
  tokenIndex: number,
): void {
  measure.anchors = measure.anchors.filter(
    (a) => a.beatIndex !== beatIndex && a.tokenIndex !== tokenIndex,
  )
  measure.anchors.push({ beatIndex, tokenIndex })
  measure.anchors.sort((a, b) => a.beatIndex - b.beatIndex)
  syncLineTokensFromMeasure(line, measure)
}

export function clearMeasureAnchor(
  measure: LyricMeasure,
  line: LyricLine,
  beatIndex: number,
): void {
  measure.anchors = measure.anchors.filter((a) => a.beatIndex !== beatIndex)
  syncLineTokensFromMeasure(line, measure)
}

export function clearMeasureAnchorByToken(
  measure: LyricMeasure,
  line: LyricLine,
  tokenIndex: number,
): void {
  measure.anchors = measure.anchors.filter((a) => a.tokenIndex !== tokenIndex)
  syncLineTokensFromMeasure(line, measure)
}

export function lineTokens(line: LyricLine): LyricToken[] {
  return line.tokens?.length ? line.tokens : splitRawToTokens(line.raw)
}

export function lineBreathSummary(line: LyricLine): 'inhale' | 'exhale' | 'mixed' | 'unset' {
  const breaths = lineTokens(line).map(tokenBreath).filter(Boolean)
  if (breaths.length === 0) return 'unset'
  if (breaths.every((b) => b === 'inhale')) return 'inhale'
  if (breaths.every((b) => b === 'exhale')) return 'exhale'
  return 'mixed'
}

export function renderAnnotated(
  line: LyricLine,
  measure?: LyricMeasure,
  globalOffset = 0,
): string {
  const tokens = lineTokens(line)
  const anchors = measure?.anchors ?? []
  let anchorOrd = globalOffset
  let out = ''

  for (let ti = 0; ti < tokens.length; ti++) {
    const t = tokens[ti]
    const anchor = anchors.find((a) => a.tokenIndex === ti)

    if (t.emphasis || anchor) {
      out += `**${t.text}**`
      if (anchor) {
        const breath = breathForGlobalIndex(anchorOrd)
        anchorOrd += 1
        out += ` [${breath.toUpperCase()}]`
        const pose = effectivePose(line, anchor)
        if (pose) out += ` · ${pose}`
      }
    } else {
      out += t.text
    }
    out += ' '
  }
  return out.trim()
}

export function renderExportLine(
  line: LyricLine,
  measure?: LyricMeasure,
  globalOffset = 0,
): string {
  const annotated = renderAnnotated(line, measure, globalOffset)
  if (measure?.anchors.length) return annotated
  return line.pose ? `${annotated} · ${line.pose}` : annotated
}

export function setBreathAfter(line: LyricLine, tokenIndex: number, breath: Breath | null): void {
  const tokens = lineTokens(line)
  if (!line.tokens) line.tokens = tokens
  const token = line.tokens[tokenIndex]
  if (!token) return
  token.breathAfter = breath
}

export function toggleEmphasis(line: LyricLine, tokenIndex: number): void {
  const tokens = lineTokens(line)
  if (!line.tokens) line.tokens = tokens
  const token = line.tokens[tokenIndex]
  if (!token) return
  token.emphasis = !token.emphasis
}

export function parseLyricsPaste(text: string, startId = 1): LyricLine[] {
  return splitLyricsTextToRaws(text).map((raw, i) =>
    normalizeLine({
      id: startId + i,
      raw,
      translation: '',
      pose: '',
    }),
  )
}

export function renumberLinesAndMeasures(data: LyricFlowData): void {
  if (!data.measures) data.measures = []
  for (let i = 0; i < data.lines.length; i++) {
    data.lines[i].id = i + 1
    if (data.measures[i]) data.measures[i].lineId = i + 1
  }
}

/** Keep separate line cards in reflow when the first token is a beat anchor. */
export function ensureFirstTokenAnchor(line: LyricLine, measure: LyricMeasure): void {
  if (!lineTokens(line).length || measure.anchors.length > 0) return
  setMeasureAnchor(measure, line, 0, 0)
}

export function updateLineRaw(line: LyricLine, measure: LyricMeasure, raw: string): void {
  line.raw = raw
  const tokens = splitRawToTokensForEdit(raw)
  line.tokens = tokens
  measure.anchors = measure.anchors.filter((a) => a.tokenIndex < tokens.length)
  syncLineTokensFromMeasure(line, measure)
  if (tokens.length > 0) ensureFirstTokenAnchor(line, measure)
}

export function insertLineAt(
  data: LyricFlowData,
  afterIndex: number,
  raw = '',
): number {
  const insertAt =
    afterIndex < 0 ? 0 : Math.min(afterIndex + 1, data.lines.length)
  const line = normalizeLine({
    id: insertAt + 1,
    raw,
    translation: '',
    pose: '',
  })
  const measure: LyricMeasure = { lineId: line.id, anchors: [] }
  if (lineTokens(line).length > 0) {
    setMeasureAnchor(measure, line, 0, 0)
  }
  if (!data.measures) data.measures = []
  data.lines.splice(insertAt, 0, line)
  data.measures.splice(insertAt, 0, measure)
  renumberLinesAndMeasures(data)
  return insertAt
}

export function removeLineAt(data: LyricFlowData, index: number): void {
  if (index < 0 || index >= data.lines.length) return
  data.lines.splice(index, 1)
  if (data.measures) data.measures.splice(index, 1)
  renumberLinesAndMeasures(data)
}

export function vinyasaJsonUrl(name: string): string {
  return `/vinyasa/${name}.json`
}

export function parseYoutubeVideoId(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw

  try {
    const url = new URL(raw)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0]
      return id || null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const fromQuery = url.searchParams.get('v')
      if (fromQuery) return fromQuery

      const embed = url.pathname.match(/\/embed\/([^/?]+)/)
      if (embed) return embed[1]

      const shorts = url.pathname.match(/\/shorts\/([^/?]+)/)
      if (shorts) return shorts[1]
    }
  } catch {
    return null
  }

  return null
}

export function youtubeEmbedUrl(input: string): string | null {
  const id = parseYoutubeVideoId(input)
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
}

export function vinyasaDraftKey(name: string): string {
  return `vinyasa-draft:${name}`
}

export interface VinyasaPlaybackLocal {
  youtubeUrl?: string
  videoId?: string | null
  bpm?: number
  beatMs?: number
  bpmSource?: string
  analyzedAt?: string
}

export function playbackLocalKey(sequenceId: string): string {
  return `vinyasa-playback:${sequenceId}`
}

export function loadPlaybackLocal(sequenceId: string): VinyasaPlaybackLocal | null {
  if (typeof localStorage === 'undefined' || !sequenceId) return null
  try {
    const raw = localStorage.getItem(playbackLocalKey(sequenceId))
    return raw ? (JSON.parse(raw) as VinyasaPlaybackLocal) : null
  } catch {
    return null
  }
}

export function savePlaybackLocal(sequenceId: string, playback: VinyasaPlaybackLocal): void {
  if (typeof localStorage === 'undefined' || !sequenceId) return
  localStorage.setItem(playbackLocalKey(sequenceId), JSON.stringify(playback))
}

export function clearPlaybackLocal(sequenceId: string): void {
  if (typeof localStorage === 'undefined' || !sequenceId) return
  localStorage.removeItem(playbackLocalKey(sequenceId))
}

/** Merge saved playback prefs (YouTube + BPM) into sequence meta */
export function applyPlaybackLocal(
  sequenceId: string,
  data: LyricFlowData,
): LyricFlowData {
  const playback = loadPlaybackLocal(sequenceId)
  if (!playback) return data

  const meta = { ...data.meta }
  const fileVideoId = parseYoutubeVideoId(meta.youtubeUrl ?? '')
  const localVideoId = playback.videoId ?? parseYoutubeVideoId(playback.youtubeUrl ?? '')

  if (playback.youtubeUrl && (!meta.youtubeUrl || localVideoId === fileVideoId || !fileVideoId)) {
    meta.youtubeUrl = playback.youtubeUrl
  }

  if (
    playback.bpm &&
    playback.beatMs &&
    localVideoId &&
    localVideoId === parseYoutubeVideoId(meta.youtubeUrl ?? '')
  ) {
    meta.bpm = playback.bpm
    meta.beatMs = playback.beatMs
    meta.bpmSource = playback.bpmSource
    meta.bpmAnalyzedAt = playback.analyzedAt
  }

  return { ...data, meta }
}

export function persistPlaybackFromMeta(sequenceId: string, meta: LyricFlowData['meta']): void {
  if (!sequenceId) return
  const youtubeUrl = meta.youtubeUrl?.trim()
  if (!youtubeUrl) {
    clearPlaybackLocal(sequenceId)
    return
  }

  savePlaybackLocal(sequenceId, {
    youtubeUrl,
    videoId: parseYoutubeVideoId(youtubeUrl),
    bpm: meta.bpm,
    beatMs: meta.beatMs,
    bpmSource: meta.bpmSource,
    analyzedAt: meta.bpmAnalyzedAt,
  })
}

export function loadDraft(name: string): LyricFlowData | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(vinyasaDraftKey(name))
    return raw ? normalizeData(JSON.parse(raw) as LyricFlowData) : null
  } catch {
    return null
  }
}

export function saveDraft(name: string, data: LyricFlowData): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(vinyasaDraftKey(name), JSON.stringify(data))
}

export function clearDraft(name: string): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(vinyasaDraftKey(name))
}

export function hasDraft(name: string): boolean {
  const draft = loadDraft(name)
  return (draft?.lines?.length ?? 0) > 0
}

export function saveClearedDraft(name: string): LyricFlowData {
  const data: LyricFlowData = {
    meta: {
      theme: '빈야사',
      draftClearedAt: new Date().toISOString(),
    },
    lines: [],
    measures: [],
  }
  saveDraft(name, data)
  return data
}
