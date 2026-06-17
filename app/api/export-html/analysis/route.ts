import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateAnalysisHtml } from '@/lib/html/analysis'
import type { AnalysisResult } from '@/types'

export async function POST(req: Request) {
  try {
    const { passageId, passageTitle, passageSubject, passageYear, passageText, analysisJson } =
      await req.json()

    if (!passageText || !analysisJson) {
      return NextResponse.json({ error: '지문과 분석 데이터가 필요합니다' }, { status: 400 })
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

    const html = generateAnalysisHtml({
      title: passageTitle ?? '지문 분석',
      subject: passageSubject ?? '',
      year: passageYear ?? new Date().getFullYear(),
      passageText,
      analysis: analysisJson as AnalysisResult,
    })

    const filename = encodeURIComponent(`${passageTitle ?? '지문'}_원문분석.html`)
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: `서버 오류: ${(e as Error).message}` }, { status: 500 })
  }
}
