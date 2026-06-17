import type { AnalysisResult, OxQuestion } from '@/types'
import { esc, processGuide, splitParagraphs, GOOGLE_FONTS } from './shared'

interface WorksheetHtmlParams {
  title: string
  subject: string
  year: number
  passageText: string
  analysis: AnalysisResult
  mode: 'student' | 'teacher'
}

export function generateWorksheetHtml(p: WorksheetHtmlParams): string {
  const paraTexts = splitParagraphs(p.passageText)
  const oxByPara = groupOxByPara(p.analysis.ox_questions ?? [])
  const isTeacher = p.mode === 'teacher'

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)} — ${isTeacher ? '교사용 정답지' : '학습지'}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="${GOOGLE_FONTS}" rel="stylesheet">
<style>
${worksheetCss()}
</style>
</head>
<body>

${headerHtml(p.title, p.subject, p.year, p.analysis, isTeacher)}

${instructionBar()}

${paragraphSectionsHtml(paraTexts, p.analysis, oxByPara, p.mode)}

${structureDiagramHtml(p.analysis)}

${examPointsHtml(p.analysis)}

${compareTableHtml(p.analysis, p.mode)}

<button class="save-btn no-print" onclick="window.print()">🖨️ 인쇄 / PDF 저장</button>

</body>
</html>`
}

// ── 헤더 바 ────────────────────────────────────────────────────────────────
function headerHtml(title: string, subject: string, year: number, analysis: AnalysisResult, isTeacher: boolean): string {
  const paraCount = analysis.paragraphs?.length ?? 0
  const style = esc(analysis.paragraphs?.[0]?.writing_style ?? '')
  const badgeClass = isTeacher ? 'version-badge teacher' : 'version-badge'
  const badgeLabel = isTeacher ? '교사용 정답지' : '학생용'
  return `<div class="header">
  <div class="header-left">방과후 ${esc(subject)}</div>
  <div class="header-title">${esc(title)}</div>
  <div class="header-info">
    <div><span class="label">문단</span> ${paraCount}</div>
    <div><span class="label">유형</span> ${style || esc(subject)}</div>
    <div><span class="${badgeClass}">${badgeLabel}</span></div>
    <div style="font-size:8pt;color:#888;">${year}학년도</div>
  </div>
</div>`
}

function instructionBar(): string {
  return `<div class="instruction">
  <span class="step-num">❶</span> 지문을 먼저 읽고 스스로 의미를 생각해 보세요 →
  <span class="step-num">❷</span> OX 퀴즈를 풀어 보세요 →
  <span class="step-num">❸</span> 읽기 가이드의 빈칸을 채워 보세요
</div>`
}

// ── 문단별 세트 ─────────────────────────────────────────────────────────────
function paragraphSectionsHtml(
  paraTexts: string[],
  analysis: AnalysisResult,
  oxByPara: Map<number, OxQuestion[]>,
  mode: 'student' | 'teacher'
): string {
  const paragraphs = analysis.paragraphs ?? []
  return paraTexts.map((text, i) => {
    const para = paragraphs[i]
    const paraNo = para?.no ?? (i + 1)
    const oxItems = oxByPara.get(paraNo) ?? []
    return `${paraSetHtml(paraNo, text, oxItems, para?.reading_guide, mode)}
<hr class="section-divider">`
  }).join('\n')
}

function paraSetHtml(
  no: number,
  text: string,
  oxItems: OxQuestion[],
  readingGuide: string | undefined,
  mode: 'student' | 'teacher'
): string {
  const isTeacher = mode === 'teacher'

  // 원문 단락: 행 구분 유지 (시) or 이어쓰기 (산문)
  const hasLineBreaks = text.includes('\n')
  const textStyle = hasLineBreaks ? 'white-space:pre-line;' : 'text-align:justify;'
  const escapedText = hasLineBreaks
    ? esc(text)
    : esc(text).replace(/\n/g, ' ')

  // OX 문항
  const oxHtml = oxItems.length > 0
    ? oxItems.map(q => oxItemHtml(q, mode)).join('')
    : '<p style="color:#aaa;font-size:8pt;">OX 문항이 없습니다.</p>'

  // 읽기 가이드
  const guideContent = readingGuide
    ? `<p>${processGuide(readingGuide, mode)}</p>`
    : `<p style="color:#aaa;font-size:8pt;">${isTeacher ? '(읽기 가이드 없음)' : '(재분석 후 생성됩니다)'}</p>`

  return `<div class="paragraph-section">
  <div class="main-col">
    <div style="margin-bottom:5px;">
      <span class="para-num">문단 ${no}</span>
      <span class="step-badge">❶</span>
    </div>
    <div class="original-text" style="${textStyle}">${escapedText}</div>
  </div>
  <div class="ox-col">
    <div class="ox-title"><span class="step-badge">❷</span> OX 퀴즈</div>
    ${oxHtml}
  </div>
