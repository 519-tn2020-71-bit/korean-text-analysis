import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/crypto'
import { callAIProvider } from '@/lib/ai-caller'

function buildParsePrompt(rawText: string): string {
  return `아래 텍스트는 수능특강 또는 수능 비문학 학습자료에서 복사한 원문입니다.
이 텍스트에서 각 구성 요소를 정확히 분리하여 JSON으로 반환하세요.

유효한 JSON만 반환하세요. 코드블록(\`\`\`)·마크다운·설명 텍스트 일절 금지.

## 입력 텍스트

${rawText}

---

## 추출 규칙

### passage_text (필수)
- 지문 원문만 추출. 분석, 주석, 선생님 코멘트 없이 순수 지문 텍스트.
- 문단 구분은 빈 줄(\n\n)로. 원문의 문단 구조를 그대로 유지.
- 보통 (가), (나) 또는 숫자가 없는 연속 텍스트가 지문임.

### title
- 지문 제목이 명시되어 있으면 추출. 없으면 "".
- 예: "본유 관념 논쟁", "공유 경제의 가치와 한계"

### topic
- 핵심 화제어. 지문 제목이나 내용에서 추출. 없으면 "".
- 예: "본유 관념", "공유 경제"

### content_summary
- 전체 내용을 1~3문장으로 요약한 텍스트 (있으면 추출, 없으면 "")
- "내용 요약", "학습 포인트", "지문 개요" 등 표지 다음에 오는 내용

### paragraph_summaries
- 각 문단의 중심내용 (1문장씩, 교과서나 자료에 명시된 것 우선)
- "문단 1:", "1단락:", "①" 등의 표지로 구분된 중심내용을 추출
- 명시적으로 없으면 [] 반환
- 형식: [{ "no": 1, "content": "중심내용 1문장" }, ...]

### questions_text
- 문제 전체 (문제 번호, 발문, 선지 ①②③④⑤ 포함)
- "[문제]", "확인 학습", "01.", "1번" 등의 표지 이후 내용
- 없으면 ""

### explanations_text
- 해설 전체
- "[해설]", "정답과 해설", "풀이" 등 표지 이후 내용
- 없으면 ""

---

## 반환 JSON

{
  "passage_text": "string — 줄바꿈 2개로 문단 구분",
  "title": "string",
  "topic": "string",
  "content_summary": "string",
  "paragraph_summaries": [
    { "no": 1, "content": "string" }
  ],
  "questions_text": "string",
  "explanations_text": "string"
}`
}

export async function POST(req: Request) {
  try {
    const { rawText } = await req.json()
    if (!rawText?.trim()) {
      return NextResponse.json({ error: '텍스트를 입력하세요' }, { status: 400 })
    }

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
    const prompt = buildParsePrompt(rawText)

    let responseText: string
    try {
      responseText = await callAIProvider(provider, apiKey, prompt, userData, {
        maxOutputTokens: 4096,
        temperature: 0.1,
      })
    } catch (e) {
      return NextResponse.json({ error: `AI 호출 실패: ${(e as Error).message}` }, { status: 502 })
    }

    let parsed: unknown
    try {
      const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'AI 응답 파싱 실패. 다시 시도해주세요.', raw: responseText.slice(0, 300) },
        { status: 500 }
      )
    }

    return NextResponse.json(parsed)
  } catch (e) {
    return NextResponse.json({ error: `서버 오류: ${(e as Error).message}` }, { status: 500 })
  }
}
