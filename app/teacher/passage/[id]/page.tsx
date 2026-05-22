'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Passage, AnalysisResult, TeacherAnalysis, Annotation, MarginNote, ParagraphSummary } from '@/types'
import TabBar from '@/components/shared/TabBar'
import AnnotationLayer from '@/components/passage/AnnotationLayer'
import AnnotationEditorPanel from '@/components/passage/AnnotationEditorPanel'
import MarginNotes from '@/components/passage/MarginNotes'
import SummaryPanel from '@/components/analysis/SummaryPanel'
import InfographicView from '@/components/analysis/InfographicView'
import CompareCardView from '@/components/analysis/CompareCard'
import OxQuizView from '@/components/analysis/OxQuizView'

const TABS = [
  { id: 'annotation', label: '지문분석' },
  { id: 'summary', label: '단락요약' },
  { id: 'infographic', label: '인포그래픽' },
  { id: 'compare', label: '비교분석' },
  { id: 'ox', label: 'OX 문제' },
]

const STAGE_LABELS = ['비공개', '1단계', '2단계', '3단계']

export default function TeacherPassagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [passage, setPassage] = useState<Passage | null>(null)
  const [analysis, setAnalysis] = useState<TeacherAnalysis | null>(null)
  const [activeTab, setActiveTab] = useState('annotation')
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [stageLoading, setStageLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  // Editor state
  const [editMode, setEditMode] = useState(false)
  const [showBreaks, setShowBreaks] = useState(true)
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [editedAnnotations, setEditedAnnotations] = useState<Annotation[]>([])
  const [marginNotes, setMarginNotes] = useState<MarginNote[]>([])
  const [pendingText, setPendingText] = useState('')
  const [pendingPos, setPendingPos] = useState(0)
  const [isDirty, setIsDirty] = useState(false)
  const [editingQuestions, setEditingQuestions] = useState(false)
  const [questionsText, setQuestionsText] = useState('')
  const [savingQuestions, setSavingQuestions] = useState(false)
  const [exportingPptx, setExportingPptx] = useState(false)

  // 단락 중심내용 편집
  const [paragraphSummaries, setParagraphSummaries] = useState<ParagraphSummary[]>([])
  const [savingParaSummaries, setSavingParaSummaries] = useState(false)
  const [paraSummaryDirty, setParaSummaryDirty] = useState(false)

  const supabase = createClient()

  useEffect(() => { fetchPassage() }, [id])

  useEffect(() => {
    if (analysis?.analysis_json?.annotations) {
      setEditedAnnotations(analysis.analysis_json.annotations)
    }
    if (analysis?.analysis_json?.margin_notes) {
      setMarginNotes(analysis.analysis_json.margin_notes)
    }
  }, [analysis])

  useEffect(() => {
    if (passage?.paragraph_summaries?.length) {
      setParagraphSummaries(passage.paragraph_summaries)
    }
  }, [passage])

  async function fetchPassage() {
    setLoading(true)
    try {
      const { data: passageData, error: pErr } = await supabase
        .from('passages').select('*').eq('id', id).single()
      if (pErr || !passageData) { setError('지문을 찾을 수 없습니다.'); return }
      setPassage(passageData as Passage)
      setQuestionsText(passageData.questions || '')

      const { data: analysisData } = await supabase
        .from('teacher_analyses').select('*').eq('passage_id', id).single()
      if (analysisData) setAnalysis(analysisData as TeacherAnalysis)
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyze() {
    if (!passage) return
    setAnalyzeError(null)
    setAnalyzing(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passageText: passage.text, passageId: passage.id, questionsText: questionsText || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setAnalyzeError(data.error ?? 'AI 분석 중 오류가 발생했습니다.'); return }
      await fetchPassage()
      setIsDirty(false)
    } catch {
      setAnalyzeError('네트워크 오류가 발생했습니다.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleStageChange(newStage: number) {
    if (!analysis) return
    setStageLoading(true)
    try {
      const { error: updateError } = await supabase
        .from('teacher_analyses')
        .update({ stage_released: newStage })
        .eq('id', analysis.id)
      if (updateError) throw updateError
      setAnalysis({ ...analysis, stage_released: newStage as 0 | 1 | 2 | 3 })
    } catch {
      alert('단계 변경 중 오류가 발생했습니다.')
    } finally {
      setStageLoading(false)
    }
  }

  async function handleSaveAnnotations() {
    if (!analysis) return
    setSaving(true)
    try {
      const updatedJson = { ...analysis.analysis_json, annotations: editedAnnotations, margin_notes: marginNotes }
      const { error: updateError } = await supabase
        .from('teacher_analyses')
        .update({ analysis_json: updatedJson, updated_at: new Date().toISOString() })
        .eq('id', analysis.id)
      if (updateError) throw updateError
      setAnalysis({ ...analysis, analysis_json: updatedJson as AnalysisResult })
      setIsDirty(false)
    } catch {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveParaSummaries() {
    if (!passage) return
    setSavingParaSummaries(true)
    try {
      const { error } = await supabase
        .from('passages')
        .update({ paragraph_summaries: paragraphSummaries.filter(p => p.content.trim()) })
        .eq('id', passage.id)
      if (!error) setParaSummaryDirty(false)
    } finally {
      setSavingParaSummaries(false)
    }
  }

  async function handleExportPptx() {
    if (!passage || !analysisResult) return
    setExportingPptx(true)
    try {
      const res = await fetch('/api/export-pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageTitle: passage.title,
          passageYear: passage.year,
          passageSubject: passage.subject,
          passageText: passage.text,
          questionsText: passage.questions ?? '',
          analysisJson: analysisResult,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error ?? 'PPT 생성 실패')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${passage.title}.pptx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('PPT 내보내기 중 오류가 발생했습니다.')
    } finally {
      setExportingPptx(false)
    }
  }

  async function handleSaveQuestions() {
    if (!passage) return
    setSavingQuestions(true)
    try {
      await supabase.from('passages').update({ questions: questionsText || null }).eq('id', passage.id)
      setPassage({ ...passage, questions: questionsText || null })
      setEditingQuestions(false)
    } catch {
      alert('문제 저장 중 오류가 발생했습니다.')
    } finally {
      setSavingQuestions(false)
    }
  }

  function handleMarginNotesChange(notes: MarginNote[]) {
    setMarginNotes(notes)
    setIsDirty(true)
  }

  function handleAnnotationsChange(anns: Annotation[]) {
    setEditedAnnotations(anns)
    setIsDirty(true)
  }

  function handleTextSelect(selectedText: string, startIndex: number) {
    if (!editMode) return
    setPendingText(selectedText)
    setPendingPos(startIndex)
  }

  const analysisResult: AnalysisResult | null = analysis?.analysis_json ?? null
  const displayAnnotations = editMode ? editedAnnotations : (analysisResult?.annotations ?? [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">불러오는 중...</p>
      </div>
    </div>
  )

  if (error || !passage) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-red-500 mb-4">{error ?? '지문을 찾을 수 없습니다.'}</p>
        <Link href="/teacher/dashboard" className="text-indigo-600 hover:underline text-sm">대시보드로 돌아가기</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/teacher/dashboard" className="text-gray-400 hover:text-gray-600 text-xl shrink-0">←</Link>
            <div className="min-w-0">
              <h1 className="font-bold text-gray-800 text-sm truncate">{passage.title}</h1>
              <p className="text-xs text-gray-400">{passage.subject} · {passage.year}년</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Stage control */}
            {analysis && (
              <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg p-1">
                <span className="text-xs text-gray-400 px-1">공개</span>
                {[0, 1, 2, 3].map(stage => (
                  <button
                    key={stage}
                    onClick={() => handleStageChange(stage)}
                    disabled={stageLoading || analysis.stage_released === stage}
                    className={`text-xs px-2 py-1 rounded font-medium transition-all ${
                      analysis.stage_released === stage
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    } disabled:opacity-50`}
                  >
                    {stage === 0 ? '잠금' : `${stage}단계`}
                  </button>
                ))}
              </div>
            )}

            {/* Sentence break toggle */}
            {analysisResult?.sentence_breaks?.length && (
              <button
                onClick={() => setShowBreaks(b => !b)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  showBreaks ? 'bg-amber-100 text-amber-700 border-amber-300' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {showBreaks ? '/ 끊기 ON' : '/ 끊기 OFF'}
              </button>
            )}

            {/* Edit mode toggle */}
            {analysisResult && (
              <button
                onClick={() => {
                  if (editMode && isDirty) {
                    if (confirm('저장하지 않은 변경사항이 있습니다. 편집 모드를 종료하시겠습니까?')) {
                      setEditMode(false)
                      setEditedAnnotations(analysisResult.annotations ?? [])
                      setIsDirty(false)
                    }
                  } else {
                    setEditMode(e => !e)
                  }
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  editMode ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {editMode ? '✏️ 편집 중' : '✏️ 편집'}
              </button>
            )}

            {/* Save edited annotations */}
            {editMode && isDirty && (
              <button
                onClick={handleSaveAnnotations}
                disabled={saving}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? '저장 중...' : '💾 저장'}
              </button>
            )}

            {/* PPT 내보내기 */}
            {analysisResult && (
              <button
                onClick={handleExportPptx}
                disabled={exportingPptx}
                className="border border-orange-300 hover:bg-orange-50 text-orange-600 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50"
              >
                {exportingPptx
                  ? <><span className="w-3 h-3 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />생성 중...</>
                  : '📊 PPT 내보내기'}
              </button>
            )}

            {/* AI analyze */}
            {!analysisResult ? (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
              >
                {analyzing
                  ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />분석 중...</>
                  : '✨ AI 초안 생성'}
              </button>
            ) : (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="border border-indigo-200 hover:bg-indigo-50 text-indigo-600 text-xs font-medium px-3 py-1.5 rounded-lg"
              >
                {analyzing ? '분석 중...' : '🔄 재분석'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Status banners */}
      {analyzeError && (
        <div className="max-w-7xl mx-auto px-6 pt-3">
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{analyzeError}</div>
        </div>
      )}
      {analyzing && (
        <div className="max-w-7xl mx-auto px-6 pt-3">
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin shrink-0" />
            AI가 지문을 분석하고 있습니다. 1~2분 소요될 수 있습니다...
          </div>
        </div>
      )}
      {editMode && (
        <div className="max-w-7xl mx-auto px-6 pt-3">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg px-4 py-2">
            ✏️ 편집 모드 — 지문에서 텍스트를 드래그하면 주석을 추가할 수 있습니다. 우측 패널에서 수정/삭제하세요.
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-5">
        <div className={`grid gap-5 ${editMode ? 'grid-cols-1 lg:grid-cols-[3fr_2fr_300px]' : 'grid-cols-1 lg:grid-cols-[3fr_2fr]'}`}>

          {/* Passage text + questions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">원문 지문</h2>
              <button
                onClick={() => setEditingQuestions(q => !q)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  editingQuestions ? 'bg-violet-100 text-violet-700 border-violet-300' : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                }`}
              >
                {passage.questions ? '📝 문제 편집' : '+ 문제 추가'}
              </button>
            </div>
            {editingQuestions && (
              <div className="mb-4 p-3 bg-violet-50 border border-violet-200 rounded-xl space-y-2">
                <p className="text-xs text-violet-600 font-medium">수능 문제를 붙여넣으세요 (AI 재분석 시 선지 근거를 본문에 표시합니다)</p>
                <textarea
                  value={questionsText}
                  onChange={e => setQuestionsText(e.target.value)}
                  rows={8}
                  placeholder="문제 전체를 붙여넣으세요..."
                  className="w-full text-xs border border-violet-200 rounded-lg p-2 resize-y focus:outline-none focus:ring-1 focus:ring-violet-400 font-mono"
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveQuestions} disabled={savingQuestions}
                    className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 disabled:opacity-50">
                    {savingQuestions ? '저장 중...' : '저장'}
                  </button>
                  <button onClick={() => { setEditingQuestions(false); setQuestionsText(passage.questions || '') }}
                    className="text-xs text-gray-400 px-3 py-1.5">취소</button>
                </div>
              </div>
            )}
            {passage.questions && !editingQuestions && (
              <div className="mb-3 flex flex-wrap gap-1">
                {[1,2,3,4,5].map(n => {
                  const hasQ = analysisResult?.question_evidences?.some(qe => qe.question_no === n)
                  return hasQ ? (
                    <span key={n} className={`text-xs px-2 py-0.5 rounded-full font-medium qe-${n}`}>{n}번</span>
                  ) : null
                })}
              </div>
            )}
            <div className="passage-text text-gray-800">
              {analysisResult ? (
                <AnnotationLayer
                  text={passage.text}
                  annotations={displayAnnotations}
                  highlights={analysisResult.highlights}
                  sentenceBreaks={analysisResult.sentence_breaks}
                  questionEvidences={analysisResult.question_evidences}
                  marginNotes={marginNotes}
                  paragraphData={analysisResult.paragraphs?.map(p => ({ no: p.no, core_sentence: p.core_sentence }))}
                  showBreaks={showBreaks}
                  onTextSelect={editMode ? handleTextSelect : undefined}
                />
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{passage.text}</p>
              )}
            </div>

            {/* Collapsible margin note editor */}
            <div className="mt-4 border-t border-gray-100 pt-3">
              <button
                onClick={() => setShowNoteEditor(e => !e)}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <span>{showNoteEditor ? '▲' : '▼'}</span>
                <span>여백 메모 편집 ({marginNotes.length}개)</span>
              </button>
              {showNoteEditor && (
                <div className="mt-3">
                  <MarginNotes
                    notes={marginNotes}
                    paragraphCount={(() => { const ps = passage.text.split(/\n\n+/).filter(p=>p.trim()); return ps.length <= 1 && passage.text.includes('\n') ? passage.text.split(/\n/).filter(p=>p.trim()).length : ps.length })()}
                    onChange={handleMarginNotesChange}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Analysis tabs panel */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {!analysisResult ? (
              <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center">
                <p className="text-4xl mb-4">🤖</p>
                <p className="text-gray-500 font-medium">아직 분석 결과가 없습니다</p>
                <p className="text-gray-400 text-sm mt-1">우측 상단 "AI 초안 생성"을 눌러주세요</p>
                <Link href="/settings" className="text-indigo-500 text-xs hover:underline mt-3">설정에서 API 키 등록 →</Link>
              </div>
            ) : (
              <>
                <div className="border-b border-gray-200">
                  <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
                </div>
                <div className="p-5 overflow-y-auto max-h-[calc(100vh-200px)]">
                  {activeTab === 'annotation' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">화제</p>
                        <p className="font-bold text-indigo-900">{analysisResult.macro.topic}</p>
                        <p className="text-sm text-indigo-800 mt-1 leading-relaxed">{analysisResult.macro.main_idea}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-white text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full">{analysisResult.macro.text_type}</span>
                          <span className="text-xs bg-white text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full">{analysisResult.macro.structure}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">출제 예상 포인트</p>
                        <ul className="space-y-2">
                          {analysisResult.exam_points.map((ep, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                                ep.type === '추론' ? 'bg-purple-100 text-purple-700' :
                                ep.type === '어휘' ? 'bg-amber-100 text-amber-700' :
                                ep.type === '구조파악' ? 'bg-blue-100 text-blue-700' :
                                ep.type === '적용' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>{ep.type}</span>
                              <span className="text-gray-700">{ep.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  {activeTab === 'summary' && (
                    <div className="space-y-4">
                      {/* 단락 중심내용 편집 */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-bold text-gray-700">문단별 중심내용</p>
                            <p className="text-xs text-gray-400 mt-0.5">교사가 직접 입력·수정 가능</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            {paraSummaryDirty && (
                              <button
                                onClick={handleSaveParaSummaries}
                                disabled={savingParaSummaries}
                                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
                              >
                                {savingParaSummaries ? '저장 중...' : '저장'}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const nextNo = paragraphSummaries.length > 0
                                  ? Math.max(...paragraphSummaries.map(p => p.no)) + 1
                                  : 1
                                setParagraphSummaries(prev => [...prev, { no: nextNo, content: '' }])
                                setParaSummaryDirty(true)
                              }}
                              className="text-xs text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-50"
                            >
                              + 추가
                            </button>
                          </div>
                        </div>

                        {paragraphSummaries.length === 0 ? (
                          <div className="text-center py-6 text-gray-400 text-xs">
                            단락 중심내용이 없습니다. + 추가 버튼을 눌러 입력하세요.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {paragraphSummaries.sort((a, b) => a.no - b.no).map(para => (
                              <div key={para.no} className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center shrink-0">
                                  {para.no}
                                </span>
                                <input
                                  type="text"
                                  value={para.content}
                                  onChange={e => {
                                    setParagraphSummaries(prev => prev.map(p => p.no === para.no ? { ...p, content: e.target.value } : p))
                                    setParaSummaryDirty(true)
                                  }}
                                  placeholder={`${para.no}단락 중심내용...`}
                                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                                <button
                                  onClick={() => {
                                    setParagraphSummaries(prev => prev.filter(p => p.no !== para.no))
                                    setParaSummaryDirty(true)
                                  }}
                                  className="text-gray-300 hover:text-red-400 text-lg leading-none shrink-0"
                                >×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* AI 생성 단락 요약 */}
                      <SummaryPanel analysis={analysisResult} />
                    </div>
                  )}
                  {activeTab === 'infographic' && (
                    <InfographicView analysis={analysisResult} passageText={passage?.text} />
                  )}
                  {activeTab === 'compare' && (
                    analysisResult.compare_cards?.length > 0
                      ? <CompareCardView compareCards={analysisResult.compare_cards} />
                      : <div className="text-center py-10 text-gray-400">이 지문에는 비교 분석 대상이 없습니다</div>
                  )}
                  {activeTab === 'ox' && (
                    analysisResult.ox_questions?.length
                      ? <OxQuizView questions={analysisResult.ox_questions} />
                      : <div className="text-center py-10 text-gray-400">
                          <p className="font-medium">OX 문제가 없습니다</p>
                          <p className="text-xs mt-1">지문을 다시 분석하면 OX 문제가 생성됩니다</p>
                        </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Annotation editor panel (edit mode only) */}
          {editMode && analysisResult && (
            <div className="bg-white rounded-xl border border-emerald-200 p-4 flex flex-col" style={{ height: 'calc(100vh - 120px)', position: 'sticky', top: '80px' }}>
              <AnnotationEditorPanel
                annotations={editedAnnotations}
                onChange={handleAnnotationsChange}
                pendingText={pendingText}
                pendingPos={pendingPos}
                onClearPending={() => { setPendingText(''); setPendingPos(0) }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
