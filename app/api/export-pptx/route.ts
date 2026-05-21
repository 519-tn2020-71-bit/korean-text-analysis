export const runtime = 'nodejs'   // pptxgenjs requires Node.js (not Edge)
export const maxDuration = 60     // 복잡한 PPT 생성 시 시간 여유

import { NextResponse } from 'next/server'
import PptxGenJS from 'pptxgenjs'
import type { AnalysisResult, Paragraph, Annotation } from '@/types'

// ── Color palette (NO # prefix) ──────────────────────────────────────────────
const C = {
  BG:           'FFFDF5',   // 따뜻한 크림 배경
  COVER_BG:     '1E2761',   // 커버: 딥 네이비
  COVER_STRIP:  'F96167',   // 커버 악센트: 코랄
  HEADER_BG:    '1E2761',   // 슬라이드 헤더 배경
  HEADER_TEXT:  'FFFFFF',
  TITLE_TEXT:   '1E2761',
  BODY_TEXT:    '1C1917',
  MUTED:        '78716C',
  WHITE:        'FFFFFF',
  GRAY_LIGHT:   'F5F5F4',
  GRAY_BORDER:  'E7E5E4',

  // 기능 태그 색
  TAG: {
    정의: { bg: 'DBEAFE', text: '1D4ED8' },
    예시: { bg: 'DCFCE7', text: '15803D' },
    인과: { bg: 'FEF9C3', text: '92400E' },
    대조: { bg: 'FEE2E2', text: 'B91C1C' },
    열거: { bg: 'F3E8FF', text: '6D28D9' },
    부연: { bg: 'F5F5F4', text: '57534E' },
    주장: { bg: 'FEE2E2', text: '991B1B' },
    근거: { bg: 'CFFAFE', text: '0E7490' },
    결론: { bg: 'DCFCE7', text: '166534' },
  } as Record<string, { bg: string; text: string }>,

  // 관계 태그 색
  REL: {
    도입: 'A5B4FC',
    부연: 'CBD5E1',
    대조: 'FCA5A5',
    전환: 'FCD34D',
    예시: '86EFAC',
    근거: '67E8F9',
    결론: 'C4B5FD',
  } as Record<string, string>,

  // 주석 심볼 색
  SYM: {
    '○': '1D4ED8',
    '□': '0E7490',
    '→': '92400E',
    '↔': 'B91C1C',
    '★': '7C3AED',
    '△': 'D97706',
    '◇': '15803D',
  } as Record<string, string>,
}

function makeShadow() {
  return { type: 'outer' as const, color: '000000', opacity: 0.08, blur: 4, offset: 2, angle: 135 }
}

// ── 단락 텍스트 분리 ──────────────────────────────────────────────────────────
function splitParagraphs(text: string): string[] {
  let ps = text.split(/\n\n+/).filter(p => p.trim())
  if (ps.length <= 1 && text.includes('\n')) {
    ps = text.split(/\n/).filter(p => p.trim())
  }
  return ps
}

// ── 단락에 속한 주석 추출 ──────────────────────────────────────────────────────
function getParaAnnotations(paraText: string, allAnnotations: Annotation[]): Annotation[] {
  return allAnnotations.filter(a => paraText.includes(a.text)).slice(0, 6)
}

// ── 단락에 속한 마진 노트 ─────────────────────────────────────────────────────
function getParaMarginNotes(paraNo: number, analysis: AnalysisResult) {
  return (analysis.margin_notes ?? []).filter(n => n.paragraph_no === paraNo)
}

