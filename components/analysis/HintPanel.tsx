'use client'

import { useState } from 'react'
import type { AnalysisResult } from '@/types'

interface HintPanelProps {
  analysis: AnalysisResult
}

interface Hint {
  label: string
  content: React.ReactNode
}

export default function HintPanel({ analysis }: HintPanelProps) {
  const [revealed, setRevealed] = useState(0)

  const hints: Hint[] = [
    {
      label: '1단계 힌트: 화제',
      content: (
        <p className="text-gray-800 font-medium">{analysis.macro.topic}</p>
      ),
    },
    {
      label: '2단계 힌트: 핵심 개념',
      content: (
        <div className="flex flex-wrap gap-2">
          {analysis.paragraphs.flatMap(p => p.keywords || []).slice(0, 5).map((kw, i) => (
            <span key={i} className="hl-yellow px-2 py-1 rounded text-sm font-medium">{kw}</span>
          ))}
        </div>
      ),
    },
    {
      label: '3단계 힌트: 대립 구조',
      content: analysis.compare_cards?.length > 0 ? (
        <div className="flex gap-4 items-center">
          <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg font-medium">
            {analysis.compare_cards[0].person_a}
          </span>
          <span className="text-2xl text-gray-400">↔</span>
          <span className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-lg font-medium">
            {analysis.compare_cards[0].person_b}
          </span>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">이 지문에는 대립 구조가 없습니다</p>
      ),
    },
    {
      label: '4단계 힌트: 출제 예상 포인트',
      content: (
        <ul className="space-y-2">
          {(analysis.exam_points || []).slice(0, 3).map((ep, i) => (
            <li key={i} className="flex gap-2 items-start text-sm">
              <span className="shrink-0 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs font-medium">
                ★ {ep.type}
              </span>
              <span className="text-gray-700">{ep.text}</span>
            </li>
          ))}
        </ul>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      {hints.map((hint, i) => (
        <div
          key={i}
          className={`border rounded-xl overflow-hidden transition-all ${
            i < revealed ? 'border-indigo-200' : 'border-gray-200'
          }`}
        >
          <div
            className={`px-4 py-3 flex items-center justify-between ${
              i < revealed ? 'bg-indigo-50' : 'bg-gray-50'
            }`}
          >
            <span className={`font-medium text-sm ${i < revealed ? 'text-indigo-700' : 'text-gray-500'}`}>
              {hint.label}
            </span>
            {i >= revealed && (
              <span className="text-xs text-gray-400">🔒 잠김</span>
            )}
          </div>
          {i < revealed && (
            <div className="px-4 py-3 fade-in">
              {hint.content}
            </div>
          )}
        </div>
      ))}

      {revealed < hints.length && (
        <button
          onClick={() => setRevealed(r => r + 1)}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          다음 힌트 보기 ({revealed}/{hints.length})
        </button>
      )}
      {revealed === hints.length && (
        <p className="text-center text-sm text-gray-400 py-2">모든 힌트를 확인했습니다</p>
      )}
    </div>
  )
}
