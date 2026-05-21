'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Passage, TeacherAnalysis } from '@/types'

interface PassageWithStage extends Passage {
  stage_released: number
}

const SUBJECT_COLOR: Record<string, string> = {
  인문: 'bg-purple-100 text-purple-700',
  사회: 'bg-blue-100 text-blue-700',
  과학: 'bg-green-100 text-green-700',
  기술: 'bg-amber-100 text-amber-700',
  예술: 'bg-pink-100 text-pink-700',
}

const STAGE_LABEL: Record<number, { label: string; color: string }> = {
  0: { label: '준비중', color: 'text-gray-400' },
  1: { label: '1단계 열림', color: 'text-emerald-600' },
  2: { label: '2단계 열림', color: 'text-blue-600' },
  3: { label: '전체 공개', color: 'text-indigo-600' },
}

export default function StudentDashboard() {
  const [passages, setPassages] = useState<PassageWithStage[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchPassages() {
      // Try RPC first (requires rls_student_fix.sql to have been run)
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_released_passages')
      if (!rpcErr && rpcData && rpcData.length > 0) {
        setPassages(rpcData as PassageWithStage[])
        setLoading(false)
        return
      }

      // Fallback: direct table queries (uses schema.sql RLS policies)
      const { data: analyses } = await supabase
        .from('teacher_analyses')
        .select('passage_id, stage_released')
        .gte('stage_released', 1)

      if (!analyses || analyses.length === 0) {
        setLoading(false)
        return
      }

      const passageIds = analyses.map(a => a.passage_id)
      const { data: passageData } = await supabase
        .from('passages')
        .select('*')
        .in('id', passageIds)
        .order('created_at', { ascending: false })

      if (passageData) {
        const merged = passageData.map(p => ({
          ...p,
          stage_released: analyses.find(a => a.passage_id === p.id)?.stage_released ?? 0,
        })) as PassageWithStage[]
        setPassages(merged)
      }
      setLoading(false)
    }
    fetchPassages()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">학생 대시보드</h1>
          <p className="text-sm text-gray-500">선생님이 공개한 지문을 분석해보세요</p>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← 홈</Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : passages.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-lg font-medium">아직 공개된 지문이 없습니다</p>
            <p className="text-sm mt-1">선생님이 지문을 공개하면 여기에 나타납니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {passages.map((passage) => {
              const stageInfo = STAGE_LABEL[passage.stage_released] || STAGE_LABEL[0]
              return (
                <Link
                  key={passage.id}
                  href={`/student/passage/${passage.id}`}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-200 transition-all block"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      SUBJECT_COLOR[passage.subject] || 'bg-gray-100 text-gray-600'
                    }`}>
                      {passage.subject}
                    </span>
                    <span className={`text-xs font-medium ${stageInfo.color}`}>
                      {stageInfo.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-2 mb-1 line-clamp-2">
                    {passage.title}
                  </h3>
                  <p className="text-xs text-gray-400">{passage.year}년도</p>
                  <div className="mt-3 flex gap-1">
                    {[1, 2, 3].map(s => (
                      <div
                        key={s}
                        className={`h-1.5 flex-1 rounded-full ${
                          passage.stage_released >= s ? 'bg-indigo-400' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