// ── 슬라이드 1: 표지 ──────────────────────────────────────────────────────────
function addCoverSlide(pres: PptxGenJS, title: string, year: number | string, subject: string, analysis: AnalysisResult) {
  const slide = pres.addSlide()
  slide.background = { color: C.COVER_BG }

  // 왼쪽 코랄 세로 띠
  slide.addShape('rect', {
    x: 0, y: 0, w: 0.22, h: 5.625,
    fill: { color: C.COVER_STRIP },
    line: { color: C.COVER_STRIP },
  })

  // 과목/연도 배지
  slide.addShape('rect', {
    x: 0.5, y: 0.5, w: 1.8, h: 0.38,
    fill: { color: C.COVER_STRIP, transparency: 30 },
    line: { color: C.COVER_STRIP },
    rectRadius: 0.1,
  })
  slide.addText(`${subject}  ·  ${year}년`, {
    x: 0.5, y: 0.5, w: 1.8, h: 0.38,
    fontSize: 10, bold: true, color: C.WHITE, align: 'center', valign: 'middle',
  })

  // 제목
  slide.addText(title, {
    x: 0.5, y: 1.15, w: 9, h: 1.4,
    fontSize: 32, bold: true, color: C.WHITE,
    fontFace: 'Malgun Gothic',
  })

  // 중심 내용
  slide.addShape('rect', {
    x: 0.5, y: 2.75, w: 9, h: 0.04,
    fill: { color: C.COVER_STRIP, transparency: 20 },
    line: { color: C.COVER_STRIP, transparency: 20 },
  })
  slide.addText(analysis.macro.main_idea, {
    x: 0.5, y: 2.9, w: 9, h: 1,
    fontSize: 14, color: 'C7D2FE', italic: true, fontFace: 'Malgun Gothic',
  })

  // 하단 정보
  slide.addText(`${analysis.macro.text_type}  ·  ${analysis.macro.structure}`, {
    x: 0.5, y: 4.9, w: 9, h: 0.4,
    fontSize: 10, color: '818CF8', align: 'left',
  })
}

// ── 슬라이드 2: 전체 개요 ─────────────────────────────────────────────────────
function addOverviewSlide(pres: PptxGenJS, analysis: AnalysisResult) {
  const slide = pres.addSlide()
  slide.background = { color: C.BG }

  // 헤더
  slide.addShape('rect', {
    x: 0, y: 0, w: 10, h: 0.6,
    fill: { color: C.HEADER_BG },
    line: { color: C.HEADER_BG },
  })
  slide.addText('전체 개요', {
    x: 0.4, y: 0, w: 9, h: 0.6,
    fontSize: 14, bold: true, color: C.WHITE, valign: 'middle',
  })

  // 중심 내용 카드
  slide.addShape('rect', {
    x: 0.3, y: 0.8, w: 9.4, h: 0.9,
    fill: { color: 'EEF2FF' },
    line: { color: 'A5B4FC' },
    shadow: makeShadow(),
  })
  slide.addShape('rect', {
    x: 0.3, y: 0.8, w: 0.15, h: 0.9,
    fill: { color: C.HEADER_BG },
    line: { color: C.HEADER_BG },
  })
  slide.addText('중심 내용', {
    x: 0.55, y: 0.83, w: 1.5, h: 0.22,
    fontSize: 8, bold: true, color: '6366F1',
  })
  slide.addText(analysis.macro.main_idea, {
    x: 0.55, y: 1.05, w: 8.9, h: 0.52,
    fontSize: 13, bold: true, color: C.TITLE_TEXT, fontFace: 'Malgun Gothic',
  })

  // 단락 흐름 리스트
  const paras = analysis.paragraphs ?? []
  const itemH = Math.min(0.62, (4.0) / Math.max(paras.length, 1))

  paras.forEach((para, i) => {
    const y = 1.85 + i * itemH
    const tag = C.TAG[para.function_tag] ?? C.TAG.부연
    const relKey = para.relation_to_prev ?? (i === 0 ? '도입' : '부연')
    const relColor = C.REL[relKey] ?? C.REL.부연

    // 관계 화살표 (첫 단락 제외)
    if (i > 0) {
      slide.addShape('rect', {
        x: 0.55, y: y - 0.12, w: 0.3, h: 0.1,
        fill: { color: relColor },
        line: { color: relColor },
      })
      slide.addText(relKey, {
        x: 0.88, y: y - 0.14, w: 1.2, h: 0.14,
        fontSize: 7, color: '57534E', italic: true,
      })
    }

    // 번호 뱃지
    slide.addShape('ellipse', {
      x: 0.3, y: y, w: 0.28, h: 0.28,
      fill: { color: tag.bg },
      line: { color: tag.text },
    })
    slide.addText(String(para.no), {
      x: 0.3, y: y, w: 0.28, h: 0.28,
      fontSize: 9, bold: true, color: tag.text, align: 'center', valign: 'middle',
    })

    // 기능 태그
    slide.addShape('rect', {
      x: 0.65, y: y + 0.02, w: 0.75, h: 0.24,
      fill: { color: tag.bg },
      line: { color: tag.text },
      rectRadius: 0.05,
    })
    slide.addText(para.function_tag, {
      x: 0.65, y: y + 0.02, w: 0.75, h: 0.24,
      fontSize: 8, bold: true, color: tag.text, align: 'center', valign: 'middle',
    })

    // 핵심 문장
    const coreTrunc = para.core_sentence?.length > 60
      ? para.core_sentence.slice(0, 60) + '…'
      : (para.core_sentence ?? '')
    slide.addText(coreTrunc, {
      x: 1.45, y: y, w: 8.2, h: 0.28,
      fontSize: 10, color: C.BODY_TEXT, valign: 'middle', fontFace: 'Malgun Gothic',
    })

    // 키워드 (있으면)
    if (para.keywords?.length) {
      const kwText = para.keywords.slice(0, 4).join('  ·  ')
      slide.addText(kwText, {
        x: 1.45, y: y + 0.3, w: 8, h: 0.18,
        fontSize: 8, color: C.MUTED, italic: true,
      })
    }
  })
}

