export const runtime = 'nodejs'   // pptxgenjs requires Node.js (not Edge)
export const maxDuration = 60     // 복잡한 PPT 생성 시 시간 여유

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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

// ── 슬라이드 A: 지문 텍스트 ──────────────────────────────────────────────────
function addParaTextSlide(
  pres: PptxGenJS,
  paraText: string,
  paraData: Paragraph,
  paraNo: number,
  totalParas: number,
) {
  const slide = pres.addSlide()
  slide.background = { color: C.WHITE }

  const tag = C.TAG[paraData.function_tag] ?? C.TAG.부연
  const relKey = paraData.relation_to_prev ?? (paraNo === 1 ? '도입' : '부연')
  const relColor = C.REL[relKey] ?? C.REL.부연

  // 헤더
  slide.addShape('rect', { x: 0, y: 0, w: 10, h: 0.55, fill: { color: C.HEADER_BG }, line: { color: C.HEADER_BG } })
  slide.addText(`단락  ${paraNo}`, { x: 0.3, y: 0, w: 1.2, h: 0.55, fontSize: 15, bold: true, color: C.WHITE, valign: 'middle' })

  // 관계 배지
  slide.addShape('rect', { x: 1.55, y: 0.12, w: 1.0, h: 0.3, fill: { color: relColor, transparency: 20 }, line: { color: relColor }, rectRadius: 0.06 })
  slide.addText(relKey, { x: 1.55, y: 0.12, w: 1.0, h: 0.3, fontSize: 9, bold: true, color: C.HEADER_BG, align: 'center', valign: 'middle' })

  // 기능 배지
  slide.addShape('rect', { x: 2.62, y: 0.12, w: 1.0, h: 0.3, fill: { color: tag.bg, transparency: 10 }, line: { color: tag.text }, rectRadius: 0.06 })
  slide.addText(paraData.function_tag, { x: 2.62, y: 0.12, w: 1.0, h: 0.3, fontSize: 9, bold: true, color: tag.text, align: 'center', valign: 'middle' })

  // 페이지
  slide.addText(`${paraNo} / ${totalParas}`, { x: 8.5, y: 0, w: 1.4, h: 0.55, fontSize: 10, color: 'A5B4FC', align: 'right', valign: 'middle' })

  // 본문 텍스트 (전체 너비, 크게)
  slide.addText(paraText, {
    x: 0.5, y: 0.7, w: 9, h: 4.1,
    fontSize: 17, fontFace: 'Malgun Gothic', color: C.BODY_TEXT,
    lineSpacingMultiple: 1.75, valign: 'top',
  })

  // 핵심 문장 바 (하단)
  const core = paraData.core_sentence ?? ''
  if (core) {
    slide.addShape('rect', { x: 0, y: 4.87, w: 10, h: 0.75, fill: { color: 'FEF9C3' }, line: { color: 'FCD34D' } })
    slide.addShape('rect', { x: 0, y: 4.87, w: 0.18, h: 0.75, fill: { color: 'F59E0B' }, line: { color: 'F59E0B' } })
    slide.addText([
      { text: '★ 핵심  ', options: { bold: true, color: 'B45309', fontSize: 10 } },
      { text: core.length > 80 ? core.slice(0, 80) + '…' : core, options: { color: '78350F', fontSize: 12, fontFace: 'Malgun Gothic' } },
    ], { x: 0.28, y: 4.87, w: 9.5, h: 0.75, valign: 'middle' })
  }
}

