import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/crypto'
import { buildAnalysisPrompt } from '@/lib/prompts'

export async function POST(req: Request) {
  try {
    const { passageText, passageId, questionsText } = await req.json()

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!passageText || !passageId) {
      return NextResponse.json({ error: '지문 내용과 ID가 필요합니다' }, { status: 400 })
    }
    if (!UUID_RE.test(passageId)) {
      return NextResponse.json({ error: '잘못된 passageId 형식입니다' }, { status: 400 })
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
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // Get user's API settings
    const { data: userData } = await supabase
      .from('users')
      .select('api_provider, api_key_encrypted, gemini_model, openrouter_model')
      .eq('id', user.id)
      .single()

    if (!userData?.api_key_encrypted) {
      return NextResponse.json(
        { error: '설정 페이지에서 API 키를 먼저 등록해주세요' },
        { status: 400 }
      )
    }

    let apiKey: string
    try {
      apiKey = decrypt(userData.api_key_encrypted)
    } catch {
      return NextResponse.json({ error: 'API 키 복호화 실패. 키를 다시 등록해주세요' }, { status: 500 })
    }

    const provider = userData.api_provider || 'gemini'
    const prompt = buildAnalysisPrompt(passageText, questionsText || undefined)

    // Call AI provider
    let rawResponse: unknown
    try {
      rawResponse = await callProvider(provider, apiKey, prompt, userData)
    } catch (e) {
      return NextResponse.json({ error: `AI 호출 실패: ${(e as Error).message}` }, { status: 502 })
    }

    // Normalize response text
    const analysisText = normalizeResponse(provider, rawResponse)

    // Parse JSON (strip markdown code fences if present)
    let analysisJson: unknown
    try {
      const cleaned = analysisText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
      analysisJson = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'AI 응답 파싱 실패. 다시 시도해주세요', raw: analysisText }, { status: 500 })
    }

    // Save or update teacher_analyses
    const { data: existing } = await supabase
      .from('teacher_analyses')
      .select('id')
      .eq('passage_id', passageId)
      .single()

    if (existing) {
      await supabase
        .from('teacher_analyses')
        .update({ analysis_json: analysisJson, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('teacher_analyses').insert({
        passage_id: passageId,
        analysis_json: analysisJson,
        stage_released: 0,
      })
    }

    return NextResponse.json(analysisJson)
  } catch (e) {
    return NextResponse.json({ error: `서버 오류: ${(e as Error).message}` }, { status: 500 })
  }
}

async function callProvider(provider: string, apiKey: string, prompt: string, userData: Record<string, string | null>) {
  if (provider === 'gemini') {
    const model = userData.gemini_model || 'gemini-2.5-flash'
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
            maxOutputTokens: 16384,
          },
        }),
      }
    )
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Gemini API error ${res.status}: ${err}`)
    }
    return res.json()
  }

  if (provider === 'openrouter') {
    const model = userData.openrouter_model || 'google/gemini-2.5-flash'
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 12000,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenRouter API error ${res.status}: ${err}`)
    }
    return res.json()
  }

  if (provider === 'claude') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7-20260416',
        max_tokens: 16384,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Claude API error ${res.status}: ${err}`)
    }
    return res.json()
  }

  throw new Error(`알 수 없는 제공자: ${provider}`)
}

type GeminiPart = { text: string; thought?: boolean }

function normalizeResponse(provider: string, raw: unknown): string {
  const r = raw as Record<string, unknown>
  if (provider === 'gemini') {
    // Gemini 2.5 thinking models return thought parts before the actual content
    const parts: GeminiPart[] = (r.candidates as Array<{ content: { parts: GeminiPart[] } }>)[0].content.parts
    const textPart = parts.find(p => !p.thought) ?? parts[0]
    return textPart.text
  }
  if (provider === 'openrouter') {
    return (r.choices as Array<{ message: { content: string } }>)[0].message.content
  }
  if (provider === 'claude') {
    return (r.content as Array<{ text: string }>)[0].text
  }
  throw new Error('응답 정규화 실패')
}