// ── 슬라이드 3~N: 단락 슬라이드 ─────────────────────────────────────────────
function addParagraphSlide(
  pres: PptxGenJS,
  paraText: string,
  paraData: Paragraph,
  paraNo: number,
  totalParas: number,
  analysis: AnalysisResult,
) {
  const slide = pres.addSlide()
  slide.background = { color: C.BG }

  const tag = C.TAG[paraData.function_tag] ?? C.TAG.부연
  const relKey = paraData.relation_to_prev ?? (paraNo === 1 ? '도입' : '부연')
  const relColor = C.REL[relKey] ?? C.REL.부연

  // ── 헤더 바 ──────────────────────────────────────────────────────────
  slide.addShape('rect', {
    x: 0, y: 0, w: 10, h: 0.58,
    fill: { color: C.HEADER_BG },
    line: { color: C.HEADER_BG },
  })

  // 단락 번호
  slide.addText(`${paraNo}`, {
    x: 0.25, y: 0, w: 0.35, h: 0.58,
    fontSize: 18, bold: true, color: C.WHITE, align: 'center', valign: 'middle',
  })

  // 관계 태그
  slide.addShape('rect', {
    x: 0.65, y: 0.13, w: 0.9, h: 0.3,
    fill: { color: relColor, transparency: 30 },
    line: { color: relColor },
    rectRadius: 0.08,
  })
  slide.addText(relKey, {
    x: 0.65, y: 0.13, w: 0.9, h: 0.3,
    fontSize: 8, bold: true, color: C.HEADER_BG, align: 'center', valign: 'middle',
  })

  // 기능 태그
  slide.addShape('rect', {
    x: 1.62, y: 0.13, w: 0.9, h: 0.3,
    fill: { color: tag.bg, transparency: 30 },
    line: { color: tag.bg },
    rectRadius: 0.08,
  })
  slide.addText(paraData.function_tag, {
    x: 1.62, y: 0.13, w: 0.9, h: 0.3,
    fontSize: 8, bold: true, color: tag.bg === 'F5F5F4' ? '57534E' : tag.text, align: 'center', valign: 'middle',
  })

  // 페이지 정보
  slide.addText(`${paraNo} / ${totalParas}`, {
    x: 8.5, y: 0, w: 1.4, h: 0.58,
    fontSize: 10, color: 'A5B4FC', align: 'right', valign: 'middle',
  })

  // ── 본문 텍스트 (좌측 넓은 영역) ──────────────────────────────────────
  const mainW = 6.5
  const mainX = 0.3

  slide.addShape('rect', {
    x: mainX, y: 0.7, w: mainW, h: 3.5,
    fill: { color: C.WHITE },
    line: { color: C.GRAY_BORDER },
    shadow: makeShadow(),
  })

  // 본문 텍스트
  slide.addText(paraText, {
    x: mainX + 0.15, y: 0.78, w: mainW - 0.3, h: 3.35,
    fontSize: 14.5,
    fontFace: 'Malgun Gothic',
    color: C.BODY_TEXT,
    lineSpacingMultiple: 1.6,
    valign: 'top',
  })

  // ── 핵심 문장 강조 바 ─────────────────────────────────────────────────
  const coreText = paraData.core_sentence ?? ''
  if (coreText) {
    slide.addShape('rect', {
      x: mainX, y: 4.27, w: mainW, h: 0.8,
      fill: { color: 'FEF9C3' },
      line: { color: 'FCD34D' },
    })
    slide.addShape('rect', {
      x: mainX, y: 4.27, w: 0.12, h: 0.8,
      fill: { color: 'F59E0B' },
      line: { color: 'F59E0B' },
    })
    slide.addText('★ 핵심 문장', {
      x: mainX + 0.18, y: 4.27, w: 1.2, h: 0.26,
      fontSize: 7.5, bold: true, color: 'B45309', valign: 'middle',
    })
    const coreTrunc = coreText.length > 70 ? coreText.slice(0, 70) + '…' : coreText
    slide.addText(coreTrunc, {
      x: mainX + 0.18, y: 4.52, w: mainW - 0.3, h: 0.48,
      fontSize: 10.5, color: '78350F', fontFace: 'Malgun Gothic', valign: 'top',
    })
  }

  // ── 우측 사이드바 ──────────────────────────────────────────────────────
  const sbX = mainX + mainW + 0.2
  const sbW = 9.5 - sbX
  let sbY = 0.7

  // 키워드 카드
  if (paraData.keywords?.length) {
    slide.addShape('rect', {
      x: sbX, y: sbY, w: sbW, h: 0.65,
      fill: { color: 'EEF2FF' },
      line: { color: 'A5B4FC' },
      shadow: makeShadow(),
    })
    slide.addText('핵심 개념어', {
      x: sbX + 0.1, y: sbY + 0.04, w: sbW - 0.2, h: 0.18,
      fontSize: 7.5, bold: true, color: '4338CA',
    })
    slide.addText(paraData.keywords.join('\n'), {
      x: sbX + 0.1, y: sbY + 0.23, w: sbW - 0.2, h: 0.38,
      fontSize: 9, color: '3730A3', fontFace: 'Malgun Gothic',
      lineSpacingMultiple: 1.3,
    })
    sbY += 0.75
  }

  // 단락 설명(summary)
  if (paraData.summary) {
    const summaryTrunc = paraData.summary.length > 120 ? paraData.summary.slice(0, 120) + '…' : paraData.summary
    slide.addShape('rect', {
      x: sbX, y: sbY, w: sbW, h: 1.6,
      fill: { color: C.WHITE },
      line: { color: C.GRAY_BORDER },
      shadow: makeShadow(),
    })
    slide.addShape('rect', {
      x: sbX, y: sbY, w: sbW, h: 0.24,
      fill: { color: C.GRAY_LIGHT },
      line: { color: C.GRAY_BORDER },
    })
    slide.addText('단락 설명', {
      x: sbX + 0.1, y: sbY + 0.03, w: sbW - 0.2, h: 0.2,
      fontSize: 7.5, bold: true, color: C.MUTED,
    })
    slide.addText(summaryTrunc, {
      x: sbX + 0.1, y: sbY + 0.28, w: sbW - 0.2, h: 1.28,
      fontSize: 8.5, color: C.BODY_TEXT, fontFace: 'Malgun Gothic',
      lineSpacingMultiple: 1.5, valign: 'top',
    })
    sbY += 1.7
  }

  // 여백 메모
  const notes = getParaMarginNotes(paraNo, analysis).slice(0, 2)
  notes.forEach(note => {
    const noteColors: Record<string, { bg: string; text: string; bar: string }> = {
      yellow: { bg: 'FFFBEB', text: '92400E', bar: 'F59E0B' },
      blue:   { bg: 'EFF6FF', text: '1E40AF', bar: '3B82F6' },
      pink:   { bg: 'FDF2F8', text: '831843', bar: 'EC4899' },
      green:  { bg: 'F0FDF4', text: '14532D', bar: '22C55E' },
    }
    const nc = noteColors[note.color] ?? noteColors.yellow
    const noteH = 0.75
    if (sbY + noteH > 5.4) return  // 슬라이드 아래 넘치지 않게

    slide.addShape('rect', {
      x: sbX, y: sbY, w: sbW, h: noteH,
      fill: { color: nc.bg },
      line: { color: nc.bar },
      shadow: makeShadow(),
    })
    slide.addShape('rect', {
      x: sbX, y: sbY, w: 0.1, h: noteH,
      fill: { color: nc.bar },
      line: { color: nc.bar },
    })
    const noteType = note.type ?? '일반'
    slide.addText(noteType, {
      x: sbX + 0.15, y: sbY + 0.04, w: sbW - 0.2, h: 0.18,
      fontSize: 7, bold: true, color: nc.text,
    })
    const noteTrunc = note.content.length > 55 ? note.content.slice(0, 55) + '…' : note.content
    slide.addText(noteTrunc, {
      x: sbX + 0.15, y: sbY + 0.22, w: sbW - 0.2, h: 0.5,
      fontSize: 8.5, color: nc.text, fontFace: 'Malgun Gothic',
      lineSpacingMultiple: 1.3, valign: 'top',
    })
    sbY += noteH + 0.1
  })

  // 주석 태그들 (하단)
  const anns = getParaAnnotations(paraText, analysis.annotations ?? [])
  if (anns.length > 0 && sbY < 5.0) {
    slide.addText('주요 주석', {
      x: sbX, y: sbY, w: sbW, h: 0.18,
      fontSize: 7, bold: true, color: C.MUTED,
    })
    sbY += 0.2
    anns.forEach(ann => {
      if (sbY > 5.3) return
      const symColor = C.SYM[ann.symbol] ?? '57534E'
      const noteTrunc = ann.note?.length > 20 ? ann.note.slice(0, 20) + '…' : (ann.note ?? '')
      slide.addShape('rect', {
        x: sbX, y: sbY, w: sbW, h: 0.25,
        fill: { color: C.GRAY_LIGHT },
        line: { color: C.GRAY_BORDER },
        rectRadius: 0.04,
      })
      slide.addText([
        { text: ann.symbol + ' ', options: { bold: true, color: symColor, fontSize: 9 } },
        { text: noteTrunc, options: { color: C.BODY_TEXT, fontSize: 8 } },
      ], {
        x: sbX + 0.08, y: sbY, w: sbW - 0.12, h: 0.25,
        valign: 'middle', fontFace: 'Malgun Gothic',
      })
      sbY += 0.28
    })
  }
}

