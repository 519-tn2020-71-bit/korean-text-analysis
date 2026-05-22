'use client'

import type { AnalysisResult, Annotation } from '@/types'

// ── 색상 상수 ─────────────────────────────────────────────────────────────────
const UNDERLINE: Record<string, { ul: string; text: string; bg: string }> = {
  red:    { ul: '#e74c3c', text: '#c0392b', bg: '#fef2f2' },
  blue:   { ul: '#1565c0', text: '#1565c0', bg: '#eff6ff' },
  purple: { ul: '#7b1fa2', text: '#7b1fa2', bg: '#f5f3ff' },
  amber:  { ul: '#d97706', text: '#b45309', bg: '#fffbeb' },
  green:  { ul: '#15803d', text: '#15803d', bg: '#f0fdf4' },
}

const FUNCTION_TAG_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  정의:   { bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd' },
  예시:   { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
  인과:   { bg: '#fffbeb', text: '#92400e', border: '#fcd34d' },
  대조:   { bg: '#fff7ed', text: '#c2410c', border: '#fdba74' },
  열거:   { bg: '#faf5ff', text: '#6d28d9', border: '#c4b5fd' },
  부연:   { bg: '#f8fafc', text: '#374151', border: '#cbd5e1' },
  주장:   { bg: '#fef2f2', text: '#b91c1c', border: '#fca5a5' },
  근거:   { bg: '#ecfeff', text: '#0e7490', border: '#67e8f9' },
  결론:   { bg: '#f0fdf4', text: '#166534', border: '#4ade80' },
}

const RELATION_STYLE: Record<string, { color: string; bg: string }> = {
  도입: { color: '#6366f1', bg: '#eef2ff' },
  전환: { color: '#d97706', bg: '#fffbeb' },
  부연: { color: '#64748b', bg: '#f1f5f9' },
  대조: { color: '#dc2626', bg: '#fef2f2' },
  예시: { color: '#16a34a', bg: '#f0fdf4' },
  근거: { color: '#0891b2', bg: '#ecfeff' },
  결론: { color: '#7c3aed', bg: '#f5f3ff' },
}

const EXAM_TYPE_COLOR: Record<string, string> = {
  추론:    'bg-purple-100 text-purple-700',
  어휘:    'bg-amber-100 text-amber-700',
  구조파악: 'bg-blue-100 text-blue-700',
  적용:    'bg-green-100 text-green-700',
  사실확인: 'bg-gray-100 text-gray-600',
}

// ── 단락 분리 ─────────────────────────────────────────────────────────────────
function splitParagraphs(text: string): string[] {
  let ps = text.split(/\n\n+/).filter(p => p.trim())
  if (ps.length <= 1 && text.includes('\n')) {
    ps = text.split(/\n/).filter(p => p.trim())
  }
  return ps
}

// ── 하이라이트 세그먼트 빌더 ─────────────────────────────────────────────────
// 지문 내 하이라이트는 핵심 내용(red=핵심주장, blue=정의)만 표시
const INLINE_HIGHLIGHT_COLORS = new Set(['red', 'blue'])

interface Segment { text: string; ann: Annotation | null }

function buildSegments(paraText: string, annotations: Annotation[]): Segment[] {
  const relevant = annotations.filter(
    a => a.text && paraText.includes(a.text) && INLINE_HIGHLIGHT_COLORS.has(a.color)
  )
  const matches: Array<{ start: number; end: number; ann: Annotation }> = []

  for (const ann of relevant) {
    const idx = paraText.indexOf(ann.text)
    if (idx !== -1) matches.push({ start: idx, end: idx + ann.text.length, ann })
  }

  matches.sort((a, b) => a.start - b.start)

  const filtered: typeof matches = []
  let lastEnd = 0
  for (const m of matches) {
    if (m.start >= lastEnd) { filtered.push(m); lastEnd = m.end }
  }

  const segs: Segment[] = []
  let cursor = 0
  for (const m of filtered) {
    if (m.start > cursor) segs.push({ text: paraText.slice(cursor, m.start), ann: null })
    segs.push({ text: paraText.slice(m.start, m.end), ann: m.ann })
    cursor = m.end
  }
  if (cursor < paraText.length) segs.push({ text: paraText.slice(cursor), ann: null })
  return segs
}

// ── [빈칸] 파싱 ──────────────────────────────────────────────────────────────
function renderReadingGuide(guide: string) {
  const parts = guide.split(/(\[[^\]]+\])/)
  return parts.map((part, i) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      const inner = part.slice(1, -1)
      return (
        <span key={i} className="inline-block border-b-2 border-indigo-400 text-indigo-700 font-bold px-1 mx-0.5 bg-indigo-50 rounded text-[11px]">
          {inner}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// ── 지문 하이라이트 렌더링 ────────────────────────────────────────────────────
function HighlightedPassage({ paraText, annotations }: { paraText: string; annotations: Annotation[] }) {
  const segs = buildSegments(paraText, annotations)
  return (
    <div
      style={{
        fontFamily: "'Noto Serif KR', 'Batang', 'Georgia', serif",
        fontSize: '10.5pt',
        lineHeight: 2.3,
        textAlign: 'justify',
        color: '#1a1a1a',
        wordBreak: 'keep-all',
      }}
    >
      {segs.map((seg, i) => {
        if (!seg.ann) return <span key={i}>{seg.text}</span>
        const c = UNDERLINE[seg.ann.color] ?? UNDERLINE.blue
        return (
          <span key={i}>
            <span style={{ borderBottom: `2px solid ${c.ul}`, color: c.text, fontWeight: 600 }}>
              {seg.text}
            </span>
            {seg.ann.note && (
              <sup style={{ fontSize: '8px', color: c.text, marginLeft: '2px', fontWeight: 'normal', fontStyle: 'italic', lineHeight: 1 }}>
                {seg.ann.note}
              </sup>
            )}
          </span>
        )
      })}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  analysis: AnalysisResult
  passageText?: string
  passageId?: string
  onSvgGenerated?: (svg: string) => void
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function InfographicView({ analysis, passageText }: Props) {
  const { macro, paragraphs = [], highlights = [], exam_points = [], compare_cards = [] } = analysis
  const annotations = analysis.annotations ?? []

  const paraTexts = passageText ? splitParagraphs(passageText) : []
  const concepts   = highlights.filter(h => h.color === 'yellow').slice(0, 14)
  const contrasts  = highlights.filter(h => h.color === 'orange').slice(0, 6)
  const persons    = highlights.filter(h => h.color === 'pink')

  return (
    <div className="space-y-0 text-sm">

      {/* ══ ① 전체 요약 헤더 ══════════════════════════════════════════════════ */}
      <div className="rounded-2xl overflow-hidden border border-slate-800 shadow mb-5">
        <div className="bg-slate-900 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mb-1">화제</p>
              <h2 className="text-white font-extrabold text-lg leading-tight">{macro.topic}</h2>
            </div>
            <div className="flex flex-col gap-1.5 items-end shrink-0">
              <span className="bg-green-800/60 text-green-300 text-[10px] px-2.5 py-1 rounded font-mono font-medium border border-green-700">{macro.text_type}</span>
              <span className="bg-slate-700 text-slate-300 text-[10px] px-2.5 py-1 rounded font-mono font-medium">{macro.structure}</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200">
          <p className="text-slate-800 leading-relaxed font-semibold text-[13px]">{macro.main_idea}</p>
        </div>
      </div>

      {/* ══ ② 비교대조 표 (있으면) ══════════════════════════════════════════ */}
      {compare_cards.map((card, ci) => (
        <div key={ci} className="bg-white border border-orange-200 rounded-2xl p-4 shadow-sm mb-5">
          <p className="text-[11px] font-bold text-orange-600 mb-3">📋 핵심 개념 비교표</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr>
                  <th className="bg-slate-700 text-white px-3 py-2 text-center border border-slate-600 font-medium w-24">비교 기준</th>
                  <th className="bg-blue-700 text-white px-3 py-2 text-center border border-blue-600 font-medium">{card.person_a}</th>
                  <th className="bg-red-700 text-white px-3 py-2 text-center border border-red-600 font-medium">{card.person_b}</th>
                </tr>
              </thead>
              <tbody>
                {card.comparison_points.map((pt, pi) => (
                  <tr key={pi} className={pi % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-3 py-2 text-center font-semibold text-slate-700 border border-slate-200">{pt.aspect}</td>
                    <td className="px-3 py-2 text-blue-800 border border-slate-200 leading-snug">{pt.a_value}</td>
                    <td className="px-3 py-2 text-red-800 border border-slate-200 leading-snug">{pt.b_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* ══ ③ 단락별 지문 + 해설 ══════════════════════════════════════════════ */}
      {paragraphs.map((para, i) => {
        const paraText = paraTexts[i] ?? ''
        const paraAnns = paraText
          ? annotations.filter(a => a.text && paraText.includes(a.text))
          : annotations.filter(a => (a.position ?? 0) >= i * 100 && (a.position ?? 0) < (i + 1) * 100)

        const tag = FUNCTION_TAG_STYLE[para.function_tag] ?? FUNCTION_TAG_STYLE.부연
        const relKey = para.relation_to_prev ?? (i === 0 ? '도입' : '부연')
        const rel = RELATION_STYLE[relKey] ?? RELATION_STYLE.부연

        return (
          <div key={para.no} className="mb-6">
            {/* 지문 블록 라벨 */}
            <div className="flex items-center gap-2 mb-0">
              <span className="text-[10px] font-bold text-white bg-slate-800 px-3 py-1 rounded-t-lg">지문</span>
              {para.writing_style && (
                <span className="text-[10px] text-slate-500 font-mono">{para.writing_style}</span>
              )}
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ color: tag.text, background: tag.bg, border: `1px solid ${tag.border}` }}
              >
                {para.function_tag}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ color: rel.color, background: rel.bg }}
              >
                {relKey}
              </span>
            </div>

            {/* 지문 블록 본문 */}
            <div className="bg-white border-l-4 border-t border-r border-b border-slate-800 rounded-tr-xl rounded-b-xl px-5 py-4 mb-0"
              style={{ borderLeftColor: '#1e293b' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-white text-[11px] font-black shrink-0">
                  {para.no}
                </span>
              </div>
              {paraText ? (
                <HighlightedPassage paraText={paraText} annotations={paraAnns} />
              ) : (
                <p className="text-slate-600 text-[12px] leading-loose">{para.core_sentence}</p>
              )}
            </div>

            {/* 해설 블록 라벨 */}
            <div className="mt-0.5">
              <span className="text-[10px] font-bold text-white bg-green-700 px-3 py-1 rounded-t-lg">해설</span>
            </div>

            {/* 해설 블록 본문 */}
            <div className="bg-stone-50 border-l-4 border-t border-r border-b border-green-700 rounded-tr-xl rounded-b-xl px-5 py-4 space-y-3">

              {/* 문단의 기능 */}
              {para.function && (
                <div>
                  <span className="text-[10px] font-bold text-green-800">문단의 기능</span>
                  <p className="text-[12px] text-slate-700 mt-0.5 leading-relaxed">{para.function}</p>
                </div>
              )}

              {/* 논리 구조 */}
              {para.logical_structure && (
                <div>
                  <span className="text-[10px] font-bold text-green-800">논리 구조</span>
                  <p className="text-[12px] text-slate-700 mt-0.5 leading-relaxed">{para.logical_structure}</p>
                </div>
              )}

              {/* 앞 단락과의 관계 */}
              {para.relation_explanation && i > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-green-800">앞 단락과의 관계</span>
                  <div className="flex items-start gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0 mt-0.5"
                      style={{ color: rel.color, background: rel.bg }}
                    >
                      {relKey}
                    </span>
                    <p className="text-[12px] text-slate-700 leading-relaxed">{para.relation_explanation}</p>
                  </div>
                </div>
              )}

              {/* 접속어·지시어 분석 */}
              {para.connective_analysis && para.connective_analysis.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-green-800">접속어·지시어 분석</span>
                  <div className="mt-1 space-y-1">
                    {para.connective_analysis.map((item, ci) => (
                      <div key={ci} className="flex items-start gap-2 text-[11px]">
                        <span className="font-black text-slate-800 shrink-0">'{item.word}'</span>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">{item.role}</span>
                        <span className="text-slate-600 leading-snug">{item.explanation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 읽기 가이드 */}
              {para.reading_guide && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2.5">
                  <span className="text-[10px] font-bold text-indigo-700 block mb-1">📖 읽기 가이드</span>
                  <p className="text-[11.5px] text-indigo-900 leading-relaxed">
                    {renderReadingGuide(para.reading_guide)}
                  </p>
                </div>
              )}

              {/* 출제 포인트 */}
              {para.exam_traps && para.exam_traps.length > 0 && (
                <div className="border-t border-green-200 pt-2.5">
                  <span className="text-[10px] font-bold text-green-800">→ 출제 포인트</span>
                  <ul className="mt-1 space-y-0.5">
                    {para.exam_traps.map((trap, ti) => (
                      <li key={ti} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                        <span className="text-blue-400 shrink-0 mt-0.5">▸</span>
                        <span className="leading-snug">{trap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* ══ ④ 핵심 개념어 ═══════════════════════════════════════════════════ */}
      {(concepts.length > 0 || contrasts.length > 0 || persons.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">핵심 개념어</h3>
          <div className="flex flex-wrap gap-1.5">
            {persons.map((h, i) => (
              <span key={`p-${i}`} className="bg-pink-100 text-pink-800 border border-pink-200 text-xs px-2.5 py-1 rounded-full font-semibold">
                👤 {h.text}
              </span>
            ))}
            {concepts.map((h, i) => (
              <span key={i} className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs px-2.5 py-1 rounded-full font-medium">
                {h.text}
              </span>
            ))}
            {contrasts.map((h, i) => (
              <span key={`c-${i}`} className="bg-orange-100 text-orange-800 border border-orange-200 text-xs px-2.5 py-1 rounded-full font-medium">
                ↔ {h.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ══ ⑤ 전체 출제 예상 포인트 ════════════════════════════════════════ */}
      {exam_points.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">★ 전체 출제 예상 포인트</h3>
          <div className="space-y-2.5">
            {exam_points.map((ep, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[11px] font-black text-slate-400 shrink-0 w-4 text-right">{i + 1}.</span>
                <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold mt-0.5 ${EXAM_TYPE_COLOR[ep.type] ?? 'bg-gray-100 text-gray-600'}`}>
                  {ep.type}
                </span>
                <div>
                  <p className="text-gray-800 leading-snug text-[12px]">{ep.text}</p>
                  {ep.reason && (
                    <p className="text-[10px] text-gray-400 mt-0.5">{ep.reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
