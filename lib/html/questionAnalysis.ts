import type { AnalysisResult, QuestionEvidence } from '@/types'
import { esc, GOOGLE_FONTS } from './shared'

interface QuestionsHtmlParams {
  title: string
  subject: string
  year: number
  passageText: string
  analysis: AnalysisResult
  questionsText?: string
}

const Q_COLORS = ['#1565c0', '#2e7d32', '#e65100', '#6a1b9a', '#b71c1c']

export function generateQuestionsHtml(p: QuestionsHtmlParams): string {
  const evidences = p.analysis.question_evidences ?? []
  const annotatedPassage = buildAnnotatedPassage(p.passageText, evidences)
  const legendItems = buildLegend(evidences)
  const evidenceTable = buildEvidenceTable(evidences)

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)} — 문항 풀이</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="${GOOGLE_FONTS}" rel="stylesheet">
<style>
${questionsCss()}
</style>
</head>
<body>

<div class="page-header">
  <div class="header-badge">[${esc(p.subject)}] ${esc(String(p.year))}학년도</div>
  <h1 class="header-title">${esc(p.title)}</h1>
  <div class="header-sub">문항 풀이 — 선지 근거 분석</div>
</div>

<div class="legend">
  <span class="legend-title">범례</span>
  ${legendItems}
</div>

<div class="passage-block">
  <div class="block-label">지문 (선지 근거 표시)</div>
  <div class="passage-text">${annotatedPassage}</div>
</div>

${p.questionsText ? `<div class="questions-block"><div class="block-label">수능 문제</div><pre class="questions-pre">${esc(p.questionsText)}</pre></div>` : ''}

${evidenceTable}

<button class="save-btn no-print" onclick="window.print()">🖨️ 인쇄 / PDF 저장</button>

</body>
</html>`
}

function buildAnnotatedPassage(text: string, evidences: QuestionEvidence[]): string {
  type Span = { start: number; end: number; label: string; qno: number }
  const spans: Span[] = []

  for (const ev of evidences) {
    if (!ev.text?.trim()) continue
    const idx = text.indexOf(ev.text)
    if (idx === -1) continue
    spans.push({ start: idx, end: idx + ev.text.length, label: `${ev.question_no}-${ev.choice_no}`, qno: ev.question_no })
  }

  // Sort by start, then deduplicate overlaps (first wins)
  spans.sort((a, b) => a.start - b.start || a.qno - b.qno)

  let html = ''
  let cursor = 0
  for (const sp of spans) {
    if (sp.start < cursor) continue
    const colorIdx = (sp.qno - 1) % Q_COLORS.length
    html += escapePassage(text.slice(cursor, sp.start))
    html += `<span class="ev-span q${colorIdx}"><span class="ev-label">${esc(sp.label)}</span>${escapePassage(text.slice(sp.start, sp.end))}</span>`
    cursor = sp.end
  }
  html += escapePassage(text.slice(cursor))
  return `<p class="p-text">${html.replace(/\n\n+/g, '</p><p class="p-text">').replace(/\n/g, '<br>')}</p>`
}

function escapePassage(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildLegend(evidences: QuestionEvidence[]): string {
  const qnos = [...new Set(evidences.map(e => e.question_no))].sort((a, b) => a - b)
  return qnos.map(qno => {
    const colorIdx = (qno - 1) % Q_COLORS.length
    return `<span class="legend-chip q${colorIdx}">${qno}번</span>`
  }).join('')
}

function buildEvidenceTable(evidences: QuestionEvidence[]): string {
  if (!evidences.length) return ''

  // Group by question_no
  const grouped = new Map<number, QuestionEvidence[]>()
  for (const ev of evidences) {
    if (!grouped.has(ev.question_no)) grouped.set(ev.question_no, [])
    grouped.get(ev.question_no)!.push(ev)
  }

  const sections = [...grouped.entries()].sort(([a], [b]) => a - b).map(([qno, evs]) => {
    const colorIdx = (qno - 1) % Q_COLORS.length
    const rows = evs.map(ev =>
      `<tr>
  <td class="ev-choice q${colorIdx}-bg">${esc(ev.choice_no)}</td>
  <td class="ev-quote">"${esc(ev.text)}"</td>