// ── 슬라이드: 비교대조 ─────────────────────────────────────────────────────────
function addCompareSlide(pres: PptxGenJS, analysis: AnalysisResult) {
  const cards = analysis.compare_cards ?? []
  if (!cards.length) return

  cards.forEach(card => {
    const slide = pres.addSlide()
    slide.background = { color: C.BG }

    // 헤더
    slide.addShape('rect', {
      x: 0, y: 0, w: 10, h: 0.58,
      fill: { color: 'B91C1C' },
      line: { color: 'B91C1C' },
    })
    slide.addText('↔  핵심 대조 분석', {
      x: 0.4, y: 0, w: 9, h: 0.58,
      fontSize: 14, bold: true, color: C.WHITE, valign: 'middle',
    })

    // A / B 헤더
    slide.addShape('rect', {
      x: 0.3, y: 0.7, w: 4.3, h: 0.5,
      fill: { color: '1D4ED8' },
      line: { color: '1D4ED8' },
      shadow: makeShadow(),
    })
    slide.addText(card.person_a, {
      x: 0.3, y: 0.7, w: 4.3, h: 0.5,
      fontSize: 16, bold: true, color: C.WHITE, align: 'center', valign: 'middle',
      fontFace: 'Malgun Gothic',
    })

    slide.addShape('rect', {
      x: 5.4, y: 0.7, w: 4.3, h: 0.5,
      fill: { color: 'B91C1C' },
      line: { color: 'B91C1C' },
      shadow: makeShadow(),
    })
    slide.addText(card.person_b, {
      x: 5.4, y: 0.7, w: 4.3, h: 0.5,
      fontSize: 16, bold: true, color: C.WHITE, align: 'center', valign: 'middle',
      fontFace: 'Malgun Gothic',
    })

    // 가운데 ↔ 아이콘
    slide.addText('↔', {
      x: 4.6, y: 0.7, w: 0.8, h: 0.5,
      fontSize: 20, bold: true, color: C.MUTED, align: 'center', valign: 'middle',
    })

    // 비교 항목들
    const maxPoints = Math.min(card.comparison_points.length, 5)
    const itemH = Math.min(0.78, 4.2 / maxPoints)

    card.comparison_points.slice(0, maxPoints).forEach((pt, i) => {
      const y = 1.32 + i * itemH

      // aspect 라벨
      slide.addShape('rect', {
        x: 4.25, y: y + 0.03, w: 1.5, h: itemH - 0.08,
        fill: { color: C.GRAY_LIGHT },
        line: { color: C.GRAY_BORDER },
      })
      slide.addText(pt.aspect, {
        x: 4.25, y: y + 0.03, w: 1.5, h: itemH - 0.08,
        fontSize: 8.5, bold: true, color: C.MUTED, align: 'center', valign: 'middle',
      })

      // A 값
      slide.addShape('rect', {
        x: 0.3, y: y + 0.03, w: 3.88, h: itemH - 0.08,
        fill: { color: 'EFF6FF' },
        line: { color: 'BFDBFE' },
      })
      slide.addText(pt.a_value, {
        x: 0.38, y: y + 0.06, w: 3.72, h: itemH - 0.14,
        fontSize: 10, color: '1E40AF', fontFace: 'Malgun Gothic',
        valign: 'middle', lineSpacingMultiple: 1.3,
      })

      // B 값
      slide.addShape('rect', {
        x: 5.82, y: y + 0.03, w: 3.88, h: itemH - 0.08,
        fill: { color: 'FEF2F2' },
        line: { color: 'FECACA' },
      })
      slide.addText(pt.b_value, {
        x: 5.9, y: y + 0.06, w: 3.72, h: itemH - 0.14,
        fontSize: 10, color: '991B1B', fontFace: 'Malgun Gothic',
        valign: 'middle', lineSpacingMultiple: 1.3,
      })
    })
  })
}

