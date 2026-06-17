import type { AnalysisResult } from '@/types'
import { esc, splitParagraphs, GOOGLE_FONTS } from './shared'

interface AnalysisHtmlParams {
  title: string
  subject: string
  year: number
  passageText: string
  analysis: AnalysisResult
}

export function generateAnalysisHtml(p: AnalysisHtmlParams): string {
  const paraTexts = splitParagraphs(p.passageText)

  const coverBadge = `[${esc(p.subject)}]`
  const keywords = p.analysis.macro?.topic ? [p.analysis.macro.topic] : []
  p.analysis.paragraphs?.slice(0, 3).forEach(para =>
    (para.keywords ?? []).slice(0, 2).forEach(k => { if (!keywords.includes(k)) keywords.push(k) })
  )

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)} — 원문 정밀분석</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="${GOOGLE_FONTS}" rel="stylesheet">
<style>
${analysisCss()}
</style>
</head>
<body>

${coverHtml(p.title, coverBadge, p.year, keywords, p.analysis.macro?.main_idea)}

${compareTableHtml(p.analysis)}

${passageBlockHtml(p.passageText)}

${analysisBlocksHtml(p.analysis, paraTexts)}

<button class="save-btn no-print" onclick="window.print()">🖨️ 인쇄 / PDF 저장</button>

</body>
</html>`
}

function coverHtml(title: string, badge: string, year: number, keywords: string[], mainIdea?: string): string {
  const tags = keywords.slice(0, 5).map(k => `<span class="tag">${esc(k)}</span>`).join('')
  return `<div class="cover">
  <div class="cover-brand">원문 정밀분석</div>
  <div class="cover-badge">${esc(badge)}</div>
  <h1 class="cover-title">${esc(title)}</h1>
  <div class="cover-subtitle">${esc(String(year))}학년도</div>
  ${mainIdea ? `<p class="cover-idea">${esc(mainIdea)}</p>` : ''}
  <div class="cover-tags">${tags}</div>
</div>`
}

function passageBlockHtml(passageText: string): string {
  const escaped = esc(passageText)
    .replace(/\n\n+/g, '</p><p class="passage-para">')
    .replace(/\n/g, '<br>')
  return `<div class="passage-block">
  <div class="block-label passage-label">지문</div>
  <div class="passage-text"><p class="passage-para">${escaped}</p></div>
</div>`
}

function compareTableHtml(analysis: AnalysisResult): string {
  if (!analysis.compare_cards?.length) return ''
  return analysis.compare_cards.map(card => {
    const rows = card.comparison_points.map(pt =>
      `<tr><td class="comp-aspect">${esc(pt.aspect)}</td><td>${esc(pt.a_value)}</td><td>${esc(pt.b_value)}</td></tr>`
    ).join('')
    return `<div class="compare-section">
  <h2 class="section-title">📋 개념 비교: ${esc(card.person_a)} vs ${esc(card.person_b)}</h2>
  <table class="comp-table">
    <thead><tr><th>비교 기준</th><th>${esc(card.person_a)}</th><th>${esc(card.person_b)}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`
  }).join('')
}

function analysisBlocksHtml(analysis: AnalysisResult, paraTexts: string[]): string {
  if (!analysis.paragraphs?.length) return ''
  return analysis.paragraphs.map((para, i) => {
    const paraText = paraTexts[i] ?? ''
    const connectiveRows = (para.connective_analysis ?? []).map(c =>
      `<li><strong class="conn-word">${esc(c.word)}</strong><span class="conn-role">${esc(c.role)}</span> — ${esc(c.explanation)}</li>`
    ).join('')
    const trapItems = (para.exam_traps ?? []).map(t =>
      `<li class="trap-item"><span class="trap-icon">⚠</span> ${esc(t)}</li>`
    ).join('')

    return `<div class="analysis-block">
  <div class="block-label analysis-label">해설 — 문단 ${para.no}</div>
  <div class="analysis-content">
    ${para.function_tag ? `<span class="function-tag">${esc(para.function_tag)}</span>` : ''}
    ${para.writing_style ? `<p><span class="field-label">서술방식</span>${esc(para.writing_style)}</p>` : ''}
    ${para.function ? `<p><span class="field-label">문단 기능</span>${esc(para.function)}</p>` : ''}
    ${i > 0 && para.relation_explanation ? `<p><span class="field-label">앞 단락 연결</span>${esc(para.relation_explanation)}</p>` : ''}
    ${para.logical_structure ? `<p><span class="field-label">논리 구조</span>${esc(para.logical_structure)}</p>` : ''}
    ${connectiveRows ? `<p class="field-label">접속어·지시어</p><ul class="conn-list">${connectiveRows}</ul>` : ''}
    ${para.core_sentence ? `<p class="core-sentence"><span class="field-label">핵심 문장</span>"${esc(para.core_sentence)}"</p>` : ''}
    ${trapItems ? `<p class="field-label trap-label">출제 포인트</p><ul class="trap-list">${trapItems}</ul>` : ''}
  </div>
</div>
${i < (analysis.paragraphs?.length ?? 0) - 1 ? '<hr class="section-divider">' : ''}`
  }).join('\n')
}

function analysisCss(): string {
  return `
