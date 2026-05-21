'use client'

import { useState } from 'react'
import type { Annotation } from '@/types'

interface AnnotationEditorPanelProps {
  annotations: Annotation[]
  onChange: (annotations: Annotation[]) => void
  pendingText?: string       // text pre-filled from passage selection
  pendingPos?: number
  onClearPending?: () => void
}

const SYMBOLS: Annotation['symbol'][] = ['○', '□', '→', '↔', '★', '△']
const COLORS: { value: Annotation['color']; label: string; cls: string }[] = [
  { value: 'blue',   label: '파랑',  cls: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'red',    label: '빨강',  cls: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'amber',  label: '황색',  cls: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'green',  label: '초록',  cls: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'purple', label: '보라',  cls: 'bg-purple-100 text-purple-700 border-purple-300' },
]

const SYMBOL_LABEL: Record<string, string> = {
  '○': '개념어',
  '□': '정의',
  '→': '인과',
  '↔': '대조',
  '★': '출제',
  '△': '주의',
}

const COLOR_DOT: Record<string, string> = {
  blue: 'bg-blue-400', red: 'bg-red-400', amber: 'bg-amber-400',
  green: 'bg-green-400', purple: 'bg-purple-400',
}

const empty = (): Omit<Annotation, 'position'> => ({
  text: '', label: '', note: '', color: 'blue', symbol: '○',
})

export default function AnnotationEditorPanel({
  annotations,
  onChange,
  pendingText = '',
  pendingPos = 0,
  onClearPending,
}: AnnotationEditorPanelProps) {
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [addMode, setAddMode] = useState(false)
  const [form, setForm] = useState<Omit<Annotation, 'position'>>(empty())
  const [search, setSearch] = useState('')

  function openAdd(prefill?: string) {
    setForm({ ...empty(), text: prefill || '' })
    setEditIdx(null)
    setAddMode(true)
  }

  function openEdit(idx: number) {
    const ann = annotations[idx]
    setForm({ text: ann.text, label: ann.label, note: ann.note, color: ann.color, symbol: ann.symbol })
    setEditIdx(idx)
    setAddMode(false)
  }

  function handleSave() {
    if (!form.text.trim() || !form.note.trim()) return
    if (addMode) {
      onChange([...annotations, { ...form, position: pendingPos }])
      onClearPending?.()
    } else if (editIdx !== null) {
      const updated = annotations.map((a, i) =>
        i === editIdx ? { ...a, ...form } : a
      )
      onChange(updated)
    }
    setForm(empty())
    setEditIdx(null)
    setAddMode(false)
  }

  function handleDelete(idx: number) {
    onChange(annotations.filter((_, i) => i !== idx))
    if (editIdx === idx) { setEditIdx(null); setAddMode(false) }
  }

  function handleCancel() {
    setForm(empty())
    setEditIdx(null)
    setAddMode(false)
    onClearPending?.()
  }

  // Show add form when pending text arrives
  const showForm = addMode || editIdx !== null || !!pendingText

  const filtered = annotations.filter(a =>
    !search || a.text.includes(search) || a.label.includes(search) || a.note.includes(search)
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700">주석 편집 ({annotations.length}개)</p>
        <button
          onClick={() => openAdd()}
          className="text-xs bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-indigo-700"
        >
          + 추가
        </button>
      </div>

      {/* Pending text banner */}
      {pendingText && !addMode && (
        <div
          className="mb-3 p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer hover:bg-indigo-100"
          onClick={() => openAdd(pendingText)}
        >
          <p className="text-xs text-indigo-500 font-medium mb-0.5">선택된 텍스트</p>
          <p className="text-sm text-indigo-800 font-medium truncate">"{pendingText}"</p>
          <p className="text-xs text-indigo-400 mt-1">클릭하여 주석 추가</p>
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
          <p className="text-xs font-semibold text-gray-500">{editIdx !== null ? '주석 수정' : '새 주석 추가'}</p>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">대상 텍스트</label>
            <input
              value={form.text}
              onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
              placeholder="원문과 정확히 일치하는 텍스트"
              className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">라벨</label>
              <input
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="예: 핵심개념, 정의"
                className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">기호</label>
              <div className="flex gap-1 flex-wrap">
                {SYMBOLS.map(sym => (
                  <button
                    key={sym}
                    onClick={() => setForm(f => ({ ...f, symbol: sym }))}
                    title={SYMBOL_LABEL[sym]}
                    className={`w-7 h-7 rounded text-sm border transition-colors ${
                      form.symbol === sym
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">색상</label>
            <div className="flex gap-1.5">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setForm(f => ({ ...f, color: c.value }))}
                  title={c.label}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    form.color === c.value ? 'scale-125 border-gray-700' : 'border-gray-300'
                  } ${COLOR_DOT[c.value]}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">주석 내용 (해설 문장)</label>
            <textarea
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="단순 라벨이 아닌 내용을 설명하는 문장으로 작성"
              rows={2}
              className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!form.text.trim() || !form.note.trim()}
              className="flex-1 text-xs bg-indigo-600 text-white py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40"
            >
              저장
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 text-xs border border-gray-200 py-1.5 rounded-lg hover:bg-gray-100"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="주석 검색..."
        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />

      {/* Annotation list */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">주석이 없습니다</p>
        )}
        {filtered.map((ann, i) => {
          const realIdx = annotations.indexOf(ann)
          const isEditing = editIdx === realIdx
          const colCls = COLORS.find(c => c.value === ann.color)?.cls || COLORS[0].cls
          return (
            <div
              key={i}
              className={`group p-2.5 rounded-lg border cursor-pointer transition-all ${
                isEditing ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => openEdit(realIdx)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm">{ann.symbol}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${colCls}`}>
                      {ann.label || '주석'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 font-medium truncate">"{ann.text}"</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ann.note}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(realIdx) }}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-lg leading-none mt-0.5"
                >
                  ×
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