// ── 슬라이드: 출제 포인트 ──────────────────────────────────────────────────────
function addExamPointsSlide(pres: PptxGenJS, analysis: AnalysisResult) {
  const points = analysis.exam_points ?? []
  if (!points.length) return

  const slide = pres.addSlide()
  slide.background = { color: C.BG }

  slide.addShape('rect', {
    x: 0, y: 0, w: 10, h: 0.58,
    fill: { color: '7C3AED' },
    line: { color: '7C3AED' },
  })
  slide.addText('★  출제 예상 포인트', {
    x: 0.4, y: 0, w: 9, h: 0.58,
    fontSize: 14, bold: true, color: C.WHITE, valign: 'middle',
  })

  const typeColors: Record<string, { bg: string; text: string }> = {
    추론:    { bg: 'F3E8FF', text: '6D28D9' },
    어휘:    { bg: 'FEF9C3', text: '92400E' },
    구조파악: { bg: 'DBEAFE', text: '1D4ED8' },
    적용:    { bg: 'DCFCE7', text: '15803D' },
    사실확인: { bg: 'F5F5F4', text: '57534E' },
  }

  const maxPts = Math.min(points.length, 7)
  const itemH = Math.min(0.72, 4.7 / maxPts)

  points.slice(0, maxPts).forEach((ep, i) => {
    const y = 0.72 + i * itemH
    const tc = typeColors[ep.type] ?? typeColors.사실확인

    slide.addShape('rect', {
      x: 0.3, y: y, w: 9.4, h: itemH - 0.06,
      fill: { color: C.WHITE },
      line: { color: C.GRAY_BORDER },
      shadow: makeShadow(),
    })

    // 번호
    slide.addShape('ellipse', {
      x: 0.35, y: y + 0.07, w: 0.28, h: 0.28,
      fill: { color: '7C3AED' },
      line: { color: '7C3AED' },
    })
    slide.addText(String(i + 1), {
      x: 0.35, y: y + 0.07, w: 0.28, h: 0.28,
      fontSize: 9, bold: true, color: C.WHITE, align: 'center', valign: 'middle',
    })

    // 유형 태그
    slide.addShape('rect', {
      x: 0.7, y: y + 0.08, w: 0.75, h: 0.24,
      fill: { color: tc.bg },
      line: { color: tc.text },
      rectRadius: 0.04,
    })
    slide.addText(ep.type, {
      x: 0.7, y: y + 0.08, w: 0.75, h: 0.24,
      fontSize: 8, bold: true, color: tc.text, align: 'center', valign: 'middle',
    })

    // 텍스트
    const epTrunc = ep.text.length > 65 ? ep.text.slice(0, 65) + '…' : ep.text
    slide.addText(epTrunc, {
      x: 1.52, y: y + 0.05, w: 8.08, h: itemH - 0.14,
      fontSize: 11, color: C.BODY_TEXT, fontFace: 'Malgun Gothic', valign: 'middle',
    })
  })
}

