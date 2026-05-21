'use client'

import type { CompareCard } from '@/types'

interface CompareCardViewProps {
  compareCards: CompareCard[]
}

export default function CompareCardView({ compareCards }: CompareCardViewProps) {
  if (!compareCards || compareCards.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
        <p className="text-3xl mb-2">👤</p>
        <p>이 지문에는 비교 대상 인물/개념이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {compareCards.map((card, idx) => (
        <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <div className="bg-blue-50 px-4 py-3">
              <p className="text-xs text-blue-400 font-medium mb-0.5">입장 A</p>
              <p className="font-bold text-blue-800 text-lg">{card.person_a}</p>
            </div>
            <div className="bg-orange-50 px-4 py-3">
              <p className="text-xs text-orange-400 font-medium mb-0.5">입장 B</p>
              <p className="font-bold text-orange-800 text-lg">{card.person_b}</p>
            </div>
          </div>

          {/* Comparison rows */}
          <div className="divide-y divide-gray-100">
            {card.comparison_points.map((point, pIdx) => (
              <div key={pIdx} className="grid grid-cols-[1fr_auto_1fr]">
                <div className="px-4 py-3 text-sm text-gray-700 leading-relaxed bg-blue-50/30">
                  {point.a_value}
                </div>
                <div className="flex items-center justify-center px-3 bg-gray-50 border-x border-gray-100">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 whitespace-nowrap font-medium">{point.aspect}</p>
                    <p className="text-gray-300 text-lg mt-0.5">↔</p>
                  </div>
                </div>
                <div className="px-4 py-3 text-sm text-gray-700 leading-relaxed bg-orange-50/30">
                  {point.b_value}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
