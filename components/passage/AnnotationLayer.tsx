'use client'

import React from 'react'
import type { Annotation, Highlight, SentenceBreak, QuestionEvidence, MarginNote } from '@/types'

interface ParagraphMeta {
  no: number
  core_sentence: string
}

interface AnnotationLayerProps {
  text: string
  annotations: Annotation[]
  highlights?: Highlight[]
  sentenceBreaks?: SentenceBreak[]
  questionEvidences?: QuestionEvidence[]
  marginNotes?: MarginNote[]
  paragraphData?: ParagraphMeta[]
  showBreaks?: boolean
  onTextSelect?: (selectedText: string, startIndex: number) => void
}

const U_CLASS: Record<string, string> = {
  blue: 'u-blue', red: 'u-red', amber: 'u-amber', green: 'u-green', purple: 'u-purple',
}
const N_CLASS: Record<string, string> = {
  blue: 'n-blue', red: 'n-red', amber: 'n-amber', green: 'n-green', purple: 'n-purple',
}
const HL_CLASS: Record<string, string> = {
  yellow: 'hl-yellow', blue: 'hl-blue', pink: 'hl-pink', orange: 'hl-orange',
}
const KW_HL: Record<string, string> = {
  blue: 'hl-yellow', red: 'hl-pink', amber: 'hl-orange', green: 'hl-yellow', purple: 'hl-blue',
}
const KW_MARK: Record<string, string> = {
  '○': 'kw-circle', '□': 'kw-box', '★': 'kw-star', '△': 'kw-tri',
}
const NOTE_TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  관계: { label: '관계', cls: 'bg-blue-100 text-blue-700' },
  흐름: { label: '흐름→', cls: 'bg-yellow-100 text-yellow-800' },
  대조: { label: '↔대조', cls: 'bg-pink-100 text-pink-700' },
  예시: { label: '〈예〉', cls: 'bg-green-100 text-green-700' },
}
const NOTE_COLOR: Record<string, string> = {
  yellow: 'bg-yellow-50 border-yellow-300 text-yellow-900',
  blue:   'bg-blue-50 border-blue-300 text-blue-900',
  pink:   'bg-pink-50 border-pink-300 text-pink-900',
  green:  'bg-green-50 border-green-300 text-green-900',
}

type SpanType = 'annotation' | 'highlight' | 'question'

interface Span {
  start: number
  end: number
  type: SpanType
  annotation?: Annotation
  highlight?: Highlight
  questionEvidences?: QuestionEvidence[]
}

function collectSpans(
  text: string,
  annotations: Annotation[],
  highlights: Highlight[],
  questionEvidences: QuestionEvidence[]
): Span[] {
  const spans: Span[] = []

  // --- Question evidences: group by text range ---
  const qeByRange = new Map<string, QuestionEvidence[]>()
  for (const qe of questionEvidences) {
    if (!qe.text) continue
    const idx = text.indexOf(qe.text)
    if (idx === -1) continue
    const key = `${idx}:${idx + qe.text.length}`
    if (!qeByRange.has(key)) qeByRange.set(key, [])
    qeByRange.get(key)!.push(qe)
  }
  const qeSpans: Span[] = []
  for (const [key, qes] of qeByRange) {
    const [s, e] = key.split(':').map(Number)
    qeSpans.push({ start: s, end: e, type: 'question', questionEvidences: qes })
  }
  qeSpans.sort((a, b) => a.start - b.start)
  let qeLastEnd = 0
  for (const s of qeSpans) {
    if (s.start >= qeLastEnd) { spans.push(s); qeLastEnd = s.end }
    else if (spans.length > 0) {
      const prev = spans[spans.length - 1]
      if (prev.type === 'question' && prev.questionEvidences && s.questionEvidences)
        prev.questionEvidences = [...prev.questionEvidences, ...s.questionEvidences]
    }
  }

  // --- Annotations ---
  for (const ann of annotations) {
    if (!ann.text) continue
    const idx = text.indexOf(ann.text)
    if (idx === -1) continue
    const end = idx + ann.text.length
    if (!spans.some(s => s.start < end && s.end > idx))
      spans.push({ start: idx, end, type: 'annotation', annotation: ann })
  }

  // --- Highlights ---
  for (const hl of highlights) {
    if (!hl.text) continue
    const idx = text.indexOf(hl.text)
    if (idx === -1) continue
    const end = idx + hl.text.length
    if (!spans.some(s => s.start < end && s.end > idx))
      spans.push({ start: idx, end, type: 'highlight', highlight: hl })
  }

  spans.sort((a, b) => a.start - b.start)
  const merged: Span[] = []
  let lastEnd = 0
  for (const s of spans) {
    if (s.start >= lastEnd) { merged.push(s); lastEnd = s.end }
  }
  return merged
}

