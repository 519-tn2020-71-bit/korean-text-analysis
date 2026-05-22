import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/crypto'
import { callAIProvider } from '@/lib/ai-caller'
import { buildOxPrompt } from '@/lib/prompts'
import type { OxQuestion } from '@/types'

export async function POST(req: Request) {
  try {
    const { passageId, passageText, paragraphs } = await req.json()

    if (!passageText || !paragraphs?.length) {
      return NextResponse.json({ error: '지문과 단락 정보가 필요합니다' }, { status: 400 })
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
    const prompt = buildOxPrompt(passageText, paragraphs)

    let responseText: string
    try {
      responseText = await callAIProvider(provider, apiKey, prompt, userData, {
        maxOutputTokens: 4096,
        temperature: 0.3,
      })
    } catch (e) {
      return NextResponse.json({ error: `AI 호출 실패: ${(e as Error).message}` }, { status: 502 })
    }

    let oxQuestions: OxQuestion[]
    try {
      const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
      oxQuestions = JSON.parse(cleaned)
      if (!Array.isArray(oxQuestions)) throw new Error('배열이 아님')
    } catch {
      return NextResponse.json({ error: 'OX 응답 파싱 실패', raw: responseText.slice(0, 300) }, { status: 500 })
    }

    // analysis_json에 ox_questions 저장
    if (passageId) {
      const { data: existing } = await supabase
        .from('teacher_analyses')
        .select('id, analysis_json')
        .eq('passage_id', passageId)
        .single()

      if (existing) {
        const updatedJson = { ...existing.analysis_json, ox_questions: oxQuestions }
        await supabase
          .from('teacher_analyses')
          .update({ analysis_json: updatedJson, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
      }
    }

    return NextResponse.json({ ox_questions: oxQuestions })
  } catch (e) {
    return NextResponse.json({ error: `서버 오류: ${(e as Error).message}` }, { status: 500 })
  }
}