</div>
<div class="reading-method">
  <div class="reading-method-title"><span class="step-badge">❸</span> 📖 읽기 가이드</div>
  ${guideContent}
</div>`
}

function oxItemHtml(q: OxQuestion, mode: 'student' | 'teacher'): string {
  const isTeacher = mode === 'teacher'
  const diffBadge = q.difficulty === 'hard' ? '★★★' : q.difficulty === 'medium' ? '★★' : '★'

  let answerPart = `<span class="ox-answer">( O , X )</span>`
  let explainPart = ''
  if (isTeacher) {
    const answerLabel = q.answer ? 'O' : 'X'
    const answerColor = q.answer ? '#2e7d32' : '#c62828'
    const trapTag = q.trap_type ? `<span class="trap-badge">[${esc(q.trap_type)}]</span>` : ''
    answerPart = `<span class="teacher-answer" style="color:${answerColor};font-size:10pt;margin-left:4px;">${answerLabel}</span>`
    explainPart = `<div class="teacher-note">${trapTag} ${esc(q.explanation)}</div>`
  }

  return `<div class="ox-item">
  <span class="ox-num">${q.id}.</span>
  <span class="ox-diff">${diffBadge}</span>
  ${esc(q.statement)} ${answerPart}
  ${explainPart}
</div>`
}

// ── 전체 구조도 ──────────────────────────────────────────────────────────────
function structureDiagramHtml(analysis: AnalysisResult): string {
  if (!analysis.paragraphs?.length) return ''
  const rows = analysis.paragraphs.map(p => {
    const tag = esc(p.function_tag ?? '')
    const rel = esc(p.relation_to_prev ?? '도입')
    const summary = esc(p.summary ?? '')
    return `<tr>
      <td style="text-align:center;font-weight:700;">${p.no}</td>
      <td><span class="struct-tag">${tag}</span></td>
      <td><span class="struct-rel">${rel}</span></td>
      <td style="font-size:8.5pt;">${summary}</td>
    </tr>`
  }).join('')

  return `<div class="summary-section">
  <h3>📊 전체 구조도</h3>
  <table class="comp-table">
    <thead>
      <tr>
        <th style="width:6%">단락</th>
        <th style="width:14%">기능</th>
        <th style="width:14%">관계</th>
        <th>내용 요약</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</div>`
}

// ── 출제 포인트 ──────────────────────────────────────────────────────────────
function examPointsHtml(analysis: AnalysisResult): string {
  if (!analysis.exam_points?.length) return ''
  const items = analysis.exam_points.map((ep, i) => `<div class="point-item">
  <p class="point-desc">
    <span class="point-label">포인트 ${i + 1}</span>
    <span class="point-type">${esc(ep.type)}</span>
    ${esc(ep.text)}
  </p>
  ${ep.reason ? `<p class="point-reason">↳ ${esc(ep.reason)}</p>` : ''}
</div>`).join('')

  return `<div class="point-section">
  <h3>🎯 출제 포인트</h3>
  ${items}
