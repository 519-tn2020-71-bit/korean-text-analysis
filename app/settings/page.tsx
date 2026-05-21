'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { OPENROUTER_MODELS } from '@/lib/models'

type Provider = 'gemini' | 'openrouter' | 'claude'

const PROVIDER_INFO = {
  gemini: {
    label: 'Google Gemini (무료 가능)',
    description: 'Google AI Studio에서 무료 API 키 발급. 일 최대 1,000회 무료.',
    keyPlaceholder: 'AIza...',
    docsUrl: 'https://aistudio.google.com/apikey',
  },
  openrouter: {
    label: 'OpenRouter (다양한 모델)',
    description: '하나의 키로 Claude, GPT, Gemini 등 다양한 모델 사용.',
    keyPlaceholder: 'sk-or-...',
    docsUrl: 'https://openrouter.ai/keys',
  },
  claude: {
    label: 'Claude API (Anthropic 직접)',
    description: '한국어 분석 최고 품질. Anthropic 콘솔에서 발급.',
    keyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/keys',
  },
}

const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (무료, 일 1,000회) — 추천' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (무료, 일 250회) — 품질 우수' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (무료, 일 100회) — 최고 품질' },
]

const TIER_LABEL: Record<string, string> = {
  free: '무료 모델 (크레딧 불필요)',
  budget: '저가 유료 (지문당 1~5원)',
  premium: '프리미엄 (지문당 70원+)',
}

export default function SettingsPage() {
  const [provider, setProvider] = useState<Provider>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash-lite')
  const [openrouterModel, setOpenrouterModel] = useState('google/gemini-2.5-flash')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('users')
        .select('api_provider, gemini_model, openrouter_model')
        .eq('id', user.id)
        .single()
      if (data) {
        if (data.api_provider) setProvider(data.api_provider as Provider)
        if (data.gemini_model) setGeminiModel(data.gemini_model)
        if (data.openrouter_model) setOpenrouterModel(data.openrouter_model)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_provider: provider,
        api_key: apiKey,
        gemini_model: geminiModel,
        openrouter_model: openrouterModel,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || '저장 실패')
    } else {
      setSaved(true)
      setApiKey('')
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const info = PROVIDER_INFO[provider]
  const openrouterTiers = ['free', 'budget', 'premium'] as const

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">AI 설정</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← 홈</Link>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* Provider select */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-800 mb-3">AI 제공자 선택</h2>
          <div className="space-y-2">
            {(Object.keys(PROVIDER_INFO) as Provider[]).map(p => (
              <label
                key={p}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  provider === p ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value={p}
                  checked={provider === p}
                  onChange={() => setProvider(p)}
                  className="mt-0.5"
                />
                <div>
                  <p className="font-medium text-sm text-gray-800">{PROVIDER_INFO[p].label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{PROVIDER_INFO[p].description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-800 mb-1">API 키</h2>
          <a
            href={info.docsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-600 hover:underline"
          >
            {provider === 'gemini' ? 'Google AI Studio' : provider === 'openrouter' ? 'OpenRouter' : 'Anthropic Console'}에서 무료/유료 키 발급받기 →
          </a>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={`새 키 입력 (${info.keyPlaceholder}...)`}
            className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <p className="text-xs text-gray-400 mt-1.5">기존 키를 유지하려면 비워두세요</p>
        </div>

        {/* Gemini model */}
        {provider === 'gemini' && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Gemini 모델 선택</h2>
            <div className="space-y-2">
              {GEMINI_MODELS.map(m => (
                <label key={m.id} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer ${
                  geminiModel === m.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'
                }`}>
                  <input type="radio" checked={geminiModel === m.id} onChange={() => setGeminiModel(m.id)} />
                  <span className="text-sm text-gray-700">{m.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              ⚠️ 무료 티어 사용 시 Google이 프롬프트 내용을 검토할 수 있습니다. 학생 개인정보는 입력하지 마세요.
            </div>
          </div>
        )}

        {/* OpenRouter model */}
        {provider === 'openrouter' && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">OpenRouter 모델 선택</h2>
            {openrouterTiers.map(tier => (
              <div key={tier} className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  {TIER_LABEL[tier]}
                </p>
                <div className="space-y-1.5">
                  {OPENROUTER_MODELS.filter(m => m.tier === tier).map(m => (
                    <label
                      key={m.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer ${
                        openrouterModel === m.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="or-model"
                        checked={openrouterModel === m.id}
                        onChange={() => setOpenrouterModel(m.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save button */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        {saved && (
          <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">✓ 저장되었습니다</p>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !apiKey}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '저장 중...' : '암호화하여 저장'}
        </button>
        <p className="text-xs text-center text-gray-400">API 키는 서버에서 AES-256으로 암호화되어 저장됩니다</p>
      </main>
    </div>
  )
}
