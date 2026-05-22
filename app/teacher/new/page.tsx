'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ParagraphSummary } from '@/types'

type Subject = '인문' | '사회' | '과학' | '기술' | '예술'
const SUBJECTS: Subject[] = ['인문', '사회', '과학', '기술', '예술']

type Mode = 'smart' | 'manual'

interface ParsedResult {
  passage_text: string
  title: string
  topic: string
  content_summary: string
  paragraph_summaries: ParagraphSummary[]
  questions_text: string
  explanations_text: string
}

export default function NewPassagePage() {
  const router = useRouter()

  // 모드
  const [mode, setMode] = useState<Mode>('smart')

  // 스마트 붙여넣기
  const [rawText, setRawText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<boolean>(false)

  // 폼 필드
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState<Subject>('인문')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [text, setText] = useState('')
  const [contentSummary, setContentSummary] = useState('')
  const [paragraphSummaries, setParagraphSummaries] = useState<ParagraphSummary[]>([])
  const [questions, setQuestions] = useState('')
  const [explanations, setExplanations] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── 스마트 파싱 ──────────────────────────────────────────────────────────
  async function handleParse() {
    if (!rawText.trim()) { setParseError('텍스트를 붙여넣어 주세요.'); return }
    setParsing(true)
    setParseError(null)

    try {
      const res = await fetch('/api/parse-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      })
      const data: ParsedResult & { error?: string } = await res.json()

      if (!res.ok || data.error) {
        setParseError(data.error ?? '파싱 실패. 다시 시도해주세요.')
        return
      }

      // 파싱 결과 적용
      if (data.passage_text) setText(data.passage_text)
      if (data.title) setTitle(data.title)
      if (data.content_summary) setContentSummary(data.content_summary)
      if (data.paragraph_summaries?.length) setParagraphSummaries(data.paragraph_summaries)
      if (data.questions_text) setQuestions(data.questions_text)
      if (data.explanations_text) setExplanations(data.explanations_text)
      setParsed(true)
    } catch {
      setParseError('네트워크 오류가 발생했습니다.')
    } finally {
      setParsing(false)
    }
  }

  // ── 단락 중심내용 편집 ────────────────────────────────────────────────────
  function updateParaSummary(no: number, content: string) {
    setParagraphSummaries(prev =>
      prev.map(p => p.no === no ? { ...p, content } : p)
    )
  }

  function addParaSummary() {
    const nextNo = paragraphSummaries.length > 0
      ? Math.max(...paragraphSummaries.map(p => p.no)) + 1
      : 1
    setParagraphSummaries(prev => [...prev, { no: nextNo, content: '' }])
  }

  function removeParaSummary(no: number) {
    setParagraphSummaries(prev => prev.filter(p => p.no !== no))
  }

  // ── 저장 ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (text.trim().length < 50) {
      setError('지문 내용을 50자 이상 입력해 주세요.')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data, error: insertError } = await supabase
        .from('passages')
        .insert({
          teacher_id: user.id,
          title: title.trim() || '제목 없음',
          subject,
          year,
          text: text.trim(),
          questions: questions.trim() || null,
          paragraph_summaries: paragraphSummaries.filter(p => p.content.trim()).length > 0
            ? paragraphSummaries.filter(p => p.content.trim())
            : null,
          content_summary: contentSummary.trim() || null,
          explanations: explanations.trim() || null,
        })
        .select('id')
        .single()

      if (insertError) {
        setError('저장 중 오류: ' + insertError.message)
        return
      }

      router.push(`/teacher/passage/${data.id}`)
    } catch {
      setError('예기치 않은 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // ── 렌더 ─────────────────────────────────────────────────────────────────
  const showForm = mode === 'manual' || parsed

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/teacher/dashboard" className="text-gray-400 hover:text-gray-600 text-xl">←</Link>
            <div>
              <h1 className="text-lg font-bold text-gray-800">새 지문 등록</h1>
              <p className="text-xs text-gray-500">수능특강 원문을 한 번에 붙여넣거나 직접 입력하세요</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-5">

        {/* 모드 탭 */}
        <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => { setMode('smart'); setParsed(false) }}
            className={`flex-1 text-sm font-semibold rounded-lg py-2 transition-colors ${mode === 'smart' ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ✨ 한번에 붙여넣기
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 text-sm font-semibold rounded-lg py-2 transition-colors ${mode === 'manual' ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ✏️ 직접 입력
          </button>
        </div>

        {/* 스마트 붙여넣기 영역 */}
        {mode === 'smart' && !parsed && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">수능특강 원문 붙여넣기</p>
              <p className="text-xs text-gray-400 mb-3">
                지문, 내용 요약, 문단 중심내용, 문제, 해설이 섞여 있어도 됩니다. AI가 자동으로 분리합니다.
              </p>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                rows={20}
                placeholder={"수능특강 원문을 그대로 붙여넣으세요.\n\n지문, 내용 요약, 문단별 중심내용, 문제, 해설 순서가 섞여 있어도 AI가 분리합니다."}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono leading-relaxed"
              />
              <p className="text-xs text-gray-400 mt-1">{rawText.length.toLocaleString()}자</p>
            </div>

            {parseError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                {parseError}
              </div>
            )}

            <button
              type="button"
              onClick={handleParse}
              disabled={parsing || !rawText.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              {parsing ? '⏳ AI가 분석 중...' : '✨ AI로 자동 분리하기'}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400">또는</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            <button
              type="button"
              onClick={() => setMode('manual')}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              직접 입력으로 전환 →
            </button>
          </div>
        )}

        {/* 파싱 완료 알림 */}
        {parsed && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <span>✅</span>
            <span>AI가 내용을 분리했습니다. 아래 내용을 확인하고 수정한 뒤 저장하세요.</span>
            <button
              type="button"
              onClick={() => setParsed(false)}
              className="ml-auto text-xs text-green-600 hover:text-green-800 underline"
            >
              다시 붙여넣기
            </button>
          </div>
        )}

        {/* 메인 폼 */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* 기본 정보 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">기본 정보</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  지문 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  placeholder="예) 본유 관념 논쟁 — 로크와 라이프니츠"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">영역</label>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value as Subject)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">수능 연도</label>
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                    min={2000} max={2030} required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* 지문 원문 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">
                  지문 원문 <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-400">{text.length.toLocaleString()}자</span>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                required rows={16}
                placeholder="지문 원문을 여기에 붙여넣으세요. 문단 구분은 빈 줄로 해주세요."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-serif leading-loose"
              />
            </div>

            {/* 내용 요약 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                내용 요약 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <textarea
                value={contentSummary}
                onChange={e => setContentSummary(e.target.value)}
                rows={3}
                placeholder="지문 전체 내용을 1~3문장으로 요약하세요. 수능특강에 제시된 내용 요약을 그대로 쓰셔도 됩니다."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y leading-relaxed"
              />
            </div>

            {/* 문단별 중심내용 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">문단별 중심내용 <span className="text-gray-400 font-normal">(선택)</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">각 문단의 핵심 내용을 한 문장으로 입력하세요</p>
                </div>
                <button
                  type="button"
                  onClick={addParaSummary}
                  className="text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1.5 font-medium"
                >
                  + 문단 추가
                </button>
              </div>

              {paragraphSummaries.length === 0 ? (
                <button
                  type="button"
                  onClick={addParaSummary}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 text-gray-400 text-sm hover:border-indigo-300 hover:text-indigo-500 transition-colors"
                >
                  + 문단 중심내용 추가
                </button>
              ) : (
                <div className="space-y-2">
                  {paragraphSummaries
                    .sort((a, b) => a.no - b.no)
                    .map(para => (
                      <div key={para.no} className="flex items-start gap-2">
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black shrink-0 mt-1.5">
                          {para.no}
                        </div>
                        <input
                          type="text"
                          value={para.content}
                          onChange={e => updateParaSummary(para.no, e.target.value)}
                          placeholder={`${para.no}단락 중심내용...`}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <button
                          type="button"
                          onClick={() => removeParaSummary(para.no)}
                          className="text-gray-300 hover:text-red-400 mt-2 shrink-0 text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* 문제 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                수능 문제 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <textarea
                value={questions}
                onChange={e => setQuestions(e.target.value)}
                rows={10}
                placeholder="문제와 선지를 붙여넣으세요. AI 분석 시 각 선지의 근거 구절을 찾아 표시합니다."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono leading-relaxed"
              />
            </div>

            {/* 해설 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                해설 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <textarea
                value={explanations}
                onChange={e => setExplanations(e.target.value)}
                rows={8}
                placeholder="문제 해설을 붙여넣으세요."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y leading-relaxed"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pb-8">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3 transition-colors"
              >
                {saving ? '저장 중...' : '저장 후 AI 분석 시작 →'}
              </button>
              <Link
                href="/teacher/dashboard"
                className="px-6 py-3 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
              >
                취소
              </Link>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