</div>`
}

// ── 비교표 ───────────────────────────────────────────────────────────────────
function compareTableHtml(analysis: AnalysisResult, mode: 'student' | 'teacher'): string {
  if (!analysis.compare_cards?.length) return ''
  const isTeacher = mode === 'teacher'
  return analysis.compare_cards.map(card => {
    const rows = card.comparison_points.map(pt => {
      const aVal = isTeacher ? esc(pt.a_value) : `<span class="blank-long"></span>`
      const bVal = isTeacher ? esc(pt.b_value) : `<span class="blank-long"></span>`
      return `<tr>
        <td style="font-weight:600;background:#f8f9fa;">${esc(pt.aspect)}</td>
        <td>${aVal}</td>
        <td>${bVal}</td>
      </tr>`
    }).join('')
    return `<div class="summary-section">
  <h3>📋 비교표: ${esc(card.person_a)} vs ${esc(card.person_b)}</h3>
  <table class="comp-table">
    <thead><tr><th>기준</th><th>${esc(card.person_a)}</th><th>${esc(card.person_b)}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`
  }).join('')
}

// ── OX 그룹핑 ────────────────────────────────────────────────────────────────
function groupOxByPara(questions: OxQuestion[]): Map<number, OxQuestion[]> {
  const map = new Map<number, OxQuestion[]>()
  for (const q of questions) {
    if (!map.has(q.paragraph_no)) map.set(q.paragraph_no, [])
    map.get(q.paragraph_no)!.push(q)
  }
  return map
}

// ── CSS ─────────────────────────────────────────────────────────────────────
function worksheetCss(): string {
  return `
@page {
  size: A4;
  margin: 15mm 12mm 15mm 12mm;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 9.5pt; line-height: 1.65; color: #1a1a1a;
  max-width: 210mm; margin: 0 auto; padding: 16px;
}

