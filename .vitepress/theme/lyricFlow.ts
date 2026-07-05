export type Breath = 'inhale' | 'exhale'

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

export interface LyricFlowData {
  meta: {
    song?: string
    artist?: string
    theme?: string
    peak_pose?: string
    /** Agent seed timestamp — newer seed replaces local draft */
    seededAt?: string
    /** Studio save timestamp */
    savedAt?: string
    /** Local draft cleared — ignore file until it updates after this time */
    draftClearedAt?: string
  }
  lines: LyricLine[]
}

export const DRAFT_SLUG = 'draft'
export const BREATH_DRAG_TYPE = 'application/x-vinyasa-breath'

export function splitRawToTokens(raw: string): LyricToken[] {
  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => ({ text, breathAfter: null, emphasis: false }))
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
  const tokens = (line.tokens?.length ? line.tokens : splitRawToTokens(line.raw)).map(normalizeToken)

  if (line.breath && tokens.every((t) => !tokenBreath(t))) {
    tokens.forEach((t) => {
      t.breathAfter = line.breath
    })
  }

  return { ...line, tokens }
}

export function normalizeData(data: LyricFlowData): LyricFlowData {
  return {
    ...data,
    lines: data.lines.map(normalizeLine),
  }
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

export function renderAnnotated(line: LyricLine): string {
  const tokens = lineTokens(line)
  let out = ''
  for (const t of tokens) {
    if (t.emphasis) out += `**${t.text}**`
    else out += t.text
    const b = tokenBreath(t)
    if (b) out += ` [${b.toUpperCase()}]`
    out += ' '
  }
  return out.trim()
}

export function renderExportLine(line: LyricLine): string {
  const annotated = renderAnnotated(line)
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
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((raw, i) =>
      normalizeLine({
        id: startId + i,
        raw,
        translation: '',
        pose: '',
        tokens: splitRawToTokens(raw),
      }),
    )
}

export function vinyasaJsonUrl(name: string): string {
  return `/vinyasa/${name}.json`
}

export function vinyasaDraftKey(name: string): string {
  return `vinyasa-draft:${name}`
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
  }
  saveDraft(name, data)
  return data
}
