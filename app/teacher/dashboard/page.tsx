import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Passage } from '@/types'

const SUBJECT_COLORS: Record<string, string> = {
  인문: 'bg-blue-100 text-blue-700',
  사회: 'bg-green-100 text-green-700',
  과학: 'bg-purple-100 text-purple-700',
  기술: 'bg-orange-100 text-orange-700',
  예술: 'bg-pink-100 text-pink-700',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function TeacherDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: passages, error } = await supabase
    .from('passages')
    .select('*')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-indigo-700">독서 지문 분석</h1>
            <p className="text-sm text-gray-500 mt-0.5">교사 대시보드</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ⚙️ 설정
            </Link>
            <Link
              href="/teacher/new"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              + 새 지문 등록
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            등록된 지문{' '}
            <span className="text-indigo-600 font-bold">{passages?.length ?? 0}개</span>
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-6 text-sm">
            지문을 불러오는 중 오류가 발생했습니다.
          </div>
        )}

        {(!passages || passages.length === 0) && !error && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📄</p>
            <p className="text-gray-500 font-medium">아직 등록된 지문이 없습니다.</p>
            <p className="text-gray-400 text-sm mt-1">새 지문을 등록하여 AI 분석을 시작하세요.</p>
            <Link
              href="/teacher/new"
              className="inline-block mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              + 첫 지문 등록하기
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(passages as Passage[])?.map((passage) => (
            <Link
              key={passage.id}
              href={`/teacher/passage/${passage.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    SUBJECT_COLORS[passage.subject] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {passage.subject}
                </span>
                <span className="text-xs text-gray-400">{passage.year}년</span>
              </div>

              <h3 className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors line-clamp-2 leading-snug mb-3">
                {passage.title}
              </h3>

              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4">
                {passage.text.slice(0, 80)}...
              </p>

              <p className="text-xs text-gray-400">{formatDate(passage.created_at)}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
