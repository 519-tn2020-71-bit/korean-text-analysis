export type ModelTier = 'free' | 'budget' | 'premium'

export interface OpenRouterModel {
  id: string
  name: string
  tier: ModelTier
  context: number
  description: string
}

export const OPENROUTER_MODELS: OpenRouterModel[] = [
  // ── Free ───────────────────────────────────────────────────────────────
  {
    id: 'deepseek/deepseek-v4-flash-20260423',
    name: 'DeepSeek V4 Flash (무료) — 추천',
    tier: 'free',
    context: 163840,
    description: '무료 · 추론 특화 · 최신',
  },
  {
    id: 'google/gemini-3.1-flash-lite-20260507',
    name: 'Gemini 3.1 Flash Lite (무료)',
    tier: 'free',
    context: 1048576,
    description: '무료 · 초고속 · Google 최신',
  },
  // ── Budget ─────────────────────────────────────────────────────────────
  {
    id: 'google/gemini-3.5-flash-20260519',
    name: 'Gemini 3.5 Flash — 분석 추천',
    tier: 'budget',
    context: 1048576,
    description: '저렴 · 빠름 · Google 최신',
  },
  {
    id: 'openai/gpt-5.4-mini-20260317',
    name: 'GPT-5.4 mini',
    tier: 'budget',
    context: 128000,
    description: '저렴 · 빠름 · OpenAI 최신',
  },
  {
    id: 'openai/gpt-5.4-nano-20260317',
    name: 'GPT-5.4 nano',
    tier: 'budget',
    context: 128000,
    description: '초저가 · 초고속 · OpenAI',
  },
  // ── Premium ────────────────────────────────────────────────────────────
  {
    id: 'anthropic/claude-opus-4.7-20260416',
    name: 'Claude Opus 4.7 — 분석 최고',
    tier: 'premium',
    context: 200000,
    description: '최고 품질 · 한국어 최우수 · 심층 분석',
  },
  {
    id: 'anthropic/claude-4.7-opus-fast-20260512',
    name: 'Claude Opus 4.7 Fast',
    tier: 'premium',
    context: 200000,
    description: '최고 품질 · 빠른 응답 · Anthropic',
  },
  {
    id: 'anthropic/claude-4.6-opus-fast-20260407',
    name: 'Claude Opus 4.6 Fast',
    tier: 'premium',
    context: 200000,
    description: '고품질 · 안정적 · Anthropic',
  },
  {
    id: 'openai/gpt-5.5-pro-20260423',
    name: 'GPT-5.5 Pro',
    tier: 'premium',
    context: 128000,
    description: '최신 OpenAI 플래그십 · 최고 성능',
  },
  {
    id: 'openai/gpt-5.5-20260423',
    name: 'GPT-5.5',
    tier: 'premium',
    context: 128000,
    description: '최신 GPT · 고성능 · OpenAI',
  },
  {
    id: 'openai/gpt-5.4-pro-20260305',
    name: 'GPT-5.4 Pro',
    tier: 'premium',
    context: 128000,
    description: '안정적 고성능 · OpenAI',
  },
  {
    id: 'openai/gpt-5.4-20260305',
    name: 'GPT-5.4',
    tier: 'premium',
    context: 128000,
    description: '균형형 최신 GPT · OpenAI',
  },
  {
    id: 'deepseek/deepseek-v4-pro-20260423',
    name: 'DeepSeek V4 Pro',
    tier: 'premium',
    context: 163840,
    description: '최강 추론 · 고성능 분석',
  },
]

export const GEMINI_MODELS = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash — 추천',
    description: '빠름 · 고품질 · 최신',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    description: '초고속 · 저비용',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: '안정적 · 검증된 모델',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: '고품질 · 긴 문맥',
  },
]