@page { size: A4; margin: 15mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 10pt; line-height: 1.7; color: #1a1a1a;
  max-width: 210mm; margin: 0 auto; padding: 20px;
}

/* 커버 */
.cover {
  background: #1a1a1a; color: #fff; padding: 60px 40px;
  text-align: center; margin-bottom: 30px; border-radius: 4px;
  page-break-after: always;
}
.cover-brand { font-size: 9pt; color: #888; letter-spacing: 3px; margin-bottom: 16px; }
.cover-badge {
  display: inline-block; border: 1px solid #2e7d32; color: #4caf50;
  padding: 4px 16px; font-size: 10pt; margin-bottom: 20px; border-radius: 3px;
}
.cover-title {
  font-family: 'Noto Serif KR', serif; font-size: 36px;
  margin-bottom: 8px; line-height: 1.3;
}
.cover-subtitle { font-size: 11pt; color: #aaa; margin-bottom: 8px; }
.cover-idea { font-size: 10pt; color: #ccc; margin-bottom: 16px; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.6; }
.cover-tags { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 8px; }
.tag {
  font-family: 'IBM Plex Mono', monospace; font-size: 11px;
  padding: 2px 8px; border-radius: 3px;
  background: rgba(46,125,50,0.25); color: #81c784;
}

/* 블록 라벨 */
.block-label {
  display: inline-block; padding: 2px 10px; font-size: 9pt;
  font-weight: bold; color: #fff; border-radius: 3px 3px 0 0; margin-bottom: 0;
}
.passage-label { background: #1a1a1a; }
.analysis-label { background: #2e7d32; }

/* 지문 블록 */
.passage-block {
  background: #fff; border-left: 4px solid #1a1a1a;
  padding: 12px 16px; margin-bottom: 24px;
}
.passage-text {
  font-family: 'Noto Serif KR', serif;
  font-size: 10.5pt; line-height: 2.0; text-align: justify;
}
.passage-para { margin-bottom: 1em; }
.passage-para:last-child { margin-bottom: 0; }

/* 해설 블록 */
.analysis-block {
  background: #f0ede6; border-left: 4px solid #2e7d32;
  padding: 12px 16px; margin-bottom: 4px;
}
.analysis-content { font-size: 9.5pt; line-height: 1.8; }
.analysis-content p { margin-bottom: 6px; }

/* 필드 라벨 */
.field-label {
  display: inline-block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 8pt; font-weight: 700;
  background: #2e7d32; color: #fff;
  padding: 1px 6px; border-radius: 2px; margin-right: 6px;
}
.function-tag {
  display: inline-block; font-size: 8pt; font-weight: 700;
  background: #1a1a1a; color: #fff;
  padding: 1px 8px; border-radius: 10px; margin-bottom: 8px;
}

/* 접속어 리스트 */
.conn-list { list-style: none; margin: 4px 0 6px 8px; }
.conn-list li { font-size: 9pt; margin-bottom: 3px; }
.conn-word { color: #1565c0; margin-right: 4px; }
.conn-role {
  font-family: 'IBM Plex Mono', monospace; font-size: 8pt;
  background: rgba(21,101,192,0.1); color: #1565c0;
  padding: 0 4px; border-radius: 2px; margin-right: 4px;
}

/* 핵심 문장 */
.core-sentence {
  background: rgba(198,40,40,0.06); border-left: 3px solid #c62828;
  padding: 4px 8px; margin-top: 6px; font-size: 9pt;
}

/* 출제 포인트 */
.trap-label { color: #c62828 !important; }
.trap-label.field-label { background: #c62828; }
.trap-list { list-style: none; margin: 4px 0 0 8px; }
.trap-item { font-size: 9pt; margin-bottom: 4px; color: #b71c1c; }
.trap-icon { margin-right: 4px; }

/* 비교표 */
.compare-section { margin-bottom: 24px; }
.section-title {
  font-size: 11pt; color: #1a5276;
  border-bottom: 2px solid #1a5276; padding-bottom: 4px; margin-bottom: 10px;
}
.comp-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 6px; }
.comp-table th {
  background: #1a5276; color: #fff; padding: 6px 8px;
  text-align: center; font-size: 8.5pt; font-weight: bold;
  border: 1px solid #1a5276;
}
.comp-table td { padding: 5px 8px; border: 1px solid #ccc; }
.comp-aspect { font-weight: 600; background: #f8f9fa; }
.comp-table tr:nth-child(even) td { background: #f5f5f5; }

/* 구분선 */
.section-divider { border: none; border-top: 1px solid #ddd; margin: 12px 0; }

/* 인쇄 버튼 */
.save-btn {
  position: fixed; bottom: 20px; right: 20px;
  background: #2e7d32; color: #fff; border: none;
  padding: 10px 20px; border-radius: 6px; cursor: pointer;
  font-size: 11pt; font-weight: bold; font-family: 'Noto Sans KR', sans-serif;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.save-btn:hover { background: #1b5e20; }

@media print {
  .no-print { display: none !important; }
  body { max-width: none; padding: 0; }
  .passage-block { page-break-inside: avoid; }
  .analysis-block { page-break-inside: avoid; }
}`
}
