'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

type Tool = 'pen' | 'eraser' | 'circle' | 'box' | 'triangle' | 'cross' | 'arrow' | 'underline' | 'wave' | 'highlight'
type Color = '#ef4444' | '#3b82f6' | '#22c55e' | '#f59e0b' | '#1f2937'

interface WhiteboardCanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  initialData?: string | null
  onSave?: (dataUrl: string) => void
}

const STAMP_SIZE = 18

export default function WhiteboardCanvas({ containerRef, initialData, onSave }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState<Color>('#ef4444')
  const [drawingMode, setDrawingMode] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Draggable toolbar state
  const [toolbarPos, setToolbarPos] = useState({ x: 16, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOrigin = useRef<{ mx: number; my: number; tx: number; ty: number } | null>(null)

  // Drag handlers for toolbar
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragOrigin.current) return
      const dx = e.clientX - dragOrigin.current.mx
      const dy = e.clientY - dragOrigin.current.my
      setToolbarPos({
        x: Math.max(0, dragOrigin.current.tx + dx),
        y: Math.max(0, dragOrigin.current.ty + dy),
      })
    }
    const onMouseUp = () => setIsDragging(false)
    if (isDragging) {
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging])

  // Resize canvas to match container
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect()
      const ctx = canvas.getContext('2d')
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
      canvas.width = width
      canvas.height = height
      if (imageData) ctx?.putImageData(imageData, 0, 0)
      if (initialData && !imageData) {
        const img = new Image()
        img.onload = () => ctx?.drawImage(img, 0, 0)
        img.src = initialData
      }
    })
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [containerRef, initialData])

  // Load initial data
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !initialData) return
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => ctx?.drawImage(img, 0, 0)
    img.src = initialData
  }, [initialData])

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  function drawStamp(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    if (tool === 'circle') {
      ctx.arc(x, y, STAMP_SIZE / 2, 0, Math.PI * 2); ctx.stroke()
    } else if (tool === 'box') {
      const s = STAMP_SIZE / 2
      ctx.strokeRect(x - s, y - s, STAMP_SIZE, STAMP_SIZE); ctx.stroke()
    } else if (tool === 'triangle') {
      const s = STAMP_SIZE / 2
      ctx.moveTo(x, y - s); ctx.lineTo(x + s, y + s); ctx.lineTo(x - s, y + s); ctx.closePath(); ctx.stroke()
    } else if (tool === 'cross') {
      const s = STAMP_SIZE / 2
      ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s)
      ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke()
    } else if (tool === 'arrow') {
      ctx.moveTo(x - STAMP_SIZE, y); ctx.lineTo(x + STAMP_SIZE, y)
      ctx.moveTo(x + STAMP_SIZE - 6, y - 5); ctx.lineTo(x + STAMP_SIZE, y); ctx.lineTo(x + STAMP_SIZE - 6, y + 5)
      ctx.stroke()
    } else if (tool === 'underline') {
      ctx.lineWidth = 2.5
      ctx.moveTo(x - 30, y + 10); ctx.lineTo(x + 30, y + 10); ctx.stroke()
    } else if (tool === 'wave') {
      // wavy underline
      ctx.lineWidth = 2
      const w = 40
      ctx.moveTo(x - w / 2, y + 10)
      for (let i = 0; i < 5; i++) {
        const cx = x - w / 2 + (i + 0.5) * (w / 5)
        const cy = y + 10 + (i % 2 === 0 ? -4 : 4)
        ctx.quadraticCurveTo(cx, cy, x - w / 2 + (i + 1) * (w / 5), y + 10)
      }
      ctx.stroke()
    }
  }

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingMode) return
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    setIsDrawing(true)
    lastPos.current = pos
    if (['circle', 'box', 'triangle', 'cross', 'arrow', 'underline', 'wave'].includes(tool)) drawStamp(ctx, pos.x, pos.y)
  }, [drawingMode, tool, color])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !drawingMode || !['pen', 'eraser', 'highlight'].includes(tool)) return
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.beginPath()
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = 24
    } else if (tool === 'highlight') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color + '55'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    }
    if (lastPos.current) { ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke() }
    ctx.globalCompositeOperation = 'source-over'
    lastPos.current = pos
  }, [isDrawing, drawingMode, tool, color])

  const stopDraw = useCallback(() => { setIsDrawing(false); lastPos.current = null }, [])

  const tools: { id: Tool; label: string; title: string }[] = [
    { id: 'pen', label: '✏️', title: '펜' },
    { id: 'highlight', label: '형광', title: '형광펜' },
    { id: 'underline', label: '—', title: '밑줄' },
    { id: 'wave', label: '〜', title: '물결 밑줄' },
    { id: 'circle', label: '○', title: '동그라미' },
    { id: 'box', label: '□', title: '네모' },
    { id: 'triangle', label: '△', title: '세모' },
    { id: 'arrow', label: '→', title: '화살표' },
    { id: 'cross', label: '✕', title: '가위표' },
    { id: 'eraser', label: '지우개', title: '지우개' },
  ]

  const colors: { value: Color; bg: string }[] = [
    { value: '#ef4444', bg: '#ef4444' },
    { value: '#3b82f6', bg: '#3b82f6' },
    { value: '#22c55e', bg: '#22c55e' },
    { value: '#f59e0b', bg: '#f59e0b' },
    { value: '#1f2937', bg: '#1f2937' },
  ]

  return (
    <>
      {/* Fixed draggable toolbar — stays visible while scrolling */}
      <div
        style={{
          position: 'fixed',
          left: toolbarPos.x,
          top: toolbarPos.y,
          zIndex: 50,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={e => {
          // Only start drag if clicking on the toolbar background (not buttons)
          if ((e.target as HTMLElement).tagName === 'BUTTON') return
          e.stopPropagation()
          setIsDragging(true)
          dragOrigin.current = { mx: e.clientX, my: e.clientY, tx: toolbarPos.x, ty: toolbarPos.y }
        }}
      >
        <div className="flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-lg">
          {/* Drag handle */}
          <span className="text-gray-300 text-sm select-none pr-1" title="드래그해서 이동">⠿</span>
          <button
            onClick={() => setDrawingMode(d => !d)}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
              drawingMode ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {drawingMode ? '✏️ 필기 ON' : '✏️ 필기'}
          </button>
          {drawingMode && (
            <>
              <div className="w-px h-5 bg-gray-200" />
              {tools.map(t => (
                <button key={t.id} onClick={() => setTool(t.id)} title={t.title}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    tool === t.id ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >{t.label}</button>
              ))}
              <div className="w-px h-5 bg-gray-200" />
              {colors.map(c => (
                <button key={c.value} onClick={() => setColor(c.value)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c.value ? 'border-gray-800 scale-125' : 'border-transparent hover:scale-110'}`}
                  style={{ backgroundColor: c.bg }}
                />
              ))}
              <div className="w-px h-5 bg-gray-200" />
              <button onClick={() => {
                const canvas = canvasRef.current!
                canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
              }} className="text-xs text-red-400 hover:text-red-600 px-1">지우기</button>
              {onSave && (
                <button onClick={() => onSave(canvasRef.current!.toDataURL('image/png'))}
                  className="text-xs bg-emerald-600 text-white px-2 py-1 rounded-lg hover:bg-emerald-700"
                >저장</button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          pointerEvents: drawingMode ? 'all' : 'none',
          cursor: drawingMode ? (tool === 'eraser' ? 'cell' : 'crosshair') : 'default',
          touchAction: 'none',
        }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
    </>
  )
}
