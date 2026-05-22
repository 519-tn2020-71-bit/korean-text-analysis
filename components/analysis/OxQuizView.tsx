'use client'

import { useState, useMemo } from 'react'
import type { OxQuestion } from '@/types'

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '기본',
  medium: '중급',
  hard: '고난도',
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
}

const TRAP_COLOR: Record<string, string> = {
  '범위': 'bg-purple-100 text-purple-700',
  '인과역전': 'bg-red-100 text-red-700',
  '속성혼용': 'bg-orange-100 text-orange-700',
  '관계역전': 'bg-blue-100 text-blue-700',
  '미언급': 'bg-gray-100 text-gray-600',
  '부정역전': 'bg-pink-100 text-pink-700',
  '개념대체': 'bg-indigo-100 text-indigo-700',
  '핵심 사실 확인': 'bg-teal-100 text-teal-700',
}

function getTrapColor(trap: string) {
  for (const key of Object.keys(TRAP_COLOR)) {
    if (trap.includes(key)) return TRAP_COLOR[key]
  }
  return 'bg-gray-100 text-gray-600'
}

interface Props {
  questions: OxQuestion[]
}

export default function OxQuizView({ questions }: Props) {
  const [userAnswers, setUserAnswers] = useState<Record<number, boolean>>({})
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [filterPara, setFilterPara] = useState<number | null>(null)
  const [showOnlyWrong, setShowOnlyWrong] = useState(false)

  const paragraphNos = useMemo(
    () => [...new Set(questions.map(q => q.paragraph_no))].sort((a, b) => a - b),
    [questions]
  )

  const filtered = questions.filter(q => {
    if (filterPara !== null && q.paragraph_no !== filterPara) return false
    if (showOnlyWrong) {
      const answered = userAnswers[q.id] !== undefined
      if (!answered) return false
      if (userAnswers[q.id] === q.answer) return false
    }
    return true
  })

  const answeredCount = Object.keys(userAnswers).length
  const correctCount = Object.entries(userAnswers).filter(
    ([id, ans]) => {
      const q = questions.find(q => q.id === Number(id))
      return q && q.answer === ans
    }
  ).length

  function handleAnswer(questionId: number, answer: boolean) {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }))
    setRevealed(prev => new Set(prev).add(questionId))
  }

  function handleReset() {
    setUserAnswers({})
    setRevealed(new Set())
    setShowOnlyWrong(false)
  }

  const allAnswered = answeredCount === questions.length

  return (
    <div className="space-y-4">
      {/* 헤더 / 점수판 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">OX 확인 문제</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">수능 선지 출제 원리 기반 · 총 {questions.length}문항</p>
          </div>
          <button
            onClick={handleReset}
            className="text-[11px] text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            초기화
          </button>
        </div>

        {/* 진행 바 */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <span>{answeredCount} / {questions.length} 풀이</span>
          {answeredCount > 0 && (
            <span className={correctCount / answeredCount >= 0.7 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
              정답률 {Math.round((correctCount / answeredCount) * 100)}%
            </span>
          )}
        </div>

        {allAnswered && (
          <div className={`mt-3 rounded-xl px-4 py-3 text-center text-sm font-bold ${
            correctCount / questions.length >= 0.8
              ? 'bg-green-50 text-green-700 border border-green-200'
              : correctCount / questions.length >= 0.6
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {correctCount}/{questions.length} 정답
            {correctCount / questions.length >= 0.8 ? ' 🎉 훌륭합니다!' : correctCount / questions.length >= 0.6 ? ' 👍 잘 하고 있어요!' : ' 📖 지문을 다시 확인해 보세요.'}
          </div>
        )}
      </div>

      {/* 필터 */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-[11px] text-gray-400 font-medium">필터:</span>
        <button
          onClick={() => setFilterPara(null)}
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
            filterPara === null ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
          }`}
        >
          전체
        </button>
        {paragraphNos.map(no => (
          <button
            key={no}
            onClick={() => setFilterPara(filterPara === no ? null : no)}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
              filterPara === no ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
            }`}
          >
            {no}단락
          </button>
        ))}
        {answeredCount > 0 && (
          <button
            onClick={() => setShowOnlyWrong(v => !v)}
            className={`ml-auto text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
              showOnlyWrong ? 'bg-red-500 text-white border-red-500' : 'bg-white text-red-400 border-red-200 hover:border-red-400'
            }`}
          >
            오답만 보기
          </button>
        )}
      </div>

      {/* 문항 목록 */}
      <div className="space-y-3">
        {filtered.map(q => {
          const userAnswer = userAnswers[q.id]
          const isRevealed = revealed.has(q.id)
          const isCorrect = isRevealed && userAnswer === q.answer

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                isRevealed
                  ? isCorrect
                    ? 'border-green-300'
                    : 'border-red-300'
                  : 'border-gray-200'
              }`}
            >
              {/* 문항 헤더 */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {q.paragraph_no}단락
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFFICULTY_COLOR[q.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
                    {DIFFICULTY_LABEL[q.difficulty] ?? q.difficulty}
                  </span>
                  {isRevealed && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getTrapColor(q.trap_type)}`}>
                      {q.trap_type}
                    </span>
                  )}
                  {isRevealed && (
                    <span className={`ml-auto text-xs font-black ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                      {isCorrect ? '✓ 정답' : '✗ 오답'}
                    </span>
                  )}
                </div>

                {/* 진술문 */}
                <p className="text-[13px] leading-relaxed text-gray-800 font-medium">
                  {q.statement}
                </p>
              </div>

              {/* O / X 버튼 */}
              {!isRevealed ? (
                <div className="grid grid-cols-2 border-t border-gray-100">
                  <button
                    onClick={() => handleAnswer(q.id, true)}
                    className="py-3 text-2xl font-black text-green-600 hover:bg-green-50 transition-colors border-r border-gray-100 active:scale-95"
                  >
                    O
                  </button>
                  <button
                    onClick={() => handleAnswer(q.id, false)}
                    className="py-3 text-2xl font-black text-red-500 hover:bg-red-50 transition-colors active:scale-95"
                  >
                    X
                  </button>
                </div>
              ) : (
                <div className={`border-t px-4 py-3 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start gap-2">
                    <span className={`text-xl font-black shrink-0 mt-0.5 ${q.answer ? 'text-green-600' : 'text-red-500'}`}>
                      {q.answer ? 'O' : 'X'}
                    </span>
                    <div>
                      <p className={`text-[11px] font-bold mb-0.5 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {isCorrect ? '맞았습니다!' : `틀렸습니다. 정답은 ${q.answer ? 'O' : 'X'}입니다.`}
                      </p>
                      <p className={`text-[11px] leading-relaxed ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            해당 조건의 문항이 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