// ── 슬라이드 B: 단락 분석 ─────────────────────────────────────────────────────
function addParaAnalysisSlide(
  pres: PptxGenJS,
  paraText: string,
  paraData: Paragraph,
  paraNo: number,
  totalParas: number,
  allParaData: Paragraph[],
  analysis: AnalysisResult,
) {
  const slide = pres.addSlide()
  slide.background = { color: C.BG }

  const tag = C.TAG[paraData.function_tag] ?? C.TAG.부연
  const relKey = paraData.relation_to_prev ?? (paraNo === 1 ? '도입' : '부연')
  const relColor = C.REL[relKey] ?? C.REL.부연
  const prevPara = paraNo > 1 ? allParaData[paraNo - 2] : null

  const NOTE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
    yellow: { bg: 'FFFBEB', text: '92400E', bar: 'F59E0B' },
    blue:   { bg: 'EFF6FF', text: '1E40AF', bar: '3B82F6' },
    pink:   { bg: 'FDF2F8', text: '831843', bar: 'EC4899' },
    green:  { bg: 'F0FDF4', text: '14532D', bar: '22C55E' },
  }

  // 헤더 (분석 슬라이드는 약간 다른 색으로 구분)
  slide.addShape('rect', { x: 0, y: 0, w: 10, h: 0.55, fill: { color: '312E81' }, line: { color: '312E81' } })
  slide.addText(`단락  ${paraNo}  분석`, { x: 0.3, y: 0, w: 3, h: 0.55, fontSize: 13, bold: true, color: C.WHITE, valign: 'middle' })
  slide.addShape('rect', { x: 3.4, y: 0.12, w: 1.0, h: 0.3, fill: { color: relColor, transparency: 20 }, line: { color: relColor }, rectRadius: 0.06 })
  slide.addText(relKey, { x: 3.4, y: 0.12, w: 1.0, h: 0.3, fontSize: 9, bold: true, color: '312E81', align: 'center', valign: 'middle' })
  slide.addShape('rect', { x: 4.47, y: 0.12, w: 1.0, h: 0.3, fill: { color: tag.bg, transparency: 10 }, line: { color: tag.text }, rectRadius: 0.06 })
  slide.addText(paraData.function_tag, { x: 4.47, y: 0.12, w: 1.0, h: 0.3, fontSize: 9, bold: true, color: tag.text, align: 'center', valign: 'middle' })
  slide.addText(`${paraNo} / ${totalParas}`, { x: 8.5, y: 0, w: 1.4, h: 0.55, fontSize: 10, color: 'A5B4FC', align: 'right', valign: 'middle' })

  // ── 좌측 컬럼 (5.6") ─────────────────────────────────────────────────
  const LX = 0.3
  const LW = 5.6
  let LY = 0.68

  // ① 앞 단락 연결 설명 (1단락 제외)
  if (prevPara && paraNo > 1) {
    const relDesc: Record<string, string> = {
      부연: '앞 단락의 내용을 더 상세히 설명합니다.',
      대조: '앞 단락과 반대되는 관점을 제시합니다.',
      근거: '앞 단락의 주장을 뒷받침하는 논거입니다.',
      예시: '앞 단락의 개념을 구체적 사례로 보여줍니다.',
      결론: '앞 내용을 종합하여 최종 주장을 도출합니다.',
      전환: '새로운 화제나 관점으로 전환합니다.',
    }
    const prevCore = prevPara.core_sentence ?? ''
    const connH = prevCore ? 1.05 : 0.55

    slide.addShape('rect', { x: LX, y: LY, w: LW, h: connH, fill: { color: 'F0F9FF' }, line: { color: '7DD3FC' }, shadow: makeShadow() })
    slide.addShape('rect', { x: LX, y: LY, w: 0.12, h: connH, fill: { color: '0EA5E9' }, line: { color: '0EA5E9' } })

    slide.addText([
      { text: `← 앞 단락(${paraNo - 1})과의 관계  `, options: { bold: true, color: '0369A1', fontSize: 9 } },
      { text: relDesc[relKey] ?? `${relKey} 관계`, options: { color: '0369A1', fontSize: 9 } },
    ], { x: LX + 0.2, y: LY + 0.06, w: LW - 0.3, h: 0.22, valign: 'middle' })

    if (prevCore) {
      slide.addText('앞 단락 핵심 → ', { x: LX + 0.2, y: LY + 0.3, w: 1.4, h: 0.18, fontSize: 8, color: '64748B', italic: true })
      slide.addText(`"${prevCore.length > 55 ? prevCore.slice(0, 55) + '…' : prevCore}"`, {
        x: LX + 0.2, y: LY + 0.48, w: LW - 0.35, h: 0.5,
        fontSize: 10, color: '0C4A6E', fontFace: 'Malgun Gothic', italic: true,
        lineSpacingMultiple: 1.4,
      })
    }
    LY += connH + 0.12
  }

  // ② 단락 요약 (크게, 충분한 공간)
  if (paraData.summary) {
    const summaryH = Math.min(2.2, Math.max(1.4, (paraData.summary.length / 38) * 0.28 + 0.5))
    slide.addShape('rect', { x: LX, y: LY, w: LW, h: summaryH, fill: { color: C.WHITE }, line: { color: C.GRAY_BORDER }, shadow: makeShadow() })
    slide.addShape('rect', { x: LX, y: LY, w: LW, h: 0.3, fill: { color: '1E2761' }, line: { color: '1E2761' } })
    slide.addText('📝  단락 요약', { x: LX + 0.15, y: LY, w: LW - 0.2, h: 0.3, fontSize: 9, bold: true, color: C.WHITE, valign: 'middle' })
    slide.addText(paraData.summary, {
      x: LX + 0.15, y: LY + 0.35, w: LW - 0.3, h: summaryH - 0.42,
      fontSize: 11, color: C.BODY_TEXT, fontFace: 'Malgun Gothic',
      lineSpacingMultiple: 1.6, valign: 'top',
    })
    LY += summaryH + 0.12
  }

  // ③ 핵심 키워드
  if (paraData.keywords?.length && LY < 5.1) {
    slide.addShape('rect', { x: LX, y: LY, w: LW, h: 0.4, fill: { color: 'EEF2FF' }, line: { color: 'A5B4FC' }, shadow: makeShadow() })
    slide.addText([
      { text: '핵심어  ', options: { bold: true, color: '4338CA', fontSize: 9 } },
      { text: paraData.keywords.join('  ·  '), options: { color: '3730A3', fontSize: 10, fontFace: 'Malgun Gothic' } },
    ], { x: LX + 0.15, y: LY, w: LW - 0.25, h: 0.4, valign: 'middle' })
    LY += 0.5
  }

  // ── 우측 컬럼 (3.7") ─────────────────────────────────────────────────
  const RX = LX + LW + 0.2
  const RW = 9.7 - RX
  let RY = 0.68

  // ④ 주요 주석 (logic_role + 전체 text 표시)
  const anns = getParaAnnotations(paraText, analysis.annotations ?? []).slice(0, 5)
  if (anns.length > 0) {
    slide.addShape('rect', { x: RX, y: RY, w: RW, h: 0.28, fill: { color: '1E2761' }, line: { color: '1E2761' } })
    slide.addText('주요 주석', { x: RX + 0.1, y: RY, w: RW - 0.15, h: 0.28, fontSize: 9, bold: true, color: C.WHITE, valign: 'middle' })
    RY += 0.28

    anns.forEach(ann => {
      if (RY > 4.8) return
      const symColor = C.SYM[ann.symbol] ?? '57534E'
      const roleLabel = ann.logic_role ? `[${ann.logic_role}] ` : ''
      const annText = ann.text.length > 42 ? ann.text.slice(0, 42) + '…' : ann.text
      const noteText = ann.note ?? ''
      const annH = 0.72

      slide.addShape('rect', { x: RX, y: RY, w: RW, h: annH, fill: { color: C.WHITE }, line: { color: C.GRAY_BORDER }, shadow: makeShadow() })
      slide.addShape('rect', { x: RX, y: RY, w: 0.1, h: annH, fill: { color: symColor }, line: { color: symColor } })

      // 심볼 + 역할
      slide.addText([
        { text: ann.symbol + '  ', options: { bold: true, color: symColor, fontSize: 12 } },
        { text: roleLabel, options: { bold: true, color: symColor, fontSize: 8 } },
        { text: noteText, options: { color: C.MUTED, fontSize: 8, italic: true } },
      ], { x: RX + 0.18, y: RY + 0.04, w: RW - 0.25, h: 0.22, valign: 'middle' })

      // 주석 본문
      slide.addText(`"${annText}"`, {
        x: RX + 0.18, y: RY + 0.27, w: RW - 0.25, h: 0.42,
        fontSize: 9.5, color: C.BODY_TEXT, fontFace: 'Malgun Gothic',
        lineSpacingMultiple: 1.35, valign: 'top', italic: true,
      })
      RY += annH + 0.06
    })
  }

  // ⑤ 여백 메모
  const notes = getParaMarginNotes(paraNo, analysis)
  notes.forEach(note => {
    if (RY > 5.0) return
    const nc = NOTE_COLORS[note.color] ?? NOTE_COLORS.yellow
    const noteH = Math.min(1.0, Math.max(0.65, (note.content.length / 20) * 0.2 + 0.45))

    slide.addShape('rect', { x: RX, y: RY, w: RW, h: noteH, fill: { color: nc.bg }, line: { color: nc.bar }, shadow: makeShadow() })
    slide.addShape('rect', { x: RX, y: RY, w: 0.1, h: noteH, fill: { color: nc.bar }, line: { color: nc.bar } })
    slide.addText(`${note.type ?? '메모'}`, { x: RX + 0.16, y: RY + 0.05, w: RW - 0.22, h: 0.2, fontSize: 8, bold: true, color: nc.text })
    slide.addText(note.content, {
      x: RX + 0.16, y: RY + 0.26, w: RW - 0.22, h: noteH - 0.3,
      fontSize: 10, color: nc.text, fontFace: 'Malgun Gothic',
      lineSpacingMultiple: 1.4, valign: 'top',
    })
    RY += noteH + 0.1
  })
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
    // ── 인증 확인 ────────────────────────────────────────────────────────────
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

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
      addParaTextSlide(pres, paraText, pData as Paragraph, i + 1, paraTexts.length)
      addParaAnalysisSlide(pres, paraText, pData as Paragraph, i + 1, paraTexts.length, paraData as Paragraph[], analysisJson)
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
