'use client'

import type { AnalysisResult } from '@/types'

interface SummaryPanelProps {
  analysis: AnalysisResult
}

const FUNCTION_TAG_STYLE: Record<string, string> = {
  정의: 'bg-blue-100 text-blue-800',
  예시: 'bg-green-100 text-green-800',
  인과: 'bg-amber-100 text-amber-800',
  대조: 'bg-orange-100 text-orange-800',
  열거: 'bg-purple-100 text-purple-800',
  부연: 'bg-gray-100 text-gray-700',
  주장: 'bg-red-100 text-red-800',
  근거: 'bg-cyan-100 text-cyan-800',
}

const TEXT_TYPE_LABEL: Record<string, string> = {
  설명: '설명문',
  논증: '논증문',
  논설: '논설문',
}

const STRUCTURE_LABEL: Record<string, string> = {
  두괄: '두괄식 (결론→근거)',
  미괄: '미괄식 (근거→결론)',
  양괄: '양괄식 (결론→근거→결론)',
}

export default function SummaryPanel({ analysis }: SummaryPanelProps) {
  const { macro, paragraphs } = analysis

  return (
    <div className="space-y-6">
      {/* Macro structure */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold text-gray-800 mb-4 text-base">거시 구조</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">화제</p>
            <p className="text-sm font-semibold text-gray-800">{macro.topic}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">글의 유형</p>
            <p className="text-sm font-semibold text-indigo-700">
              {TEXT_TYPE_LABEL[macro.text_type] || macro.text_type}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">주제</p>
            <p className="text-sm text-gray-800 leading-relaxed">{macro.main_idea}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">전개 방식</p>
            <p className="text-sm text-gray-700">
              {STRUCTURE_LABEL[macro.structure] || macro.structure}
            </p>
          </div>
        </div>
      </div>

      {/* Paragraph analysis */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 text-base">단락별 분석</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {paragraphs.map((para) => (
            <div key={para.no} className="px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                  {para.no}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        FUNCTION_TAG_STYLE[para.function_tag] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {para.function_tag}
                    </span>
                    {para.keywords?.map((kw, i) => (
                      <span
                        key={i}
                        className="text-xs bg-yellow-50 text-yellow-800 border border-yellow-200 px-1.5 py-0.5 rounded"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{para.core_sentence}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
