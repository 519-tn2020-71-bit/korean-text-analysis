'use client'

import type { AnalysisResult } from '@/types'

const FUNCTION_TAG_STYLE: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  정의:   { bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd', icon: '□' },
  예시:   { bg: '#f0fdf4', text: '#15803d', border: '#86efac', icon: '◇' },
  인과:   { bg: '#fffbeb', text: '#92400e', border: '#fcd34d', icon: '→' },
  대조:   { bg: '#fff7ed', text: '#c2410c', border: '#fdba74', icon: '↔' },
  열거:   { bg: '#faf5ff', text: '#6d28d9', border: '#c4b5fd', icon: '▪' },
  부연:   { bg: '#f8fafc', text: '#374151', border: '#cbd5e1', icon: '…' },
  주장:   { bg: '#fef2f2', text: '#b91c1c', border: '#fca5a5', icon: '★' },
  근거:   { bg: '#ecfeff', text: '#0e7490', border: '#67e8f9', icon: '→' },
  결론:   { bg: '#f0fdf4', text: '#166534', border: '#4ade80', icon: '✓' },
}

const RELATION_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  도입: { label: '도입', color: '#6366f1', bg: '#eef2ff' },
  전환: { label: '↩ 전환', color: '#d97706', bg: '#fffbeb' },
  부연: { label: '⋯ 부연', color: '#64748b', bg: '#f1f5f9' },
  대조: { label: '↔ 대조', color: '#dc2626', bg: '#fef2f2' },
  예시: { label: '◇ 예시', color: '#16a34a', bg: '#f0fdf4' },
  근거: { label: '→ 근거', color: '#0891b2', bg: '#ecfeff' },
  결론: { label: '✓ 결론', color: '#7c3aed', bg: '#f5f3ff' },
}

const EXAM_TYPE_COLOR: Record<string, string> = {
  추론: 'bg-purple-100 text-purple-700',
  어휘: 'bg-amber-100 text-amber-700',
  구조파악: 'bg-blue-100 text-blue-700',
  적용: 'bg-green-100 text-green-700',
  사실확인: 'bg-gray-100 text-gray-600',
}

interface InfographicViewProps {
  analysis: AnalysisResult
  passageId?: string
  onSvgGenerated?: (svg: string) => void
}

export default function InfographicView({ analysis }: InfographicViewProps) {
  const { macro, paragraphs = [], highlights = [], exam_points = [], compare_cards = [] } = analysis

  const concepts = highlights.filter(h => h.color === 'yellow').slice(0, 14)
  const contrasts = highlights.filter(h => h.color === 'orange').slice(0, 6)
  const persons = highlights.filter(h => h.color === 'pink')

  return (
    <div className="space-y-4 text-sm">

      {/* ① 전체 요약 헤더 */}
      <div className="rounded-2xl overflow-hidden border border-indigo-200 shadow-sm">
        <div className="bg-indigo-600 px-5 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-indigo-200 text-[10px] font-semibold uppercase tracking-widest mb-0.5">화제</p>
              <h2 className="text-white font-extrabold text-lg leading-tight">{macro.topic}</h2>
            </div>
            <div className="flex flex-col gap-1 items-end shrink-0">
              <span className="bg-indigo-500/70 text-indigo-100 text-[10px] px-2.5 py-1 rounded-full font-medium">{macro.text_type}</span>
              <span className="bg-indigo-500/70 text-indigo-100 text-[10px] px-2.5 py-1 rounded-full font-medium">{macro.structure}</span>
            </div>
          </div>
        </div>
        <div className="bg-indigo-50 px-5 py-3 border-t border-indigo-200">
          <p className="text-indigo-900 leading-relaxed font-medium">{macro.main_idea}</p>
        </div>
      </div>

      {/* ② 단락별 논리 흐름 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">논리 흐름</h3>
        <div className="space-y-1">
          {paragraphs.map((para, i) => {
            const style = FUNCTION_TAG_STYLE[para.function_tag] ?? FUNCTION_TAG_STYLE.부연
            const relKey = para.relation_to_prev ?? (i === 0 ? '도입' : '부연')
            const rel = RELATION_STYLE[relKey] ?? RELATION_STYLE.부연

            return (
              <div key={para.no}>
                {/* 단락 연결 화살표 (첫 단락 제외) */}
                {i > 0 && (
                  <div className="flex items-center justify-center py-1.5 gap-2">
                    <div className="h-px flex-1 bg-gray-100" />
                    <span
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                      style={{ color: rel.color, backgroundColor: rel.bg }}
                    >
                      {rel.label}
                    </span>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                )}

                {/* 단락 카드 */}
                <div
                  className="rounded-xl px-4 py-3"
                  style={{ backgroundColor: style.bg, borderLeft: `4px solid ${style.border}` }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                      style={{ backgroundColor: style.text }}
                    >
                      {para.no}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ color: style.text, backgroundColor: style.border + '55' }}
                    >
                      {style.icon} {para.function_tag}
                    </span>
                    {para.keywords?.length > 0 && (
                      <span className="text-[10px] text-gray-400 truncate">
                        {para.keywords.join(' · ')}
                      </span>
                    )}
                  </div>

                  {/* 핵심 문장 */}
                  <p className="text-xs font-semibold leading-relaxed mb-1" style={{ color: style.text }}>
                    {para.core_sentence}
                  </p>

                  {/* 상세 요약 (있으면) */}
                  {para.summary && (
                    <p className="text-[11px] leading-relaxed text-gray-600 mt-1.5 pt-1.5 border-t" style={{ borderColor: style.border + '66' }}>
                      {para.summary}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ③ 비교대조 카드 (있으면 두드러지게) */}
      {compare_cards.map((card, ci) => (
        <div key={ci} className="bg-white border-2 border-orange-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">↔ 핵심 대조</span>
          </div>
          {/* 두 대상 헤더 */}
          <div className="grid grid-cols-[1fr_36px_1fr] gap-2 items-center mb-3">
            <div className="bg-blue-600 text-white rounded-xl px-3 py-2.5 text-center">
              <p className="font-extrabold text-sm">{card.person_a}</p>
            </div>
            <div className="text-2xl font-black text-gray-300 text-center">↔</div>
            <div className="bg-rose-600 text-white rounded-xl px-3 py-2.5 text-center">
              <p className="font-extrabold text-sm">{card.person_b}</p>
            </div>
          </div>

          {/* 비교 항목들 */}
          <div className="space-y-2">
            {card.comparison_points.map((pt, pi) => (
              <div key={pi}>
                <p className="text-[10px] font-bold text-gray-400 text-center mb-1">{pt.aspect}</p>
                <div className="grid grid-cols-[1fr_1fr] gap-1.5 text-xs">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-blue-800 leading-snug">{pt.a_value}</div>
                  <div className="bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 text-rose-800 leading-snug">{pt.b_value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ④ 핵심 개념어 */}
      {(concepts.length > 0 || contrasts.length > 0 || persons.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
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

      {/* ⑤ 출제 예상 포인트 */}
      {exam_points.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">출제 예상 포인트</h3>
          <div className="space-y-2">
            {exam_points.map((ep, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold mt-0.5 ${EXAM_TYPE_COLOR[ep.type] ?? 'bg-gray-100 text-gray-600'}`}>
                  {ep.type}
                </span>
                <div>
                  <p className="text-gray-800 leading-snug text-xs">{ep.text}</p>
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
