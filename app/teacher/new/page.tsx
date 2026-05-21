'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Subject = '인문' | '사회' | '과학' | '기술' | '예술'

const SUBJECTS: Subject[] = ['인문', '사회', '과학', '기술', '예술']

export default function NewPassagePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState<Subject>('인문')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [text, setText] = useState('')
  const [questions, setQuestions] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (text.trim().length < 50) {
      setError('지문 내용을 50자 이상 입력해 주세요.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error: insertError } = await supabase
        .from('passages')
        .insert({
          teacher_id: user.id,
          title: title.trim(),
          subject,
          year,
          text: text.trim(),
          questions: questions.trim() || null,
        })
        .select('id')
        .single()

      if (insertError) {
        setError('지문 저장 중 오류가 발생했습니다: ' + insertError.message)
        return
      }

      router.push(`/teacher/passage/${data.id}`)
    } catch {
      setError('예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  const charCount = text.length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/teacher/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors text-xl">
              ←
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-800">새 지문 등록</h1>
              <p className="text-xs text-gray-500">지문을 입력하고 AI 분석을 시작하세요</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
                지문 제목 <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="예) 현대 사회에서의 공유 경제"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                  영역 <span className="text-red-500">*</span>
                </label>
                <select
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1.5">
                  수능 연도 <span className="text-red-500">*</span>
                </label>
                <input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  min={2000}
                  max={2030}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="text" className="block text-sm font-medium text-gray-700">
                  지문 내용 <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-400">{charCount.toLocaleString()}자</span>
              </div>
              <textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                rows={18}
                placeholder="지문 원문을 여기에 붙여넣으세요..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono leading-relaxed"
              />
              <p className="text-xs text-gray-400 mt-1">
                수능 지문 전체를 그대로 붙여넣으면 AI가 정확하게 분석합니다.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="questions" className="block text-sm font-medium text-gray-700">
                  수능 문제 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
              </div>
              <textarea
                id="questions"
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                rows={10}
                placeholder="문제와 선지를 붙여넣으세요. AI가 각 선지의 근거가 되는 본문 구절을 찾아 하이라이트로 표시합니다."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono leading-relaxed"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg py-3 transition-colors"
              >
                {loading ? '저장 중...' : '지문 저장 후 분석 시작 →'}
              </button>
              <Link
                href="/teacher/dashboard"
                className="px-6 py-3 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
              >
                취소
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
