import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { encrypt } from '@/lib/crypto'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { api_provider, api_key, gemini_model, openrouter_model } = body

    if (!api_provider) {
      return NextResponse.json({ error: 'API 제공자를 선택해주세요' }, { status: 400 })
    }

    if (!api_key) {
      return NextResponse.json({ error: 'API 키를 입력해주세요' }, { status: 400 })
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

    let encryptedKey: string
    try {
      encryptedKey = encrypt(api_key.trim())
    } catch {
      return NextResponse.json({ error: 'API 키 암호화 실패' }, { status: 500 })
    }

    const { error } = await supabase
      .from('users')
      .update({
        api_provider,
        api_key_encrypted: encryptedKey,
        gemini_model: gemini_model || 'gemini-2.5-flash-lite',
        openrouter_model: openrouter_model || 'google/gemini-2.5-flash',
      })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: `저장 실패: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: `서버 오류: ${(e as Error).message}` }, { status: 500 })
  }
}
