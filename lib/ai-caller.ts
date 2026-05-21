// Shared utility for calling AI providers — used by multiple API routes

export interface AICallOptions {
  maxOutputTokens?: number
  temperature?: number
}

export async function callAIProvider(
  provider: string,
  apiKey: string,
  prompt: string,
  userData: Record<string, string | null>,
  options: AICallOptions = {}
): Promise<string> {
  const temperature = options.temperature ?? 0.4

  if (provider === 'gemini') {
    const model = userData.gemini_model || 'gemini-2.5-flash-lite'
    const generationConfig: Record<string, number> = { temperature }
    if (options.maxOutputTokens) generationConfig.maxOutputTokens = options.maxOutputTokens
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig,
        }),
      }
    )
    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`)
    const data = await res.json()
    // Gemini 2.5 models may return thinking parts (thought: true) before actual content
    type GeminiPart = { text: string; thought?: boolean }
    const parts: GeminiPart[] = (data.candidates as Array<{ content: { parts: GeminiPart[] } }>)[0].content.parts
    const textPart = parts.find(p => !p.thought) ?? parts[0]
    return textPart.text
  }

  if (provider === 'openrouter') {
    const model = userData.openrouter_model || 'google/gemini-2.5-flash'
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        ...(options.maxOutputTokens ? { max_tokens: options.maxOutputTokens } : {}),
      }),
    })
    if (!res.ok) throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return (data.choices as Array<{ message: { content: string } }>)[0].message.content
  }

  if (provider === 'claude') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7-20260416',
        max_tokens: options.maxOutputTokens ?? 8192,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) throw new Error(`Claude error ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return (data.content as Array<{ text: string }>)[0].text
  }

  throw new Error(`Unknown provider: ${provider}`)
}
