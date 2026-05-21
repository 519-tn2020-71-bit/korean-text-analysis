'use client'

import AnnotationLayer from './AnnotationLayer'
import type { TeacherAnalysis, StudentActivity } from '@/types'

interface CompareViewProps {
  teacherAnalysis: TeacherAnalysis
  studentActivity: StudentActivity | null
  passageText: string
}

export default function CompareView({ teacherAnalysis, studentActivity, passageText }: CompareViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: Student */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-emerald-50 px-4 py-2 border-b border-gray-200">
          <h3 className="font-semibold text-emerald-800">📝 내 화이트보드</h3>
        </div>
        <div className="p-4">
          {studentActivity?.whiteboard_data ? (
            <img
              src={studentActivity.whiteboard_data}
              alt="내 필기"
              className="w-full rounded border border-gray-100"
            />
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">저장된 화이트보드가 없습니다</p>
          )}
          {studentActivity?.text_memos && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-xs text-yellow-700 font-medium mb-1">메모</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{studentActivity.text_memos}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Teacher analysis */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-indigo-50 px-4 py-2 border-b border-gray-200">
          <h3 className="font-semibold text-indigo-800">🏫 선생님 분석</h3>
        </div>
        <div className="p-4 max-h-[600px] overflow-y-auto">
          {teacherAnalysis.analysis_json?.annotations ? (
            <AnnotationLayer
              text={passageText}
              annotations={teacherAnalysis.analysis_json.annotations}
            />
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">분석 정보가 없습니다</p>
          )}
        </div>
      </div>
    </div>
  )
}