</tr>`
    ).join('')
    return `<div class="ev-section">
  <div class="ev-section-title q${colorIdx}-title">${qno}번 문항 — 근거 구절</div>
  <table class="ev-table">
    <thead><tr><th>선지</th><th>근거 구절</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`
  })

  return `<div class="evidence-area">
  <h2 class="area-title">선지별 근거 정리</h2>
  ${sections.join('')}
</div>`
}

function questionsCss(): string {
  const colorVars = Q_COLORS.map((c, i) => `
.q${i} { background: ${c}22; border-bottom: 2px solid ${c}; }
.ev-label { background: ${c}; }
.legend-chip.q${i} { background: ${c}22; color: ${c}; border: 1px solid ${c}88; }
.q${i}-bg { color: ${c}; font-weight: 700; }
.q${i}-title { border-left-color: ${c}; color: ${c}; }
`).join('')

  return `
@page { size: A4; margin: 15mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 10pt; line-height: 1.7; color: #1a1a1a;
  max-width: 210mm; margin: 0 auto; padding: 20px;
}

/* 헤더 */
.page-header { text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #1a1a1a; }
.header-badge { font-size: 9pt; color: #666; margin-bottom: 6px; }
.header-title { font-family: 'Noto Serif KR', serif; font-size: 22pt; margin-bottom: 4px; }
.header-sub { font-size: 9pt; color: #888; }

/* 범례 */
.legend { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
.legend-title { font-size: 8pt; font-weight: 700; color: #666; margin-right: 4px; }
.legend-chip { font-size: 8pt; font-weight: 700; padding: 2px 8px; border-radius: 10px; }

/* 지문 블록 */
.block-label {
  display: inline-block; background: #1a1a1a; color: #fff;
  font-size: 8.5pt; font-weight: bold; padding: 2px 10px;
  border-radius: 3px 3px 0 0; margin-bottom: 0;
}
.passage-block { border: 1px solid #ddd; border-top: none; padding: 16px; margin-bottom: 20px; }
.passage-text { font-family: 'Noto Serif KR', serif; font-size: 10.5pt; line-height: 2.0; text-align: justify; }
.p-text { margin-bottom: 1em; }
.p-text:last-child { margin-bottom: 0; }

/* 근거 하이라이트 */
.ev-span { border-radius: 2px; position: relative; padding: 0 2px; }
.ev-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 7pt; font-weight: bold; color: #fff;
  padding: 0 3px; border-radius: 2px;
  vertical-align: super; margin-right: 1px; line-height: 1;
}

${colorVars}

/* 수능 문제 */
.questions-block { margin-bottom: 20px; }
.questions-pre { font-family: 'Noto Sans KR', sans-serif; font-size: 9pt; white-space: pre-wrap; line-height: 1.8; padding: 12px; background: #f9f9f9; border: 1px solid #e0e0e0; }

/* 근거 정리 테이블 */
.evidence-area { margin-top: 24px; }
.area-title { font-size: 12pt; font-weight: bold; border-bottom: 2px solid #1a1a1a; padding-bottom: 6px; margin-bottom: 16px; }
.ev-section { margin-bottom: 20px; page-break-inside: avoid; }
.ev-section-title { font-size: 10pt; font-weight: bold; border-left: 4px solid; padding-left: 8px; margin-bottom: 8px; }
.ev-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
.ev-table th { background: #f5f5f5; padding: 5px 10px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt; }
.ev-table td { padding: 6px 10px; border: 1px solid #ddd; vertical-align: top; }
.ev-choice { text-align: center; width: 60px; font-size: 11pt; }
.ev-quote { font-family: 'Noto Serif KR', serif; color: #333; }

/* 인쇄 버튼 */
.save-btn {
  position: fixed; bottom: 20px; right: 20px;
  background: #1a1a1a; color: #fff; border: none;
  padding: 10px 20px; border-radius: 6px; cursor: pointer;
  font-size: 11pt; font-weight: bold; font-family: 'Noto Sans KR', sans-serif;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.save-btn:hover { background: #333; }
@media print {
  .no-print { display: none !important; }
  body { max-width: none; padding: 0; }
}`
}
