import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/crypto'
import { callAIProvider } from '@/lib/ai-caller'
import type { AnalysisResult } from '@/types'

function buildInfographicPrompt(analysis: AnalysisResult): string {
  const { macro, paragraphs = [], highlights = [], compare_cards = [], exam_points = [] } = analysis
  const concepts = highlights.filter(h => h.color === 'yellow').slice(0, 8).map(h => h.text)
  const persons = highlights.filter(h => h.color === 'pink').slice(0, 4).map(h => h.text)
  const contrasts = highlights.filter(h => h.color === 'orange').slice(0, 4).map(h => h.text)
  const hasCompare = compare_cards.length > 0
  const card = hasCompare ? compare_cards[0] : null

  const paraLines = paragraphs.map(p =>
    `단락${p.no}[${p.function_tag}]: ${p.core_sentence?.slice(0, 50) || '(내용 없음)'}`
  ).join('\n')

  const compareData = card
    ? `\nA측: ${card.person_a}\nB측: ${card.person_b}\n` +
      card.comparison_points.slice(0, 4).map(pt =>
        `[${pt.aspect}] A="${pt.a_value?.slice(0, 25)}" B="${pt.b_value?.slice(0, 25)}"`
      ).join('\n')
    : ''

  const examData = exam_points.slice(0, 4).map((ep, i) =>
    `${i + 1}.[${ep.type}] ${ep.text?.slice(0, 40)}`
  ).join('\n')

  const isComparison = macro.structure === '비교-대조' || hasCompare

  return `당신은 수능 국어 인포그래픽 전문 디자이너입니다. 아래 분석을 바탕으로 시각적으로 매력적인 SVG 인포그래픽을 생성하세요.

=== 분석 데이터 ===
화제: ${macro.topic}
구조: ${macro.structure} / 유형: ${macro.text_type}
핵심 주제: ${macro.main_idea}
단락 흐름:
${paraLines}
핵심 개념어: ${concepts.join(', ')}
${persons.length ? `주요 인물/개념: ${persons.join(', ')}` : ''}
${contrasts.length ? `대조 개념: ${contrasts.join(' ↔ ')}` : ''}
${compareData}
출제 예상:
${examData}

=== SVG 디자인 요구사항 ===
viewBox="0 0 900 1100" 고정. font-family="'Malgun Gothic','Apple SD Gothic Neo',sans-serif". 배경 전체 #f0f4f8.

[디자인 스타일 - 반드시 준수]
1. 상단 헤더: 진한 색 배경(#1e3a5f) + 흰색 대형 제목 텍스트 (화제를 크고 굵게). 부제로 유형·구조 표시.
2. 이모지/유니코드 아이콘을 각 섹션에 적극 활용 (📚 ⚖️ 💡 🔍 ⚠️ ✅ 📌 🔄 등)
3. 카드형 레이아웃: 흰색(#ffffff) 둥근 사각형(rx="12") + 그림자 효과(filter)
${isComparison ? `4. [비교대조 구조이므로] 좌우 2컬럼 비교 레이아웃 필수:
   - 왼쪽: A측(${card?.person_a || '개념A'}) → 초록 계열 (#047857, #d1fae5)
   - 오른쪽: B측(${card?.person_b || '개념B'}) → 빨강/보라 계열 (#b91c1c, #fee2e2)
   - 중앙: ⚖️ 또는 화살표로 대비 시각화
   - 각 항목마다 이모지 아이콘 + 굵은 제목 + 설명 텍스트` : `4. 단락 흐름을 세로 타임라인으로 시각화:
   - 각 단락을 카드로, 번호 원형 뱃지, function_tag별 색상`}
5. 핵심 개념어: 컬러풀한 태그(pill) 형태 나열
6. 출제 포인트: 번호 뱃지 + 유형별 색상 + 텍스트
7. 텍스트는 충분히 크게 (최소 12px), 한국어가 잘 보이도록
8. 전체 높이를 균등 분배하여 빈 공간 없이 꽉 채울 것
9. 그림자: <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.08"/></filter>
10. 반드시 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100">로 시작하고 </svg>로 끝나는 완전한 SVG만 반환. 다른 텍스트 없이.`
}

export async function POST(req: Request) {
  try {
    const { passageId, analysisJson } = await req.json()

    if (!passageId || !analysisJson) {
      return NextResponse.json({ error: 'passageId와 analysisJson이 필요합니다' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const { data: userData } = await supabase
      .from('users')
      .select('api_provider, api_key_encrypted, gemini_model, openrouter_model')
      .eq('id', user.id)
      .single()

    if (!userData?.api_key_encrypted) {
      return NextResponse.json({ error: 'API 키를 먼저 등록해주세요' }, { status: 400 })
    }

    let apiKey: string
    try {
      apiKey = decrypt(userData.api_key_encrypted)
    } catch {
      return NextResponse.json({ error: 'API 키 복호화 실패' }, { status: 500 })
    }

    const provider = userData.api_provider || 'gemini'
    const prompt = buildInfographicPrompt(analysisJson as AnalysisResult)

    let svgText: string
    try {
      svgText = await callAIProvider(provider, apiKey, prompt, userData, { maxOutputTokens: 8192, temperature: 0.7 })
    } catch (e) {
      return NextResponse.json({ error: `AI 호출 실패: ${(e as Error).message}` }, { status: 502 })
    }

    // Extract SVG — find first <svg and last </svg>
    const svgStart = svgText.indexOf('<svg')
    const svgEnd = svgText.lastIndexOf('</svg>') + 6
    if (svgStart === -1 || svgEnd < 6) {
      // Return first 500 chars of raw for debugging
      const preview = svgText.slice(0, 500)
      return NextResponse.json({ error: 'SVG 생성 실패: 유효한 SVG가 반환되지 않았습니다', raw: preview }, { status: 500 })
    }
    const cleanSvg = svgText.slice(svgStart, svgEnd)

    // Store SVG in analysis_json
    const { data: existing } = await supabase
      .from('teacher_analyses')
      .select('id, analysis_json')
      .eq('passage_id', passageId)
      .single()

    if (existing) {
      const updatedJson = { ...existing.analysis_json, infographic_svg: cleanSvg }
      await supabase
        .from('teacher_analyses')
        .update({ analysis_json: updatedJson, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    }

    return NextResponse.json({ svg: cleanSvg })
  } catch (e) {
    return NextResponse.json({ error: `서버 오류: ${(e as Error).message}` }, { status: 500 })
  }
}