// Compute paragraph-local break positions from sentenceBreaks
function getBreakPositions(
  fullText: string,
  sentenceBreaks: SentenceBreak[],
  paraOffset: number,
  paraLength: number
): Set<number> {
  const positions = new Set<number>()
  for (const sb of sentenceBreaks) {
    for (const brk of sb.breaks) {
      if (!brk) continue
      let searchFrom = paraOffset
      while (searchFrom < paraOffset + paraLength) {
        const idx = fullText.indexOf(brk, searchFrom)
        if (idx === -1 || idx + brk.length > paraOffset + paraLength) break
        positions.add(idx + brk.length) // absolute position after break text
        searchFrom = idx + 1
      }
    }
  }
  return positions
}

// Render plain text with slash markers at break positions
function textWithBreaks(
  str: string,
  absBase: number,
  breakPositions: Set<number>,
  keyPrefix: string
): React.ReactNode {
  const hits = [...breakPositions]
    .filter(bp => bp > absBase && bp <= absBase + str.length)
    .sort((a, b) => a - b)
  if (!hits.length) return <span key={keyPrefix}>{str}</span>
  const parts: React.ReactNode[] = []
  let pos = 0
  hits.forEach((bp, bi) => {
    const cut = bp - absBase
    if (cut > pos) parts.push(<span key={`${keyPrefix}-t${bi}`}>{str.slice(pos, cut)}</span>)
    parts.push(<span key={`${keyPrefix}-sl${bi}`} className="slash">/</span>)
    pos = cut
  })
  if (pos < str.length) parts.push(<span key={`${keyPrefix}-end`}>{str.slice(pos)}</span>)
  return <React.Fragment key={keyPrefix}>{parts}</React.Fragment>
}

function renderSpan(span: Span, content: string, key: string): React.ReactNode {
  if (span.type === 'annotation' && span.annotation) {
    const ann = span.annotation
    const uCls = U_CLASS[ann.color] || 'u-blue'
    const nCls = N_CLASS[ann.color] || 'n-blue'
    const isExample  = ann.symbol === '◇'
    const isCausal   = ann.symbol === '→'
    const isContrast = ann.symbol === '↔'
    const kwMarkCls  = KW_MARK[ann.symbol] || ''
    const kwHlCls    = KW_HL[ann.color] || 'hl-yellow'

    let innerContent: React.ReactNode
    if (kwMarkCls && ann.keyword && content.includes(ann.keyword)) {
      const ki  = content.indexOf(ann.keyword)
      const pre = content.slice(0, ki)
      const kw  = content.slice(ki, ki + ann.keyword.length)
      const post = content.slice(ki + ann.keyword.length)
      innerContent = (
        <>
          {pre && <span>{pre}</span>}
          <span className={`${kwMarkCls} ${kwHlCls}`}>{kw}</span>
          {post && <span>{post}</span>}
        </>
      )
    } else if (isExample) {
      innerContent = <><span className="eg-open">〈</span>{content}<span className="eg-close">〉</span></>
    } else if (isCausal) {
      innerContent = <><span className="connect-arrow">⟹</span>{content}</>
    } else if (isContrast) {
      innerContent = <><span className="contrast-mark">↔</span>{content}</>
    } else {
      innerContent = <>{content}</>
    }

    return (
      <span key={key} className="ann">
        <span className={`ann-text ${uCls}`}>{innerContent}</span>
        <span className={`ann-note ${nCls}`}>{ann.note}</span>
      </span>
    )
  }

  if (span.type === 'highlight' && span.highlight) {
    return (
      <span key={key} className={HL_CLASS[span.highlight.color] || 'hl-yellow'} title={span.highlight.reason}>
        {content}
      </span>
    )
  }

  if (span.type === 'question' && span.questionEvidences?.length) {
    const qCls = `qe-${Math.min(span.questionEvidences[0].question_no, 5)}`
    return (
      <span key={key} className={qCls}>
        {content}
        {span.questionEvidences.map((qe, qi) => (
          <sup key={qi} className="qe-label">{qe.question_no}-{qe.choice_no}</sup>
        ))}
      </span>
    )
  }

  return <span key={key}>{content}</span>
}

