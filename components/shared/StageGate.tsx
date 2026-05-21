'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface StageGateProps {
  passageId: string
  requiredStage: number
  children: React.ReactNode
}

export default function StageGate({ passageId, requiredStage, children }: StageGateProps) {
  const [stageReleased, setStageReleased] = useState<number>(0)
  const [justUnlocked, setJustUnlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    supabase
      .from('teacher_analyses')
      .select('stage_released')
      .eq('passage_id', passageId)
      .single()
      .then(({ data }) => {
        if (data) setStageReleased(data.stage_released)
        setLoading(false)
      })

    // Realtime subscription
    const channel = supabase
      .channel(`stage-${passageId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teacher_analyses',
          filter: `passage_id=eq.${passageId}`,
        },
        (payload) => {
          const newStage = (payload.new as { stage_released: number }).stage_released
          if (newStage >= requiredStage && stageReleased < requiredStage) {
            setJustUnlocked(true)
            setTimeout(() => setJustUnlocked(false), 1000)
          }
          setStageReleased(newStage)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [passageId, requiredStage])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (stageReleased < requiredStage) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-gray-500">
        <div className="text-5xl">🔒</div>
        <p className="text-lg font-medium">선생님이 아직 공개하지 않았어요</p>
        <p className="text-sm text-gray-400">선생님이 공개하면 자동으로 열립니다</p>
      </div>
    )
  }

  return (
    <div className={justUnlocked ? 'fade-in' : ''}>
      {justUnlocked && (
        <div className="text-center py-2 text-green-600 font-medium text-sm animate-bounce">
          🔓 선생님이 공개했습니다!
        </div>
      )}
      {children}
    </div>
  )
}