/* 헤더 */
.header {
  display: flex; align-items: stretch;
  border: 2px solid #000; margin-bottom: 8px;
}
.header-left {
  background: #1a1a1a; color: #fff;
  padding: 6px 12px; font-weight: bold; font-size: 9pt;
  white-space: nowrap; display: flex; align-items: center;
}
.header-title {
  flex: 1; padding: 6px 12px; font-size: 10.5pt; font-weight: bold;
  display: flex; align-items: center; border-right: 1px solid #ccc;
}
.header-info {
  display: flex; align-items: center; font-size: 8.5pt;
}
.header-info div { padding: 6px 10px; border-left: 1px solid #ccc; }
.header-info .label { color: #888; margin-right: 4px; }
.version-badge {
  background: #1565c0; color: #fff; font-size: 7.5pt;
  padding: 2px 6px; border-radius: 2px; font-weight: bold;
}
.version-badge.teacher { background: #c62828; }

/* 안내 바 */
.instruction {
  background: #fffde7; border-left: 3px solid #f9a825;
  padding: 5px 10px; margin-bottom: 12px; font-size: 8.5pt; color: #555;
}
.step-num { color: #c62828; font-weight: bold; font-size: 10pt; }
.step-badge { color: #c62828; font-weight: bold; font-size: 10pt; margin-right: 4px; }

/* 문단 세트 */
.paragraph-section { display: flex; gap: 0; margin-bottom: 10px; }
.main-col { flex: 7; padding-right: 10px; border-right: 1px dashed #ccc; }
.ox-col { flex: 3; padding-left: 10px; font-size: 8.5pt; }

.para-num {
  display: inline-block; background: #1a5276; color: #fff;
  font-weight: bold; font-size: 9pt; padding: 1px 8px;
  border-radius: 3px; margin-right: 4px;
}
.original-text {
  background: #fafafa; border: 1px solid #e0e0e0; border-radius: 3px;
  padding: 8px 10px; font-size: 9pt; line-height: 1.75;
  page-break-inside: avoid;
  font-family: 'Noto Serif KR', serif;
}

/* OX */
.ox-title {
  font-weight: bold; font-size: 9pt; color: #c62828;
  margin-bottom: 6px; border-bottom: 2px solid #ef9a9a; padding-bottom: 2px;
}
.ox-item { margin-bottom: 7px; font-size: 8.3pt; line-height: 1.55; page-break-inside: avoid; }
.ox-num { font-weight: bold; color: #c62828; margin-right: 2px; }
.ox-diff { font-size: 7pt; color: #f9a825; margin-right: 3px; }
.ox-answer { color: #999; font-size: 8pt; }
.teacher-answer { font-weight: bold; }
.teacher-note {
  background: #e3f2fd; border-left: 2px solid #1565c0;
  padding: 3px 6px; margin-top: 2px; font-size: 7.5pt; color: #1565c0; line-height: 1.5;
}
.trap-badge {
  display: inline-block; background: #c62828; color: #fff;
  font-size: 7pt; padding: 1px 4px; border-radius: 2px;
  font-family: 'IBM Plex Mono', monospace; margin-right: 3px;
}

/* 읽기 가이드 */
.reading-method {
  background: #e8f5e9; border: 1px solid #a5d6a7; border-radius: 3px;
  padding: 7px 10px; margin-bottom: 8px;
}
.reading-method-title {
  font-weight: bold; font-size: 9pt; color: #2e7d32; margin-bottom: 4px;
}
.reading-method p { font-size: 8.5pt; color: #333; line-height: 1.75; }

/* 빈칸 */
.blank {
  display: inline-block; border-bottom: 1.5px solid #1a5276;
  min-width: 55px; height: 1em; vertical-align: bottom; margin: 0 2px;
}
.blank-long {
  display: inline-block; border-bottom: 1.5px solid #1a5276;
  min-width: 90px; height: 1em; vertical-align: bottom; margin: 0 2px;
}

/* 구분선 */
.section-divider { border: none; border-top: 1px solid #ddd; margin: 10px 0; }

/* 구조도/비교표 */
.summary-section { margin-top: 14px; margin-bottom: 14px; }
.summary-section h3 {
  font-size: 10pt; color: #1a5276;
  border-bottom: 2px solid #1a5276; padding-bottom: 3px; margin-bottom: 8px;
}
.comp-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
.comp-table th {
  background: #1a5276; color: #fff; padding: 5px 6px;
  text-align: center; border: 1px solid #1a5276; font-size: 8pt;
}
.comp-table td { padding: 4px 6px; border: 1px solid #ccc; }
.comp-table tr:nth-child(even) td { background: #f8f9fa; }
.struct-tag {
  display: inline-block; background: #1a1a1a; color: #fff;
  font-size: 7.5pt; padding: 1px 6px; border-radius: 10px;
}
.struct-rel {
  display: inline-block; background: #e8f5e9; color: #2e7d32;
  font-size: 7.5pt; padding: 1px 6px; border-radius: 3px; border: 1px solid #a5d6a7;
}

/* 출제 포인트 */
.point-section { margin-top: 14px; }
.point-section h3 {
  font-size: 10pt; color: #1a5276;
  border-bottom: 2px solid #1a5276; padding-bottom: 3px; margin-bottom: 8px;
}
.point-item {
  background: #fff; border: 1px solid #e0e0e0; border-radius: 3px;
  padding: 7px 10px; margin-bottom: 6px; font-size: 8.5pt;
}
.point-label {
  display: inline-block; background: #c62828; color: #fff;
  font-size: 7.5pt; padding: 1px 6px; border-radius: 2px;
  font-weight: bold; margin-right: 6px;
}
.point-type {
  display: inline-block; background: #f0f4f8; color: #1a5276;
  font-size: 7.5pt; padding: 1px 6px; border-radius: 2px; margin-right: 6px;
}
.point-reason { color: #1565c0; font-size: 8pt; margin-top: 3px; margin-left: 12px; }

/* 인쇄 버튼 */
.save-btn {
  position: fixed; bottom: 20px; right: 20px;
  background: #1565c0; color: #fff; border: none;
  padding: 10px 20px; border-radius: 6px; cursor: pointer;
  font-size: 11pt; font-weight: bold; font-family: 'Noto Sans KR', sans-serif;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.save-btn:hover { background: #0d47a1; }

@media print {
  .no-print { display: none !important; }
  body { max-width: none; padding: 0; }
  .paragraph-section { page-break-inside: avoid; }
  .original-text { page-break-inside: avoid; }
  .ox-item { page-break-inside: avoid; }
}`
}
