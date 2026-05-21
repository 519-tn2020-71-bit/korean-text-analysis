'use client'

import { useState, useEffect, use, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Passage, TeacherAnalysis, StudentActivity, AnalysisResult } from '@/types'
import WhiteboardCanvas from '@/components/passage/WhiteboardCanvas'
import HintPanel from '@/components/analysis/HintPanel'
import CompareView from '@/components/passage/CompareView'
import StageGate from '@/components/shared/StageGate'

const STEPS = [
  { no: 1, label: '혼자 읽기', icon: '✏️' },
  { no: 2, label: '힌트 확인', icon: '💡' },
  { no: 3, label: '교사 분석과 비교', icon: '🔍' },
]

export default function StudentPassagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [step, setStep] = useState(1)
  const [passage, setPassage] = useState<Passage | null>(null)
  const [analysis, setAnalysis] = useState<TeacherAnalysis | null>(null)
  const [activity, setActivity] = useState<StudentActivity | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [memo, setMemo] = useState('')
  const passageRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const { data: { user } } = await supabase.auth.getUser()

      const [{ data: p }, { data: a }, { data: act }] = await Promise.all([
        supabase.from('passages').select('*').eq('id', id).single(),
        supabase.from('teacher_analyses').select('*').eq('passage_id', id).single(),
        user
          ? supabase.from('student_activities').select('*').eq('passage_id', id).eq('student_id', user.id).single()
          : Promise.resolve({ data: null }),
      ])

      setPassage(p as Passage)
      setAnalysis(a as TeacherAnalysis)
      if (act) {
        setActivity(act as StudentActivity)
        setMemo(act.text_memos || '')
      }
      setLoading(false)
    }
    fetch()
  }, [id])

  async function saveWhiteboard(dataUrl: string) {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      student_id: user.id,
      passage_id: id,
      whiteboard_data: dataUrl,
      text_memos: memo,
      completed_steps: [1],
    }

    if (activity) {
      await supabase.from('student_activities').update(payload).eq('id', activity.id)
    } else {
      const { data } = await supabase.from('student_activities').insert(payload).select().single()
      setActivity(data as StudentActivity)
    }
    setSaving(false)
  }

  if (loading || !passage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Link href="/student/dashboard" className="text-sm text-gray-400 hover:text-gray-600">← 목록</Link>
        <div>
          <h1 className="font-bold text-gray-900 text-base">{passage.title}</h1>
          <p className="text-xs text-gray-400">{passage.subject} · {passage.year}년도</p>
        </div>
      </header>

      {/* Stepper */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex gap-1 max-w-lg">
          {STEPS.map((s) => (
            <button
              key={s.no}
              onClick={() => setStep(s.no)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === s.no
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.no}단계</span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Step 1: Passage with whiteboard overlay */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h2 className="font-semibold text-gray-700 mb-3 text-sm">📄 지문 — 직접 필기해보세요</h2>
              <div
                ref={passageRef}
                className="relative border-t border-gray-100 pt-3"
              >
                <div className="passage-text text-gray-800 leading-loose whitespace-pre-wrap">
                  {passage.text}
                </div>
                <WhiteboardCanvas
                  containerRef={passageRef}
                  initialData={activity?.whiteboard_data}
                  onSave={saveWhiteboard}
                />
              </div>
              {saving && <p className="text-xs text-gray-400 mt-2">저장 중...</p>}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h2 className="font-semibold text-gray-700 mb-2 text-sm">📝 텍스트 메모</h2>
              <textarea
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="읽으면서 든 생각, 모르는 단어, 구조 파악 등을 적어보세요"
                className="w-full h-24 text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
        )}

        {/* Step 2: Hints */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                힌트를 순서대로 하나씩 열어보세요. 바로 모든 힌트를 열기보다는 스스로 생각해본 후 확인해보는 것이 좋습니다.
              </p>
              {analysis?.analysis_json ? (
                <HintPanel analysis={analysis.analysis_json as AnalysisResult} />
              ) : (
                <p className="text-center text-gray-400 py-8">선생님이 아직 분석을 등록하지 않았습니다</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Compare */}
        {step === 3 && (
          <StageGate passageId={id} requiredStage={3}>
            {analysis ? (
              <CompareView
                teacherAnalysis={analysis}
                studentActivity={activity}
                passageText={passage.text}
              />
            ) : (
              <p className="text-center text-gray-400 py-8">분석 데이터가 없습니다</p>
            )}
          </StageGate>
        )}
      </main>
    </div>
  )
}