function renderParagraph(
  para: string,
  paraOffset: number,
  allSpans: Span[],
  paraIdx: number,
  fullText: string,
  paraNotes: MarginNote[],
  coreSentence: string | undefined,
  sentenceBreaks: SentenceBreak[],
  showBreaks: boolean,
  onTextSelect?: (text: string, start: number) => void
): React.ReactNode {
  const relevant = allSpans.filter(
    s => s.start >= paraOffset && s.end <= paraOffset + para.length
  )

  // Compute break positions for this paragraph
  const breakPositions = showBreaks
    ? getBreakPositions(fullText, sentenceBreaks, paraOffset, para.length)
    : new Set<number>()

  const nodes: React.ReactNode[] = []
  let cursor = 0

  for (let i = 0; i < relevant.length; i++) {
    const span = relevant[i]
    const ls = span.start - paraOffset
    const le = span.end - paraOffset

    if (ls > cursor) {
      nodes.push(textWithBreaks(para.slice(cursor, ls), paraOffset + cursor, breakPositions, `p-${paraIdx}-${i}`))
    }
    nodes.push(renderSpan(span, para.slice(ls, le), `s-${paraIdx}-${i}`))
    cursor = le
  }
  if (cursor < para.length) {
    nodes.push(textWithBreaks(para.slice(cursor), paraOffset + cursor, breakPositions, `tail-${paraIdx}`))
  }

  return (
    <div key={`para-${paraIdx}`} className="flex items-start gap-3 mb-6">
      <div className="flex-1">
        <p
          style={{ lineHeight: 2.4 }}
          onMouseUp={() => {
            if (!onTextSelect) return
            const sel = window.getSelection()
            if (!sel || sel.isCollapsed) return
            const selected = sel.toString().trim()
            if (selected.length < 2) return
            const idx = fullText.indexOf(selected, paraOffset)
            if (idx !== -1) onTextSelect(selected, idx)
          }}
        >
          {nodes}
        </p>
        {coreSentence && (
          <p className="mt-1.5 text-[0.8rem] text-indigo-500 font-semibold italic leading-snug border-l-2 border-indigo-200 pl-2">
            ▶ {coreSentence}
          </p>
        )}
      </div>
      {paraNotes.length > 0 && (
        <div className="w-36 shrink-0 space-y-1 pt-1">
          {paraNotes.map(note => {
            const badge = note.type && note.type !== '일반' ? NOTE_TYPE_BADGE[note.type] : null
            return (
              <div key={note.id} className={`text-[11px] p-1.5 rounded border-l-2 leading-snug ${NOTE_COLOR[note.color] ?? NOTE_COLOR.yellow}`}>
                {badge && (
                  <span className={`inline-block text-[9px] px-1 py-0.5 rounded font-semibold mr-1 ${badge.cls}`}>
                    {badge.label}
                  </span>
                )}
                {note.content}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AnnotationLayer({
  text,
  annotations,
  highlights = [],
  sentenceBreaks = [],
  questionEvidences = [],
  marginNotes = [],
  paragraphData = [],
  showBreaks = false,
  onTextSelect,
}: AnnotationLayerProps) {
  // Adaptive split: try double-newline first, fall back to single newline
  let paragraphs = text.split(/\n\n+/).filter(p => p.trim())
  if (paragraphs.length <= 1 && text.includes('\n')) {
    paragraphs = text.split(/\n/).filter(p => p.trim())
  }
  const spans = collectSpans(text, annotations, highlights, questionEvidences)

  const offsets: number[] = []
  let off = 0
  for (const para of paragraphs) {
    const idx = text.indexOf(para, off)
    offsets.push(idx)
    off = idx + para.length
  }

  return (
    <div className={`passage-text ${onTextSelect ? 'cursor-text select-text' : ''}`}>
      {paragraphs.map((para, i) => {
        const meta = paragraphData.find(p => p.no === i + 1) ?? paragraphData[i]
        return renderParagraph(
          para, offsets[i], spans, i, text,
          marginNotes.filter(n => n.paragraph_no === i + 1),
          meta?.core_sentence,
          sentenceBreaks,
          showBreaks,
          onTextSelect
        )
      })}
    </div>
  )
}