// ── 슬라이드: 문제 ─────────────────────────────────────────────────────────────
function addQuestionsSlide(pres: PptxGenJS, questionsText: string) {
  if (!questionsText?.trim()) return

  const lines = questionsText.split('\n').filter(l => l.trim())
  const CHUNK = 20  // 줄 수 기준으로 슬라이드 분할

  for (let start = 0; start < lines.length; start += CHUNK) {
    const chunk = lines.slice(start, start + CHUNK)
    const slide = pres.addSlide()
    slide.background = { color: C.BG }

    slide.addShape('rect', {
      x: 0, y: 0, w: 10, h: 0.58,
      fill: { color: '0E7490' },
      line: { color: '0E7490' },
    })
    const qNum = start === 0 ? '' : ` (이어서)`
    slide.addText(`문제${qNum}`, {
      x: 0.4, y: 0, w: 9, h: 0.58,
      fontSize: 14, bold: true, color: C.WHITE, valign: 'middle',
    })

    slide.addText(chunk.join('\n'), {
      x: 0.3, y: 0.7, w: 9.4, h: 4.8,
      fontSize: 11, color: C.BODY_TEXT, fontFace: 'Malgun Gothic',
      lineSpacingMultiple: 1.7, valign: 'top',
    })
  }
}

// ── 메인 POST 핸들러 ──────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const {
      passageTitle,
      passageYear,
      passageSubject,
      passageText,
      questionsText,
      analysisJson,
    } = await req.json() as {
      passageTitle: string
      passageYear: number
      passageSubject: string
      passageText: string
      questionsText?: string
      analysisJson: AnalysisResult
    }

    if (!passageText || !analysisJson) {
      return NextResponse.json({ error: '지문과 분석 데이터가 필요합니다' }, { status: 400 })
    }

    const pres = new PptxGenJS()
    pres.layout = 'LAYOUT_16x9'
    pres.author = '독소 - 수능 국어 독서 분석'
    pres.title = passageTitle ?? '독서 지문 분석'

    // 단락 분리
    const paraTexts = splitParagraphs(passageText)
    const paraData = analysisJson.paragraphs ?? []

    // 슬라이드 생성
    addCoverSlide(pres, passageTitle ?? '지문', passageYear, passageSubject, analysisJson)
    addOverviewSlide(pres, analysisJson)

    paraTexts.forEach((paraText, i) => {
      const pData = paraData.find(p => p.no === i + 1) ?? paraData[i] ?? {
        no: i + 1,
        function_tag: '부연',
        core_sentence: '',
        keywords: [],
        relation_to_prev: i === 0 ? '도입' : '부연',
      }
      addParagraphSlide(pres, paraText, pData as Paragraph, i + 1, paraTexts.length, analysisJson)
    })

    addCompareSlide(pres, analysisJson)
    addExamPointsSlide(pres, analysisJson)
    addQuestionsSlide(pres, questionsText ?? '')

    // Buffer → Uint8Array로 변환 후 반환
    const buffer = await pres.write({ outputType: 'nodebuffer' }) as Buffer
    const bytes = new Uint8Array(buffer)

    return new Response(bytes, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(passageTitle ?? '독서분석')}.pptx`,
      },
    })
  } catch (e) {
    console.error('PPTX export error:', e)
    return NextResponse.json({ error: `PPTX 생성 실패: ${(e as Error).message}` }, { status: 500 })
  }
}
