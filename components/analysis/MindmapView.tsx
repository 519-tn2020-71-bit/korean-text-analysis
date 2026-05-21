'use client'

import type { AnalysisResult } from '@/types'

interface MindmapViewProps {
  analysis: AnalysisResult
}

const ROOT_W = 160
const ROOT_H = 48
const NODE_W = 200
const NODE_H = 44
const H_GAP = 80
const V_GAP = 16
const PAD = 20

const NODE_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  정의:   { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' },
  예시:   { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
  인과:   { bg: '#fffbeb', border: '#f59e0b', text: '#b45309' },
  대조:   { bg: '#fff7ed', border: '#f97316', text: '#c2410c' },
  열거:   { bg: '#faf5ff', border: '#a855f7', text: '#7e22ce' },
  부연:   { bg: '#f9fafb', border: '#6b7280', text: '#374151' },
  주장:   { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c' },
  근거:   { bg: '#ecfeff', border: '#06b6d4', text: '#0e7490' },
  결론:   { bg: '#f0fdf4', border: '#16a34a', text: '#15803d' },
  concept:{ bg: '#eef2ff', border: '#6366f1', text: '#4338ca' },
  detail: { bg: '#f9fafb', border: '#9ca3af', text: '#374151' },
  example:{ bg: '#f0fdf4', border: '#86efac', text: '#166534' },
}

function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = []
  let cur = ''
  for (const ch of text) {
    cur += ch
    if (cur.length >= maxChars) {
      lines.push(cur)
      cur = ''
    }
  }
  if (cur) lines.push(cur)
  return lines
}

export default function MindmapView({ analysis }: MindmapViewProps) {
  const paragraphs = analysis.paragraphs || []

  // Calculate dynamic heights per node (wrap text)
  const MAX_CHARS = 14
  const LINE_H = 16
  const nodeHeights = paragraphs.map(p => {
    const lines = wrapText(p.core_sentence?.slice(0, 56) || `단락 ${p.no}`, MAX_CHARS)
    return Math.max(NODE_H, lines.length * LINE_H + 20)
  })

  // Root vertical center
  const totalH = nodeHeights.reduce((s, h) => s + h + V_GAP, -V_GAP)
  const rootY = PAD + Math.max(0, totalH / 2 - ROOT_H / 2)

  // Node positions
  let curY = PAD
  const nodePositions = paragraphs.map((_, i) => {
    const y = curY
    curY += nodeHeights[i] + V_GAP
    return y
  })

  const svgW = PAD + ROOT_W + H_GAP + NODE_W + PAD
  const svgH = Math.max(rootY + ROOT_H + PAD, curY + PAD)

  const rootX = PAD
  const nodeX = PAD + ROOT_W + H_GAP

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 overflow-auto">
      <h3 className="font-bold text-gray-800 mb-3 text-sm">핵심 개념 관계도</h3>
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        width={svgW}
        height={svgH}
        style={{ minWidth: svgW }}
      >
        <defs>
          <marker id="arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M 0 0 L 7 3.5 L 0 7 Z" fill="#d1d5db" />
          </marker>
        </defs>

        {/* Root node */}
        <rect
          x={rootX} y={rootY}
          width={ROOT_W} height={ROOT_H}
          rx={10}
          fill="#4f46e5"
        />
        <text
          x={rootX + ROOT_W / 2}
          y={rootY + ROOT_H / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={13}
          fontWeight="700"
          fill="#fff"
        >
          {(analysis.macro.topic || '화제').slice(0, 12)}
        </text>

        {/* Edges + child nodes */}
        {paragraphs.map((para, i) => {
          const ny = nodePositions[i]
          const nh = nodeHeights[i]
          const nodeMidY = ny + nh / 2
          const rootMidY = rootY + ROOT_H / 2

          const x1 = rootX + ROOT_W
          const y1 = rootMidY
          const x2 = nodeX
          const y2 = nodeMidY
          const mx = (x1 + x2) / 2

          const style = NODE_COLOR[para.function_tag] || NODE_COLOR.concept
          const lines = wrapText(para.core_sentence?.slice(0, 56) || `단락 ${para.no}`, MAX_CHARS)

          return (
            <g key={para.no}>
              {/* Edge */}
              <path
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={1.5}
                markerEnd="url(#arr)"
              />

              {/* Function tag label on edge */}
              {para.function_tag && (
                <text
                  x={mx}
                  y={(y1 + y2) / 2 - 5}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#9ca3af"
                >
                  {para.function_tag}
                </text>
              )}

              {/* Node box */}
              <rect
                x={nodeX} y={ny}
                width={NODE_W} height={nh}
                rx={7}
                fill={style.bg}
                stroke={style.border}
                strokeWidth={1.5}
              />

              {/* Para number badge */}
              <circle cx={nodeX + 12} cy={ny + 12} r={9} fill={style.border} />
              <text
                x={nodeX + 12} y={ny + 12}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fontWeight="700"
                fill="#fff"
              >
                {para.no}
              </text>

              {/* Node text (wrapped) */}
              {lines.map((line, li) => (
                <text
                  key={li}
                  x={nodeX + 26}
                  y={ny + (nh - lines.length * LINE_H) / 2 + li * LINE_H + LINE_H * 0.75}
                  fontSize={11}
                  fill={style.text}
                >
                  {line}
                </text>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
