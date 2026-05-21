'use client'

import { useState } from 'react'

export interface MarginNote {
  id: string
  paragraph_no: number
  content: string
  color: 'yellow' | 'blue' | 'pink' | 'green'
  type?: '관계' | '흐름' | '대조' | '예시' | '일반'
}

interface MarginNotesProps {
  notes: MarginNote[]
  paragraphCount: number
  onChange: (notes: MarginNote[]) => void
}

const COLOR_STYLE: Record<MarginNote['color'], string> = {
  yellow: 'bg-yellow-50 border-yellow-300 text-yellow-900',
  blue:   'bg-blue-50 border-blue-300 text-blue-900',
  pink:   'bg-pink-50 border-pink-300 text-pink-900',
  green:  'bg-green-50 border-green-300 text-green-900',
}

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  관계: { label: '관계', cls: 'bg-blue-100 text-blue-700' },
  흐름: { label: '흐름→', cls: 'bg-yellow-100 text-yellow-800' },
  대조: { label: '↔대조', cls: 'bg-pink-100 text-pink-700' },
  예시: { label: '〈예〉', cls: 'bg-green-100 text-green-700' },
  일반: { label: '메모', cls: 'bg-gray-100 text-gray-500' },
}

const COLORS: MarginNote['color'][] = ['yellow', 'blue', 'pink', 'green']

export default function MarginNotes({ notes, paragraphCount, onChange }: MarginNotesProps) {
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [draftColor, setDraftColor] = useState<MarginNote['color']>('yellow')
  const [draftType, setDraftType] = useState<MarginNote['type']>('일반')

  function startAdd(paraNo: number) {
    setAdding(paraNo)
    setDraft('')
    setDraftColor('yellow')
    setEditing(null)
  }

  function commitAdd() {
    if (!draft.trim() || adding === null) return
    onChange([...notes, {
      id: crypto.randomUUID(),
      paragraph_no: adding,
      content: draft.trim(),
      color: draftColor,
      type: draftType,
    }])
    setAdding(null)
    setDraft('')
    setDraftType('일반')
  }

  function startEdit(id: string) {
    const note = notes.find(n => n.id === id)
    if (!note) return
    setEditing(id)
    setDraft(note.content)
    setDraftColor(note.color)
    setAdding(null)
  }

  function commitEdit() {
    if (!editing) return
    onChange(notes.map(n => n.id === editing ? { ...n, content: draft, color: draftColor } : n))
    setEditing(null)
    setDraft('')
  }

  function deleteNote(id: string) {
    onChange(notes.filter(n => n.id !== id))
    if (editing === id) setEditing(null)
  }

  return (
    <div className="space-y-1 min-w-[180px] max-w-[200px]">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">여백 메모</p>
      {Array.from({ length: paragraphCount }, (_, i) => i + 1).map(paraNo => {
        const paraNotes = notes.filter(n => n.paragraph_no === paraNo)
        return (
          <div key={paraNo} className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-300 font-medium">단락 {paraNo}</span>
              <button
                onClick={() => startAdd(paraNo)}
                className="text-[10px] text-gray-300 hover:text-indigo-500 transition-colors"
              >
                + 메모
              </button>
            </div>

            {/* Existing notes */}
            {paraNotes.map(note => (
              <div key={note.id} className="group mb-1.5">
                {editing === note.id ? (
                  <div className="space-y-1">
                    <textarea
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      rows={3}
                      autoFocus
                      className="w-full text-xs border border-indigo-300 rounded p-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <div className="flex gap-1 items-center">
                      {COLORS.map(c => (
                        <button key={c} onClick={() => setDraftColor(c)}
                          className={`w-4 h-4 rounded-full border-2 ${draftColor === c ? 'border-gray-600 scale-125' : 'border-transparent'}`}
                          style={{ backgroundColor: c === 'yellow' ? '#fef08a' : c === 'blue' ? '#bfdbfe' : c === 'pink' ? '#fbcfe8' : '#bbf7d0' }}
                        />
                      ))}
                      <button onClick={commitEdit} className="ml-auto text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded">저장</button>
                      <button onClick={() => setEditing(null)} className="text-[10px] text-gray-400 px-1 py-0.5">취소</button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`relative text-xs p-2 rounded border-l-2 cursor-pointer transition-all ${COLOR_STYLE[note.color]}`}
                    onClick={() => startEdit(note.id)}
                  >
                    {note.type && note.type !== '일반' && (
                      <span className={`inline-block text-[9px] px-1 py-0.5 rounded font-semibold mr-1 ${TYPE_BADGE[note.type]?.cls ?? ''}`}>
                        {TYPE_BADGE[note.type]?.label}
                      </span>
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    <button
                      onClick={e => { e.stopPropagation(); deleteNote(note.id) }}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs transition-opacity"
                    >×</button>
                  </div>
                )}
              </div>
            ))}

            {/* Add form */}
            {adding === paraNo && (
              <div className="space-y-1">
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="메모 내용을 입력하세요"
                  className="w-full text-xs border border-indigo-300 rounded p-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <div className="flex gap-1 items-center">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setDraftColor(c)}
                      className={`w-4 h-4 rounded-full border-2 ${draftColor === c ? 'border-gray-600 scale-125' : 'border-transparent'}`}
                      style={{ backgroundColor: c === 'yellow' ? '#fef08a' : c === 'blue' ? '#bfdbfe' : c === 'pink' ? '#fbcfe8' : '#bbf7d0' }}
                    />
                  ))}
                  <button onClick={commitAdd} className="ml-auto text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded">추가</button>
                  <button onClick={() => setAdding(null)} className="text-[10px] text-gray-400 px-1 py-0.5">취소</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
